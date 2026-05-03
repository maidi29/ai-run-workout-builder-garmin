import { z } from "zod";

/** Must match frontend `useAI` / route handlers */
export const MAX_AI_TEXT_LENGTH = 5000;

/** ~4 MB decoded ≈ 5.5 MB base64 */
export const MAX_IMAGE_BASE64_LENGTH = Math.floor(5.5 * 1024 * 1024);

const ALLOWED_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

const optionalPace = z
  .string()
  .trim()
  .max(32, "Pace value too long")
  .optional()
  .transform((v) => (v === "" ? undefined : v));

/** Aligns with suggest-mode slider (15–180 min) */
const durationMinutes = z.coerce
  .number({
    invalid_type_error: "durationMinutes must be a number",
  })
  .int("durationMinutes must be an integer")
  .min(15, "durationMinutes must be at least 15")
  .max(180, "durationMinutes must be at most 180");

export const generateFromContextBodySchema = z.object({
  feeling: z
    .string()
    .trim()
    .min(1, "feeling is required")
    .max(200, "feeling too long"),
  goal: z.string().trim().min(1, "goal is required").max(200, "goal too long"),
  durationMinutes,
  thresholdPace: optionalPace,
  easyPace: optionalPace,
});

export const processTextMultipleBodySchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Description required")
    .max(
      MAX_AI_TEXT_LENGTH,
      `Description too long. Maximum is ${MAX_AI_TEXT_LENGTH} characters.`,
    ),
});

export const processImageMultipleBodySchema = z.object({
  imageBase64: z
    .string()
    .min(1, "Image required")
    .max(MAX_IMAGE_BASE64_LENGTH, "Image too large. Maximum size is 4 MB."),
  mimeType: z.preprocess((val) => {
    if (val === undefined || val === null || val === "") return undefined;
    if (typeof val !== "string") return val;
    return val.trim().toLowerCase();
  }, z.enum(ALLOWED_MIME).optional()),
});

// Garmin CAS tickets look like "ST-1234567-abcdef-cas". They're short-lived
// (~10s) and only valid once. We accept anything starting with ST- with a
// reasonable length cap.
export const garminExchangeTicketBodySchema = z.object({
  ticket: z
    .string()
    .trim()
    .min(8, "ticket required")
    .max(512, "ticket too long")
    .regex(/^ST-[A-Za-z0-9._\-]+$/, "invalid ticket format"),
});

export const garminRefreshTokenBodySchema = z.object({
  refresh_token: z
    .string()
    .trim()
    .min(8, "refresh_token required")
    .max(2048, "refresh_token too long"),
});

export type GenerateFromContextBody = z.infer<
  typeof generateFromContextBodySchema
>;
export type ProcessTextMultipleBody = z.infer<
  typeof processTextMultipleBodySchema
>;
export type ProcessImageMultipleBody = z.infer<
  typeof processImageMultipleBodySchema
>;
export type GarminExchangeTicketBody = z.infer<
  typeof garminExchangeTicketBodySchema
>;
export type GarminRefreshTokenBody = z.infer<
  typeof garminRefreshTokenBodySchema
>;
