/**
 * Garmin API Routes (Stateless)
 * Only handles CAS-ticket → OAuth2 token exchange. The Expo app does the
 * actual SSO login in a WebView (residential connection bypasses Cloudflare),
 * captures the ticket, and posts it here.
 */

import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { garminService } from "../services/garminService";
import {
  garminExchangeTicketBodySchema,
  GarminExchangeTicketBody,
  garminRefreshTokenBodySchema,
  GarminRefreshTokenBody,
} from "../validation/schemas";
import { validateBody } from "../validation/validateRequest";

export const garminRoutes = Router();

// 10 attempts/minute per IP. Tickets are single-use and short-lived; this
// just bounds abuse if someone replays/scrapes tickets.
const exchangeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests. Try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Refresh is more frequent than login (once per token lifetime per device);
// allow more headroom but still bound abuse.
const refreshRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many requests. Try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/garmin/exchange-ticket
 * Exchange a CAS service ticket (from the SSO embed redirect) for OAuth2
 * tokens. Backend forgets the tokens immediately after responding.
 */
garminRoutes.post(
  "/exchange-ticket",
  exchangeRateLimiter,
  validateBody(garminExchangeTicketBodySchema),
  async (
    req: Request<{}, {}, GarminExchangeTicketBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { ticket } = req.body;
      const result = await garminService.exchangeTicket(ticket);
      res.json({
        success: true,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
        userId: result.userId,
        displayName: result.displayName,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/garmin/refresh-token
 * Exchange a refresh_token for a new OAuth2 access_token. Garmin requires
 * OAuth1 consumer-key signing for this call, which the device cannot do
 * (no consumer secret), so the refresh is proxied through the backend.
 */
garminRoutes.post(
  "/refresh-token",
  refreshRateLimiter,
  validateBody(garminRefreshTokenBodySchema),
  async (
    req: Request<{}, {}, GarminRefreshTokenBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { refresh_token } = req.body;
      const result = await garminService.refreshToken(refresh_token);
      res.json({
        success: true,
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
      });
    } catch (error) {
      next(error);
    }
  },
);
