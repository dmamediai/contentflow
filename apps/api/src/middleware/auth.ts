import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError, ErrorCodes } from "@social-media-saas/types";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    teamId?: string;
  };
}

export function authenticateJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(
      ErrorCodes.UNAUTHORIZED,
      "Missing authentication token",
      401
    );
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || "your-secret-key"
    ) as any;
    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      teamId: decoded.teamId,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(
        ErrorCodes.EXPIRED_TOKEN,
        "Token has expired",
        401
      );
    }
    throw new ApiError(
      ErrorCodes.INVALID_TOKEN,
      "Invalid authentication token",
      401
    );
  }
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.NEXTAUTH_SECRET || "your-secret-key"
      ) as any;
      req.user = {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        teamId: decoded.teamId,
      };
    } catch (error) {
      // Silently fail - user remains unauthenticated
    }
  }

  next();
}
