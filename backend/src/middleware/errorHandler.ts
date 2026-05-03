/**
 * Global error handler middleware
 */

import { Request, Response, NextFunction } from "express";
import { isProduction } from "../config/env";

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

const GENERIC_SERVER_ERROR = "Internal server error";

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[${statusCode}] ${message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  const clientMessage =
    isProduction() && statusCode >= 500 ? GENERIC_SERVER_ERROR : message;

  res.status(statusCode).json({
    error: clientMessage,
    statusCode,
    timestamp: new Date().toISOString(),
  });
}

export function createError(
  message: string,
  statusCode: number = 500,
): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}
