import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { RepurposingService } from "../services/repurposing.service";
import { logger } from "../lib/logger";
import prisma from "../lib/db";

const router = Router();

const repurposeSchema = z.object({
  originalContent: z.string().min(10),
  sourceType: z.enum([
    "BLOG_TO_LINKEDIN",
    "BLOG_TO_TWITTER",
    "YOUTUBE_TO_SOCIAL",
    "PODCAST_TO_SOCIAL",
    "LONG_TO_CAROUSEL",
    "ARTICLE_TO_THREADS",
  ]),
  targetPlatforms: z.array(z.string()).optional(),
});

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/repurposing/types - Get available repurposing types
router.get(
  "/types",
  authenticateJWT,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const types = RepurposingService.getAvailableTypes();

    res.json({
      success: true,
      data: types,
    });
  })
);

// POST /api/repurposing - Repurpose content
router.post(
  "/",
  authenticateJWT,
  teamContext,
  authorize("ai:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = repurposeSchema.parse(req.body);

    const result = await RepurposingService.repurpose({
      originalContent: body.originalContent,
      sourceType: body.sourceType as any,
      targetPlatforms: body.targetPlatforms,
    });

    // Log AI usage
    await prisma.aIUsageLog.create({
      data: {
        teamId: req.user!.teamId!,
        userId: req.user!.id!,
        feature: "repurpose_content",
        inputTokens: Math.ceil(body.originalContent.length / 4),
        outputTokens: Math.ceil(JSON.stringify(result).length / 4),
        metadata: {
          sourceType: body.sourceType,
        },
      },
    });

    logger.info({
      action: "repurposing.complete",
      teamId: req.user!.teamId,
      type: body.sourceType,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
