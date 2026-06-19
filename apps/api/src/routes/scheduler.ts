import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { SchedulerService } from "../services/scheduler.service";
import { logger } from "../lib/logger";

const router = Router();

// Validation schemas
const schedulePostSchema = z.object({
  content: z.string().min(1).max(5000),
  socialAccountIds: z.array(z.string()).min(1),
  scheduledAt: z.string().datetime(),
  mediaIds: z.array(z.string()).optional(),
  recurrence: z.enum(["ONCE", "DAILY", "WEEKLY", "MONTHLY"]).optional(),
  recurrenceEndDate: z.string().datetime().optional(),
});

const updatePostSchema = z.object({
  content: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  socialAccountIds: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"]).optional(),
});

const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"]).optional(),
});

// Error handler
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// POST /api/scheduler/schedule - Schedule a post
router.post(
  "/schedule",
  authenticateJWT,
  teamContext,
  authorize("posts:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = schedulePostSchema.parse(req.body);

    const post = await SchedulerService.schedulePost(req.user!.teamId!, {
      ...body,
      scheduledAt: new Date(body.scheduledAt),
      recurrenceEndDate: body.recurrenceEndDate ? new Date(body.recurrenceEndDate) : undefined,
    });

    res.status(201).json({
      success: true,
      data: post,
    });
  })
);

// GET /api/scheduler/scheduled - Get all scheduled posts
router.get(
  "/scheduled",
  authenticateJWT,
  teamContext,
  authorize("posts:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const result = await SchedulerService.getScheduledPosts(
      req.user!.teamId!,
      page,
      limit,
      status
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

// GET /api/scheduler/drafts - Get draft posts
router.get(
  "/drafts",
  authenticateJWT,
  teamContext,
  authorize("posts:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await SchedulerService.getDrafts(req.user!.teamId!, page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

// GET /api/scheduler/queue - Get queue (posts publishing soon)
router.get(
  "/queue",
  authenticateJWT,
  teamContext,
  authorize("posts:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const hoursAhead = parseInt(req.query.hours as string) || 24;

    const posts = await SchedulerService.getQueue(req.user!.teamId!, hoursAhead);

    res.json({
      success: true,
      data: posts,
      count: posts.length,
    });
  })
);

// GET /api/scheduler/calendar - Get posts for calendar view
router.get(
  "/calendar",
  authenticateJWT,
  teamContext,
  authorize("posts:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = dateRangeSchema.parse({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status,
    });

    const posts = await SchedulerService.getPostsByDateRange(
      req.user!.teamId!,
      new Date(body.startDate),
      new Date(body.endDate),
      body.status
    );

    res.json({
      success: true,
      data: posts,
      count: posts.length,
    });
  })
);

// GET /api/scheduler/by-date/:date - Get posts for specific date
router.get(
  "/by-date/:date",
  authenticateJWT,
  teamContext,
  authorize("posts:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const date = new Date(req.params.date);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
      });
    }

    const posts = await SchedulerService.getPostsByDate(req.user!.teamId!, date);

    res.json({
      success: true,
      data: posts,
      count: posts.length,
    });
  })
);

// GET /api/scheduler/stats - Get schedule statistics
router.get(
  "/stats",
  authenticateJWT,
  teamContext,
  authorize("posts:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await SchedulerService.getScheduleStats(req.user!.teamId!);

    res.json({
      success: true,
      data: stats,
    });
  })
);

// GET /api/scheduler/best-times/:platform - Get best times to post
router.get(
  "/best-times/:platform",
  authenticateJWT,
  teamContext,
  authorize("posts:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const times = await SchedulerService.getBestTimes(
      req.user!.teamId!,
      req.params.platform.toUpperCase()
    );

    res.json({
      success: true,
      data: { platform: req.params.platform, bestTimes: times },
    });
  })
);

// PUT /api/scheduler/:postId - Update scheduled post
router.put(
  "/:postId",
  authenticateJWT,
  teamContext,
  authorize("posts:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = updatePostSchema.parse(req.body);

    const post = await SchedulerService.updatePost(
      req.user!.teamId!,
      req.params.postId,
      {
        ...body,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      }
    );

    res.json({
      success: true,
      data: post,
    });
  })
);

// POST /api/scheduler/:postId/move-to-draft - Move post to draft
router.post(
  "/:postId/move-to-draft",
  authenticateJWT,
  teamContext,
  authorize("posts:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const post = await SchedulerService.moveToDraft(req.user!.teamId!, req.params.postId);

    res.json({
      success: true,
      data: post,
    });
  })
);

// DELETE /api/scheduler/:postId - Delete scheduled post
router.delete(
  "/:postId",
  authenticateJWT,
  teamContext,
  authorize("posts:delete"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await SchedulerService.deletePost(req.user!.teamId!, req.params.postId);

    logger.info({
      action: "scheduler.post_deleted",
      teamId: req.user!.teamId,
      postId: req.params.postId,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
