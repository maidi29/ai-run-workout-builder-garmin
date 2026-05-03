/**
 * Token storage + refresh for Garmin Connect Mobile OAuth2 tokens.
 * Tokens are obtained via the SSO ticket flow (backend exchanges the
 * CAS ticket); this service handles persistence and refresh.
 */

import * as SecureStore from "expo-secure-store";
import { CONFIG } from "../constants/config";
import { apiClient } from "../api/client";
import { GarminTokenResponse } from "../types";

class GarminAuthService {
  private tokenRefreshTimeout: NodeJS.Timeout | null = null;
  private refreshPromise: Promise<GarminTokenResponse> | null = null;

  /**
   * De-duplicates concurrent refresh calls so only one network request is made.
   */
  async refreshAccessToken(refreshToken: string): Promise<GarminTokenResponse> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._doRefresh(refreshToken).finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async _doRefresh(refreshToken: string): Promise<GarminTokenResponse> {
    try {
      const data = await apiClient.garmin.refreshToken(refreshToken);
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: "Bearer",
      };
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw new Error("Failed to refresh access token");
    }
  }

  /**
   * Returns a valid access token, refreshing automatically if expired.
   */
  async ensureValidToken(): Promise<{
    accessToken: string;
    refreshToken: string;
    userId: string;
  } | null> {
    const stored = await this.getStoredTokens();
    if (!stored?.accessToken || !stored?.refreshToken) {
      return null;
    }

    const isExpired = await this.isTokenExpired();
    if (!isExpired) {
      return {
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken,
        userId: stored.userId || "",
      };
    }

    // Token expired — attempt refresh
    try {
      const newTokens = await this.refreshAccessToken(stored.refreshToken);
      const userId = stored.userId || "";
      await this.saveTokens(newTokens, userId);
      return {
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token,
        userId,
      };
    } catch {
      return null;
    }
  }

  /**
   * (Re-)initializes the refresh timer from stored token expiration.
   */
  async initializeRefreshTimer(): Promise<void> {
    const stored = await this.getStoredTokens();
    if (!stored?.refreshToken || !stored.expiresAt) return;

    const remainingMs = stored.expiresAt - Date.now();
    if (remainingMs <= 0) {
      // Already expired — try refreshing now
      try {
        await this.ensureValidToken();
      } catch {}
      return;
    }

    // Schedule refresh for (remaining - buffer) ms
    const refreshIn = Math.max(
      remainingMs - CONFIG.TIMEOUTS.TOKEN_REFRESH,
      1000,
    );
    this.scheduleTokenRefresh(
      refreshIn / 1000, // convert to seconds for scheduleTokenRefresh
      stored.refreshToken,
    );
  }

  async saveTokens(tokens: GarminTokenResponse, userId: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        tokens.access_token,
      );
      await SecureStore.setItemAsync(
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        tokens.refresh_token,
      );
      await SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.USER_ID, userId);

      const expiresAt = Date.now() + tokens.expires_in * 1000;
      await SecureStore.setItemAsync("token_expires_at", expiresAt.toString());

      this.scheduleTokenRefresh(tokens.expires_in, tokens.refresh_token);
    } catch (error) {
      console.error("Error saving tokens:", error);
      throw new Error("Failed to save authentication tokens");
    }
  }

  async saveLoginResult(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    userId: string,
    displayName?: string,
  ): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        accessToken,
      );
      await SecureStore.setItemAsync(
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        refreshToken,
      );
      await SecureStore.setItemAsync(CONFIG.STORAGE_KEYS.USER_ID, userId);
      if (displayName) {
        await SecureStore.setItemAsync("display_name", displayName);
      }
      const expiresAt = Date.now() + expiresIn * 1000;
      await SecureStore.setItemAsync("token_expires_at", expiresAt.toString());

      this.scheduleTokenRefresh(expiresIn, refreshToken);
    } catch (error) {
      console.error("Error saving login result:", error);
      throw new Error("Failed to save authentication tokens");
    }
  }

  async getStoredTokens(): Promise<{
    accessToken?: string;
    refreshToken?: string;
    userId?: string;
    displayName?: string;
    expiresAt?: number;
  } | null> {
    try {
      const accessToken = await SecureStore.getItemAsync(
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
      );
      const refreshToken = await SecureStore.getItemAsync(
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
      );

      if (!accessToken || !refreshToken) {
        return null;
      }

      const userId = await SecureStore.getItemAsync(
        CONFIG.STORAGE_KEYS.USER_ID,
      );
      const displayName = await SecureStore.getItemAsync("display_name");
      const expiresAtStr = await SecureStore.getItemAsync("token_expires_at");

      return {
        accessToken,
        refreshToken,
        userId: userId || undefined,
        displayName: displayName || undefined,
        expiresAt: expiresAtStr ? parseInt(expiresAtStr, 10) : undefined,
      };
    } catch (error) {
      console.error("Error retrieving stored tokens:", error);
      return null;
    }
  }

  async isTokenExpired(): Promise<boolean> {
    try {
      const expiresAtStr = await SecureStore.getItemAsync("token_expires_at");
      if (!expiresAtStr) return true;

      const expiresAt = parseInt(expiresAtStr, 10);
      const now = Date.now();

      // Consider token expired if it expires in less than 5 minutes
      return now + CONFIG.TIMEOUTS.TOKEN_REFRESH > expiresAt;
    } catch (error) {
      console.error("Error checking token expiry:", error);
      return true;
    }
  }

  private scheduleTokenRefresh(expiresIn: number, refreshToken: string): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    const refreshTime = expiresIn * 1000 - CONFIG.TIMEOUTS.TOKEN_REFRESH;

    this.tokenRefreshTimeout = setTimeout(
      async () => {
        try {
          const newTokens = await this.refreshAccessToken(refreshToken);
          const userId = await SecureStore.getItemAsync(
            CONFIG.STORAGE_KEYS.USER_ID,
          );
          if (userId) {
            await this.saveTokens(newTokens, userId);
          }
        } catch (error) {
          console.error("Automatic token refresh failed:", error);
        }
      },
      Math.max(refreshTime, 1000),
    ); // Ensure positive timeout
  }

  async disconnect(accessToken: string): Promise<void> {
    try {
      const response = await fetch(CONFIG.GARMIN.REGISTRATION_URL, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(`Failed to unregister from Garmin: ${response.status}`);
      }

      await this.clearAllTokens();
    } catch (error) {
      console.error("Error during disconnect:", error);
      await this.clearAllTokens();
    }
  }

  async clearStorage(): Promise<void> {
    return this.clearAllTokens();
  }

  private async clearAllTokens(): Promise<void> {
    try {
      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout);
      }

      await SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.USER_ID);
      await SecureStore.deleteItemAsync("display_name");
      await SecureStore.deleteItemAsync("token_expires_at");
      await SecureStore.deleteItemAsync(CONFIG.STORAGE_KEYS.PERMISSIONS);
      // Migration: remove credentials saved by older app versions.
      await SecureStore.deleteItemAsync("saved_username");
      await SecureStore.deleteItemAsync("saved_password");
    } catch (error) {
      console.error("Error clearing tokens:", error);
    }
  }
}

export const garminAuthService = new GarminAuthService();
