import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { PublishingService } from "../services/publishing.service";
import { logger } from "../lib/logger";

const router = Router();

const publishSchema = z.object({
  postId: z.string(),
  platforms: z.array(z.enum(["FACEBOOK", "INSTAGRAM", "LINKEDIN", "TWITTER", "THREADS"])).min(1),
});

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// POST /api/publishing/publish - Publish post to social media
router.post(
  "/publish",
  authenticateJWT,
  teamContext,
  authorize("posts:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = publishSchema.parse(req.body);

    // Get post details
    const { default: prisma } = await import("../lib/db");
    const post = await prisma.post.findUnique({
      where: { id: body.postId },
    });

    if (!post || post.teamId !== req.user!.teamId!) {
      return res.status(404).json({ error: "Post not found" });
    }

    const results = await PublishingService.publishPost({
      postId: body.postId,
      teamId: req.user!.teamId!,
      content: post.content,
      mediaUrls: [], // TODO: Get from media relations
      platforms: body.platforms as any,
    });

    logger.info({
      action: "publishing.published",
      teamId: req.user!.teamId,
      postId: body.postId,
      platforms: body.platforms,
      results,
    });

    res.json({
      success: true,
      data: results,
    });
  })
);

// GET /api/publishing/status/:postId - Get publishing status
router.get(
  "/status/:postId",
  authenticateJWT,
  teamContext,
  authorize("posts:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const status = await PublishingService.getPublishStatus(
      req.user!.teamId!,
      req.params.postId
    );

    res.json({
      success: true,
      data: status,
    });
  })
);

// POST /api/publishing/retry/:postId - Retry publishing
router.post(
  "/retry/:postId",
  authenticateJWT,
  teamContext,
  authorize("posts:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const results = await PublishingService.retryPublish(
      req.user!.teamId!,
      req.params.postId
    );

    res.json({
      success: true,
      data: results,
    });
  })
);

export default router;
