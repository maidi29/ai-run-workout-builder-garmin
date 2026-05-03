/**
 * AI Route Security Middleware
 * 1. Requires valid Garmin access token (Authorization: Bearer <token>)
 * 2. Requires API key (X-API-Key header)
 * Both must be present and valid for AI endpoints.
 */

import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { createError } from "./errorHandler";

const GARMIN_USER_PROFILE_URL =
  "https://connectapi.garmin.com/userprofile-service/socialProfile";
const USER_AGENT = "GCM-iOS-5.7.2.1";

/**
 * Validates Garmin access token by calling user profile API.
 * Returns userId if valid; throws on invalid/expired token.
 */
async function validateGarminToken(accessToken: string): Promise<string> {
  const resp = await axios.get(GARMIN_USER_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": USER_AGENT,
    },
    validateStatus: () => true,
  });

  if (resp.status === 401) {
    throw createError("Invalid or expired Garmin token", 401);
  }
  if (resp.status !== 200) {
    throw createError("Failed to validate Garmin token", 401);
  }

  const userId =
    resp.data?.userId?.toString() ||
    resp.data?.userProfilePk?.toString() ||
    resp.data?.profileId?.toString() ||
    resp.data?.id?.toString();
  if (!userId) {
    throw createError("Invalid Garmin token response", 401);
  }
  return userId;
}

/**
 * Middleware: Require valid API key in X-API-Key header
 */
export function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const apiKey = process.env.APP_API_KEY?.trim();
  if (!apiKey) {
    console.warn(
      "[AI Auth] APP_API_KEY not set - API key check disabled (development only).",
    );
    return next();
  }

  const raw = req.headers["x-api-key"];
  const provided = Array.isArray(raw) ? raw[0] : raw;
  if (!provided || provided !== apiKey) {
    throw createError("Invalid or missing API key", 401);
  }
  next();
}

/**
 * Middleware: Require valid Garmin access token in Authorization header
 */
export function requireGarminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw createError("Authorization required: Bearer token missing", 401);
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    throw createError("Authorization required: Bearer token missing", 401);
  }

  validateGarminToken(token)
    .then((userId) => {
      (req as any).garminUserId = userId;
      next();
    })
    .catch(next);
}
