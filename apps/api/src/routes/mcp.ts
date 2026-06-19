import { Router, Response } from "express";
import { z } from "zod";
import { MCPAuthRequest, mcpAuthMiddleware } from "../mcp/auth";
import { executeMCPTool, listMCPTools, MCPContext } from "../mcp/router";
import { logger } from "../lib/logger";
import prisma from "../lib/db";

const router = Router();

// Validation schemas
const mcpToolCallSchema = z.object({
  tool: z.string(),
  input: z.record(z.any()),
});

// Error handler
const asyncHandler =
  (fn: Function) => (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// POST /api/mcp/tools - List available tools
router.get(
  "/tools",
  mcpAuthMiddleware,
  asyncHandler(async (req: MCPAuthRequest, res: Response) => {
    const tools = listMCPTools();

    res.json({
      success: true,
      tools,
    });
  })
);

// POST /api/mcp - Execute MCP tool
router.post(
  "/",
  mcpAuthMiddleware,
  asyncHandler(async (req: MCPAuthRequest, res: Response) => {
    const body = mcpToolCallSchema.parse(req.body);

    // Log request
    await prisma.mCPRequestLog.create({
      data: {
        apiKeyId: req.mcpApiKey!.id,
        userId: req.mcpUser!.id,
        toolName: body.tool,
        input: body.input,
      },
    });

    logger.info({
      action: "mcp.tool_call",
      tool: body.tool,
      user: req.mcpUser!.email,
      team: req.mcpUser!.teamId,
    });

    // Create context
    const context: MCPContext = {
      userId: req.mcpUser!.id,
      teamId: req.mcpUser!.teamId,
      email: req.mcpUser!.email,
    };

    // Execute tool
    const result = await executeMCPTool(body.tool, body.input, context);

    res.json(result);
  })
);

// GET /api/mcp/keys - List API keys (authenticated user only)
router.get(
  "/keys",
  mcpAuthMiddleware,
  asyncHandler(async (req: MCPAuthRequest, res: Response) => {
    const keys = await prisma.mCPApiKey.findMany({
      where: { userId: req.mcpUser!.id },
      select: {
        id: true,
        key: true,
        createdAt: true,
        lastUsedAt: true,
        revoked: true,
      },
    });

    res.json({
      success: true,
      keys: keys.map((k) => ({
        ...k,
        key: k.key.substring(0, 10) + "..." + k.key.substring(k.key.length - 4),
      })),
    });
  })
);

// POST /api/mcp/keys - Create new API key (authenticated user only)
router.post(
  "/keys",
  mcpAuthMiddleware,
  asyncHandler(async (req: MCPAuthRequest, res: Response) => {
    const { generateMCPApiKey } = await import("../mcp/auth");

    const newKey = generateMCPApiKey();

    const apiKey = await prisma.mCPApiKey.create({
      data: {
        key: newKey,
        userId: req.mcpUser!.id,
      },
    });

    logger.info({
      action: "mcp.key_created",
      user: req.mcpUser!.email,
    });

    res.status(201).json({
      success: true,
      apiKey: {
        id: apiKey.id,
        key: newKey,
        createdAt: apiKey.createdAt,
      },
    });
  })
);

// DELETE /api/mcp/keys/:keyId - Revoke API key
router.delete(
  "/keys/:keyId",
  mcpAuthMiddleware,
  asyncHandler(async (req: MCPAuthRequest, res: Response) => {
    const key = await prisma.mCPApiKey.findUnique({
      where: { id: req.params.keyId },
    });

    if (!key || key.userId !== req.mcpUser!.id) {
      return res.status(404).json({
        error: "API key not found",
      });
    }

    await prisma.mCPApiKey.update({
      where: { id: req.params.keyId },
      data: { revoked: true },
    });

    logger.info({
      action: "mcp.key_revoked",
      user: req.mcpUser!.email,
      keyId: req.params.keyId,
    });

    res.json({
      success: true,
      message: "API key revoked",
    });
  })
);

export default router;
