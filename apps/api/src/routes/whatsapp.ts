import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { WhatsAppService } from "../services/whatsapp.service";
import { logger } from "../lib/logger";
import prisma from "../lib/db";

const router = Router();

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ---------------------------------------------------------------------------
// Meta webhook (public — no auth; Meta verifies via the shared verify token)
// ---------------------------------------------------------------------------

// GET /api/whatsapp/webhook - Meta verification handshake
router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// POST /api/whatsapp/webhook - incoming messages / events from Meta
router.post(
  "/webhook",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      await WhatsAppService.handleInbound(req.body);
    } catch (error) {
      logger.error({
        action: "whatsapp.webhook_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
    // Always 200 so Meta doesn't retry.
    res.sendStatus(200);
  })
);

// ---------------------------------------------------------------------------
// Dashboard endpoints (JWT-authenticated)
// ---------------------------------------------------------------------------

const connectSchema = z.object({
  phoneNumberId: z.string().min(1),
  accessToken: z.string().min(1),
  wabaId: z.string().optional(),
  displayPhoneNumber: z.string().optional(),
});

// POST /api/whatsapp/connect - connect a WhatsApp number
router.post(
  "/connect",
  authenticateJWT,
  teamContext,
  authorize("social:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = connectSchema.parse(req.body) as {
      phoneNumberId: string;
      accessToken: string;
      wabaId?: string;
      displayPhoneNumber?: string;
    };
    const account = await WhatsAppService.connectAccount(req.user!.teamId!, body);

    const base = process.env.API_URL || "https://api-ashen-beta-38.vercel.app";
    logger.info({ action: "whatsapp.connected", teamId: req.user!.teamId, accountId: account.id });

    res.status(201).json({
      success: true,
      data: {
        account: { id: account.id, displayName: account.displayName, platform: account.platform },
        webhook: {
          callbackUrl: `${base}/api/whatsapp/webhook`,
          verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "(set WHATSAPP_VERIFY_TOKEN on the server)",
        },
      },
    });
  })
);

// GET /api/whatsapp/accounts - list connected WhatsApp numbers
router.get(
  "/accounts",
  authenticateJWT,
  teamContext,
  authorize("social:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const accounts = await prisma.socialAccount.findMany({
      where: { teamId: req.user!.teamId!, platform: "WHATSAPP" },
      select: { id: true, displayName: true, platformAccountId: true, connectedAt: true },
    });
    res.json({ success: true, data: accounts });
  })
);

// ---------------------------------------------------------------------------
// Keyword auto-replies CRUD
// ---------------------------------------------------------------------------

const keywordSchema = z.object({
  keyword: z.string().min(1).max(100),
  matchType: z.enum(["EXACT", "CONTAINS", "STARTS_WITH"]).optional(),
  responseText: z.string().max(4096).optional(),
  responseMediaUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

router.get(
  "/keyword-replies",
  authenticateJWT,
  teamContext,
  authorize("social:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const rules = await prisma.keywordReply.findMany({
      where: { teamId: req.user!.teamId! },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: rules });
  })
);

router.post(
  "/keyword-replies",
  authenticateJWT,
  teamContext,
  authorize("social:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = keywordSchema.parse(req.body);
    if (!body.responseText && !body.responseMediaUrl) {
      return res.status(400).json({ success: false, error: { message: "Provide responseText or responseMediaUrl" } });
    }
    const rule = await prisma.keywordReply.create({
      data: {
        teamId: req.user!.teamId!,
        keyword: body.keyword,
        matchType: body.matchType || "CONTAINS",
        responseText: body.responseText,
        responseMediaUrl: body.responseMediaUrl,
        isActive: body.isActive ?? true,
      },
    });
    res.status(201).json({ success: true, data: rule });
  })
);

router.patch(
  "/keyword-replies/:id",
  authenticateJWT,
  teamContext,
  authorize("social:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = keywordSchema.partial().parse(req.body);
    const existing = await prisma.keywordReply.findFirst({ where: { id: req.params.id, teamId: req.user!.teamId! } });
    if (!existing) return res.status(404).json({ success: false, error: { message: "Rule not found" } });
    const rule = await prisma.keywordReply.update({ where: { id: req.params.id }, data: body });
    res.json({ success: true, data: rule });
  })
);

router.delete(
  "/keyword-replies/:id",
  authenticateJWT,
  teamContext,
  authorize("social:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const existing = await prisma.keywordReply.findFirst({ where: { id: req.params.id, teamId: req.user!.teamId! } });
    if (!existing) return res.status(404).json({ success: false, error: { message: "Rule not found" } });
    await prisma.keywordReply.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);

export default router;
