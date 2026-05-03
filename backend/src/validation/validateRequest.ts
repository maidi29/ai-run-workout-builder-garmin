import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { createError } from "../middleware/errorHandler";

function formatZodError(err: ZodError): string {
  const first = err.errors[0];
  if (!first) return "Invalid request body";
  const path = first.path.length ? `${first.path.join(".")}: ` : "";
  return `${path}${first.message}`;
}

/**
 * Express middleware: parse and validate `req.body` with a Zod schema.
 * On success, replaces `req.body` with the parsed value (coercions applied).
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(createError(formatZodError(parsed.error), 400));
      return;
    }
    req.body = parsed.data;
    next();
  };
}
