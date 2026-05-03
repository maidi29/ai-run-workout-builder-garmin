/**
 * Garmin Service (Stateless)
 * Exchanges a Garmin SSO CAS ticket (obtained by the Expo app via WebView)
 * for OAuth2 tokens. Returns the tokens to the device, which stores them
 * in expo-secure-store. The backend forgets them immediately.
 */

import crypto from "crypto";
import axios from "axios";
import OAuth from "oauth-1.0a";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { createError, ApiError } from "../middleware/errorHandler";

function getOAuthConsumer(): { key: string; secret: string } {
  const key = process.env.GARMIN_OAUTH_CONSUMER_KEY;
  const secret = process.env.GARMIN_OAUTH_CONSUMER_SECRET;
  if (!key || !secret) {
    throw createError(
      "GARMIN_OAUTH_CONSUMER_KEY and GARMIN_OAUTH_CONSUMER_SECRET must be set in backend/.env",
      500,
    );
  }
  return { key, secret };
}

const DOMAIN = "garmin.com";
const SSO_EMBED = `https://sso.${DOMAIN}/sso/embed`;

// Android-app UA used for the OAuth1/OAuth2 token exchange. Must match
// the consumer key configured in env.
const OAUTH_UA = "com.garmin.android.apps.connectmobile";

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  userId: string;
  displayName: string;
}

export interface RefreshResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

class GarminService {
  /**
   * Exchange a CAS ticket (from the SSO redirect) for OAuth2 tokens.
   * The device captures the ticket in a WebView and posts it here.
   */
  async exchangeTicket(ticket: string): Promise<LoginResult> {
    try {
      const jar = new CookieJar();
      const client = wrapper(
        axios.create({
          jar,
          validateStatus: () => true,
          maxRedirects: 10,
        }),
      );

      const oauth1 = new OAuth({
        consumer: getOAuthConsumer(),
        signature_method: "HMAC-SHA1",
        hash_function: (base: string, key: string) =>
          crypto.createHmac("sha1", key).update(base).digest("base64"),
      });

      // Step 1: Exchange ticket for OAuth1 token
      const preauthUrl = `https://connectapi.${DOMAIN}/oauth-service/oauth/preauthorized?ticket=${encodeURIComponent(ticket)}&login-url=${encodeURIComponent(SSO_EMBED)}&accepts-mfa-tokens=true`;
      const preauthReq = oauth1.authorize({ url: preauthUrl, method: "GET" });
      const preauthResp = await client.get(preauthUrl, {
        headers: {
          ...(oauth1.toHeader(preauthReq) as object),
          "User-Agent": OAUTH_UA,
        },
        responseType: "text",
        transformResponse: [(d) => d],
      });

      if (preauthResp.status !== 200) {
        console.error(
          `OAuth preauthorization failed (status ${preauthResp.status})`,
        );
        throw createError("OAuth preauthorization failed", 401);
      }

      const oauth1Params = Object.fromEntries(
        new URLSearchParams(preauthResp.data).entries(),
      );
      const { oauth_token, oauth_token_secret } = oauth1Params;
      if (!oauth_token || !oauth_token_secret) {
        throw createError("OAuth1 token exchange failed", 401);
      }

      // Step 2: Exchange OAuth1 for OAuth2
      const exchangeUrl = `https://connectapi.${DOMAIN}/oauth-service/oauth/exchange/user/2.0`;
      const exchangeReq = oauth1.authorize(
        { url: exchangeUrl, method: "POST" },
        { key: oauth_token, secret: oauth_token_secret },
      );
      const exchangeBody = new URLSearchParams({
        ...(oauth1Params.mfa_token
          ? { mfa_token: oauth1Params.mfa_token }
          : {}),
      }).toString();
      const exchangeResp = await client.post(exchangeUrl, exchangeBody, {
        headers: {
          ...(oauth1.toHeader(exchangeReq) as object),
          "User-Agent": OAUTH_UA,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (exchangeResp.status !== 200) {
        throw createError("OAuth2 exchange failed", 401);
      }

      const oauth2Data = exchangeResp.data;
      if (!oauth2Data?.access_token) {
        throw createError("OAuth2 exchange failed: no access_token", 401);
      }

      // Step 3: Get user profile
      const profileResp = await axios.get(
        `https://connectapi.${DOMAIN}/userprofile-service/socialProfile`,
        {
          headers: {
            Authorization: `Bearer ${oauth2Data.access_token}`,
            "User-Agent": OAUTH_UA,
          },
        },
      );

      const profile = profileResp.data;

      return {
        access_token: oauth2Data.access_token,
        refresh_token: oauth2Data.refresh_token,
        expires_in: oauth2Data.expires_in,
        userId:
          profile.userId?.toString() ||
          profile.userProfilePk?.toString() ||
          profile.profileId?.toString() ||
          profile.id?.toString(),
        displayName:
          profile.displayName ||
          profile.userName ||
          profile.fullName ||
          "Garmin user",
      };
    } catch (error) {
      const err = error as ApiError;
      if (err?.statusCode && err?.isOperational) throw error;
      console.error("Garmin ticket exchange failed:", error);
      throw createError("Sign-in failed. Please try logging in again.", 401);
    }
  }

  /**
   * Exchange a refresh token for a fresh OAuth2 access token.
   * Uses OAuth1 consumer-only signing (no per-user token).
   */
  async refreshToken(refreshToken: string): Promise<RefreshResult> {
    try {
      const oauth1 = new OAuth({
        consumer: getOAuthConsumer(),
        signature_method: "HMAC-SHA1",
        hash_function: (base: string, key: string) =>
          crypto.createHmac("sha1", key).update(base).digest("base64"),
      });

      const url = `https://connectapi.${DOMAIN}/oauth-service/oauth/exchange/user/2.0`;
      const body = new URLSearchParams({
        refresh_token: refreshToken,
      }).toString();

      const signed = oauth1.authorize({ url, method: "POST" });
      const resp = await axios.post(url, body, {
        headers: {
          ...(oauth1.toHeader(signed) as object),
          "User-Agent": OAUTH_UA,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        validateStatus: () => true,
      });

      if (resp.status !== 200 || !resp.data?.access_token) {
        throw createError("Token refresh failed", 401);
      }

      return {
        access_token: resp.data.access_token,
        refresh_token: resp.data.refresh_token,
        expires_in: resp.data.expires_in,
      };
    } catch (error) {
      const err = error as ApiError;
      if (err?.statusCode && err?.isOperational) throw error;
      console.error("Garmin token refresh failed:", error);
      throw createError("Token refresh failed", 401);
    }
  }
}

export const garminService = new GarminService();
