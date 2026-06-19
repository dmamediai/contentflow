import { Request, Response, NextFunction } from "express";
import prisma from "../lib/db";
import { logger } from "../lib/logger";

export interface MCPAuthRequest extends Request {
  mcpApiKey?: any;
  mcpUser?: any;
}

/**
 * Validate MCP API key
 */
export async function validateMCPApiKey(key: string) {
  if (!key) return null;

  try {
    const apiKey = await prisma.mCPApiKey.findUnique({
      where: { key },
      include: {
        user: {
          include: {
            teams: true,
          },
        },
      },
    });

    if (!apiKey || apiKey.revoked) {
      logger.warn({
        action: "mcp.auth.invalid_key",
        key: key.substring(0, 10) + "...",
      });
      return null;
    }

    // Update last used
    await prisma.mCPApiKey.update({
      where: { key },
      data: { lastUsedAt: new Date() },
    });

    return {
      apiKey,
      user: apiKey.user,
      primaryTeamId: apiKey.user.teams[0]?.id,
    };
  } catch (error) {
    logger.error({
      action: "mcp.auth.error",
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * MCP Authentication Middleware
 */
export async function mcpAuthMiddleware(
  req: MCPAuthRequest,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    return res.status(401).json({
      error: "Missing x-api-key header",
    });
  }

  const auth = await validateMCPApiKey(apiKey);

  if (!auth) {
    return res.status(401).json({
      error: "Invalid or revoked API key",
    });
  }

  req.mcpApiKey = auth.apiKey;
  req.mcpUser = {
    id: auth.user.id,
    email: auth.user.email,
    teamId: auth.primaryTeamId,
  };

  next();
}

/**
 * Generate MCP API Key
 */
export function generateMCPApiKey(): string {
  const prefix = "cfw_";
  const length = 32;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = prefix;

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}
