/**
 * AI API Routes
 * Protected by: API key, Garmin auth, rate limiting (20 req/min per IP + per user)
 */

import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { getAIService } from "../services/aiService";
import { createError } from "../middleware/errorHandler";
import { requireApiKey, requireGarminAuth } from "../middleware/aiAuth";
import {
  generateFromContextBodySchema,
  GenerateFromContextBody,
  MAX_AI_TEXT_LENGTH,
  MAX_IMAGE_BASE64_LENGTH,
  processImageMultipleBodySchema,
  ProcessImageMultipleBody,
  processTextMultipleBodySchema,
  ProcessTextMultipleBody,
} from "../validation/schemas";
import { validateBody } from "../validation/validateRequest";

export const aiRoutes = Router();

// Rate limit: 20 requests per minute per IP
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many requests. Try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-user rate limit: 20 requests per minute per authenticated Garmin user
const userRequestCounts = new Map<string, { count: number; resetAt: number }>();
const USER_RATE_LIMIT = 20;
const USER_RATE_WINDOW_MS = 60 * 1000;

function userRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = (req as any).garminUserId as string | undefined;
  if (!userId) return next();

  const now = Date.now();
  const entry = userRequestCounts.get(userId);

  if (!entry || now > entry.resetAt) {
    userRequestCounts.set(userId, {
      count: 1,
      resetAt: now + USER_RATE_WINDOW_MS,
    });
    return next();
  }

  if (entry.count >= USER_RATE_LIMIT) {
    next(createError("Too many requests. Try again in a minute.", 429));
    return;
  }

  entry.count++;
  next();
}

// Apply security middleware to all AI routes
aiRoutes.use(aiRateLimiter);
aiRoutes.use(requireApiKey);
aiRoutes.use(requireGarminAuth);
aiRoutes.use(userRateLimiter);

/**
 * POST /api/ai/generate-from-context
 * Generate a running workout from feeling, goal, duration, and optional paces
 */
aiRoutes.post(
  "/generate-from-context",
  validateBody(generateFromContextBodySchema),
  async (req: Request<{}, {}, GenerateFromContextBody>, res: Response, next: NextFunction) => {
    try {
      const { feeling, goal, durationMinutes, thresholdPace, easyPace } =
        req.body;

      const result = await getAIService().generateFromContext({
        feeling,
        goal,
        durationMinutes,
        thresholdPace,
        easyPace,
      });

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/ai/process-text-multiple
 * Extract multiple workouts from a pasted plan or weekly schedule
 */
aiRoutes.post(
  "/process-text-multiple",
  validateBody(processTextMultipleBodySchema),
  async (req: Request<{}, {}, ProcessTextMultipleBody>, res: Response, next: NextFunction) => {
    try {
      const { description } = req.body;

      const result = await getAIService().processTextMultiple(description);

      res.json({
        success: true,
        workouts: result.data,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/ai/process-image-multiple
 * Extract one or more workouts from an image (AI auto-detects count)
 */
aiRoutes.post(
  "/process-image-multiple",
  validateBody(processImageMultipleBodySchema),
  async (req: Request<{}, {}, ProcessImageMultipleBody>, res: Response, next: NextFunction) => {
    try {
      const { imageBase64, mimeType } = req.body;

      const result = await getAIService().processImageMultiple(
        imageBase64,
        mimeType,
      );

      res.json({
        success: true,
        workouts: result.data,
      });
    } catch (error) {
      next(error);
    }
  },
);

/** Re-export limits for tests / docs */
export { MAX_AI_TEXT_LENGTH, MAX_IMAGE_BASE64_LENGTH };
