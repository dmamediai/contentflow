import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { ApiKeyService } from "../services/api-key.service";
import { logger } from "../lib/logger";

const router = Router();

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scope: z.enum(["FULL", "READ_ONLY"]).optional(),
  expiresAt: z.string().datetime().optional(),
});

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// POST /api/api-keys - Create a new public API key (shown once)
router.post(
  "/",
  authenticateJWT,
  teamContext,
  authorize("admin:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = createApiKeySchema.parse(req.body);

    const apiKey = await ApiKeyService.createApiKey(req.user!.teamId!, {
      name: body.name,
      scope: body.scope,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });

    logger.info({ action: "api_key.created", teamId: req.user!.teamId, apiKeyId: apiKey.id });

    res.status(201).json({ success: true, data: apiKey });
  })
);

// GET /api/api-keys - List API keys for the team (masked)
router.get(
  "/",
  authenticateJWT,
  teamContext,
  authorize("admin:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const apiKeys = await ApiKeyService.listApiKeys(req.user!.teamId!);
    res.json({ success: true, data: apiKeys });
  })
);

// DELETE /api/api-keys/:id - Revoke an API key
router.delete(
  "/:id",
  authenticateJWT,
  teamContext,
  authorize("admin:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const apiKey = await ApiKeyService.revokeApiKey(req.user!.teamId!, req.params.id);

    logger.info({ action: "api_key.revoked", teamId: req.user!.teamId, apiKeyId: req.params.id });

    res.json({ success: true, data: apiKey });
  })
);

export default router;
