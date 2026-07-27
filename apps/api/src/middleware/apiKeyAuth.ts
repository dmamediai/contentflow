import { Request, Response, NextFunction } from "express";
import prisma from "../lib/db";
import { hashApiKey } from "../lib/crypto";
import { ApiError, ErrorCodes } from "../types";

export interface ApiKeyRequest extends Request {
  teamId?: string;
  apiKeyId?: string;
  apiKeyScope?: "FULL" | "READ_ONLY";
}

export async function apiKeyAuth(
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    const key = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!key || !key.startsWith("sk_")) {
      throw new ApiError(ErrorCodes.UNAUTHORIZED, "Missing or malformed API key", 401);
    }

    const hashedKey = hashApiKey(key);
    const apiKey = await prisma.apiKey.findUnique({ where: { hashedKey } });

    if (!apiKey || apiKey.revokedAt) {
      throw new ApiError(ErrorCodes.UNAUTHORIZED, "Invalid or revoked API key", 401);
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new ApiError(ErrorCodes.UNAUTHORIZED, "API key has expired", 401);
    }

    req.teamId = apiKey.teamId;
    req.apiKeyId = apiKey.id;
    req.apiKeyScope = apiKey.scope;

    // Fire-and-forget: don't block the request on this write.
    prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Gate write operations behind FULL scope; READ_ONLY keys get 403 on writes.
 */
export function requireWriteScope(
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.apiKeyScope === "READ_ONLY") {
    next(new ApiError(ErrorCodes.FORBIDDEN, "This API key is read-only", 403));
    return;
  }
  next();
}
