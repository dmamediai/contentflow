import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError, ErrorCodes } from "../types";
import { logger } from "../lib/logger";

export function errorHandler(
  error: Error | ApiError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error({
    error: error.message,
    path: req.path,
    method: req.method,
    stack: error.stack,
  });

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCodes.BAD_REQUEST,
        message: "Validation error",
        details: error.errors.reduce((acc, err) => {
          const path = err.path.join(".");
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>),
      },
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : error.message,
    },
  });
}
