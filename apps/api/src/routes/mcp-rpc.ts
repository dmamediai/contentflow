import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/db";
import { hashApiKey } from "../lib/crypto";
import { handleMcpMessage } from "../mcp/mcp-server";
import { MCPContext } from "../mcp/router";
import { logger } from "../lib/logger";

const router = Router();

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Authenticate an MCP request with a team API key (sk_...) — the same keys
 * minted from the dashboard's API Keys page. Returns the tool execution
 * context, or null if the key is missing/invalid/revoked/expired.
 */
async function authenticate(req: Request): Promise<MCPContext | null> {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const key = (req.headers["x-api-key"] as string) || bearer;
  if (!key || !key.startsWith("sk_")) return null;

  const apiKey = await prisma.apiKey.findUnique({ where: { hashedKey: hashApiKey(key) } });
  if (!apiKey || apiKey.revokedAt || (apiKey.expiresAt && apiKey.expiresAt < new Date())) return null;

  prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);

  const team = await prisma.team.findUnique({
    where: { id: apiKey.teamId },
    include: { creator: { select: { id: true, email: true } } },
  });

  return {
    teamId: apiKey.teamId,
    userId: team?.creator?.id || "",
    email: team?.creator?.email || "",
  };
}

// The Streamable HTTP transport uses GET to open an SSE stream. This server is
// stateless request/response only, so it declines GET per the MCP spec.
router.get("/", (_req: Request, res: Response) => {
  res.status(405).json({ error: "This MCP endpoint is POST-only (no server-initiated stream)." });
});

// POST /mcp - JSON-RPC 2.0 over Streamable HTTP (single message or batch)
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const context = await authenticate(req);
    if (!context) {
      res.setHeader("WWW-Authenticate", 'Bearer realm="ContentFlow MCP"');
      return res.status(401).json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32001, message: "Unauthorized: provide a valid ContentFlow API key (sk_...)." },
      });
    }

    const body = req.body;
    const messages = Array.isArray(body) ? body : [body];

    const responses = [];
    for (const msg of messages) {
      try {
        const response = await handleMcpMessage(msg, context);
        if (response !== null) responses.push(response);
      } catch (error) {
        logger.error({
          action: "mcp_rpc.error",
          method: msg?.method,
          error: error instanceof Error ? error.message : String(error),
        });
        responses.push({
          jsonrpc: "2.0",
          id: msg?.id ?? null,
          error: { code: -32603, message: "Internal error" },
        });
      }
    }

    // All notifications → nothing to return.
    if (responses.length === 0) return res.status(202).end();

    res.json(Array.isArray(body) ? responses : responses[0]);
  })
);

export default router;
