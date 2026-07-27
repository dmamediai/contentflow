import { Router, Request, Response, NextFunction } from "express";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { InboxService } from "../services/inbox.service";

const router = Router();

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/inbox/conversations - List conversations for the current team
router.get(
  "/conversations",
  authenticateJWT,
  teamContext,
  authorize("social:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const conversations = await InboxService.listConversations(req.user!.teamId!, {
      profileId: req.query.profileId as string | undefined,
      platform: req.query.platform as string | undefined,
      socialAccountId: req.query.accountId as string | undefined,
    });

    res.json({ success: true, data: conversations });
  })
);

// GET /api/inbox/conversations/:conversationId - Get a conversation with its messages
router.get(
  "/conversations/:conversationId",
  authenticateJWT,
  teamContext,
  authorize("social:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const conversation = await InboxService.getConversation(req.user!.teamId!, req.params.conversationId);
    res.json({ success: true, data: conversation });
  })
);

// POST /api/inbox/conversations/:conversationId/read - Mark a conversation as read
router.post(
  "/conversations/:conversationId/read",
  authenticateJWT,
  teamContext,
  authorize("social:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const conversation = await InboxService.markRead(req.user!.teamId!, req.params.conversationId);
    res.json({ success: true, data: conversation });
  })
);

export default router;
