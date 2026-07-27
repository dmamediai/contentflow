import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { WebhookService, WEBHOOK_EVENTS } from "../services/webhook.service";
import { logger } from "../lib/logger";

const router = Router();

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
});

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/webhooks - List webhooks for the current team
router.get(
  "/",
  authenticateJWT,
  teamContext,
  authorize("admin:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const webhooks = await WebhookService.listWebhooks(req.user!.teamId!);
    res.json({ success: true, data: webhooks.map(({ secret, ...rest }) => rest) });
  })
);

// POST /api/webhooks - Create a webhook (secret returned once)
router.post(
  "/",
  authenticateJWT,
  teamContext,
  authorize("admin:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = createWebhookSchema.parse(req.body);
    const webhook = await WebhookService.createWebhook(req.user!.teamId!, body);

    logger.info({ action: "webhook.created", teamId: req.user!.teamId, webhookId: webhook.id });

    res.status(201).json({ success: true, data: webhook });
  })
);

// DELETE /api/webhooks/:id - Delete a webhook
router.delete(
  "/:id",
  authenticateJWT,
  teamContext,
  authorize("admin:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await WebhookService.deleteWebhook(req.user!.teamId!, req.params.id);
    res.json({ success: true, data: result });
  })
);

export default router;
