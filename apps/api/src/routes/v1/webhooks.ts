import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiKeyRequest, requireWriteScope } from "../../middleware/apiKeyAuth";
import { WebhookService, WEBHOOK_EVENTS } from "../../services/webhook.service";

const router = Router();

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
});

const asyncHandler =
  (fn: Function) => (req: ApiKeyRequest, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// POST /v1/webhooks
router.post(
  "/",
  requireWriteScope,
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const body = createWebhookSchema.parse(req.body);
    const webhook = await WebhookService.createWebhook(req.teamId!, body);
    // secret is only ever returned on creation - store it now, it won't be shown again.
    res.status(201).json({ webhook });
  })
);

// GET /v1/webhooks
router.get(
  "/",
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const webhooks = await WebhookService.listWebhooks(req.teamId!);
    res.json({
      webhooks: webhooks.map(({ secret, ...rest }) => rest),
    });
  })
);

// DELETE /v1/webhooks/:webhookId
router.delete(
  "/:webhookId",
  requireWriteScope,
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const result = await WebhookService.deleteWebhook(req.teamId!, req.params.webhookId);
    res.json(result);
  })
);

export default router;
