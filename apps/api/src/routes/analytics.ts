import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { AnalyticsService } from "../services/analytics.service";
import { logger } from "../lib/logger";

const router = Router();

const eventSchema = z.object({
  likes: z.number().optional(),
  comments: z.number().optional(),
  shares: z.number().optional(),
  impressions: z.number().optional(),
  clicks: z.number().optional(),
});

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/analytics/post/:postId - Get metrics for a post
router.get(
  "/post/:postId",
  authenticateJWT,
  teamContext,
  authorize("analytics:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const metrics = await AnalyticsService.getPostMetrics(
      req.user!.teamId!,
      req.params.postId
    );

    res.json({
      success: true,
      data: metrics,
    });
  })
);

// POST /api/analytics/events/:postId - Record analytics event
router.post(
  "/events/:postId",
  authenticateJWT,
  teamContext,
  authorize("analytics:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = eventSchema.parse(req.body);

    await AnalyticsService.recordEvent(
      req.params.postId,
      req.user!.teamId!,
      body
    );

    res.json({
      success: true,
      message: "Event recorded",
    });
  })
);

// GET /api/analytics/team - Get team-wide analytics
router.get(
  "/team",
  authenticateJWT,
  teamContext,
  authorize("analytics:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;

    const analytics = await AnalyticsService.getTeamAnalytics(req.user!.teamId!, days);

    res.json({
      success: true,
      data: analytics,
    });
  })
);

// GET /api/analytics/platform/:platform - Get analytics by platform
router.get(
  "/platform/:platform",
  authenticateJWT,
  teamContext,
  authorize("analytics:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;

    const analytics = await AnalyticsService.getByPlatform(
      req.user!.teamId!,
      req.params.platform,
      days
    );

    res.json({
      success: true,
      data: analytics,
    });
  })
);

// GET /api/analytics/trending - Get trending posts
router.get(
  "/trending",
  authenticateJWT,
  teamContext,
  authorize("analytics:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 5;

    const posts = await AnalyticsService.getTrendingPosts(req.user!.teamId!, limit);

    res.json({
      success: true,
      data: posts,
    });
  })
);

// GET /api/analytics/growth - Get audience growth data
router.get(
  "/growth",
  authenticateJWT,
  teamContext,
  authorize("analytics:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const days = parseInt(req.query.days as string) || 90;

    const data = await AnalyticsService.getAudienceGrowth(req.user!.teamId!, days);

    res.json({
      success: true,
      data,
    });
  })
);

// GET /api/analytics/summary - Get performance summary
router.get(
  "/summary",
  authenticateJWT,
  teamContext,
  authorize("analytics:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const summary = await AnalyticsService.getPerformanceSummary(req.user!.teamId!);

    res.json({
      success: true,
      data: summary,
    });
  })
);

export default router;
