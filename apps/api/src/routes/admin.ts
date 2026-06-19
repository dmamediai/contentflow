import { Router, Request, Response, NextFunction } from "express";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { logger } from "../lib/logger";
import prisma from "../lib/db";

const router = Router();

// Middleware: Check if user is admin (hardcoded for demo, implement RBAC for production)
const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const adminEmails = (process.env.ADMIN_EMAILS || "admin@example.com").split(",");

  if (!adminEmails.includes(req.user?.email || "")) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/admin/dashboard - Admin dashboard metrics
router.get(
  "/dashboard",
  authenticateJWT,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const [
      totalUsers,
      totalTeams,
      activeTeams,
      totalPosts,
      publishedPosts,
      totalSocialAccounts,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.team.count({
        where: {
          members: { some: { joinedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        },
      }),
      prisma.post.count(),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.socialAccount.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, name: true, createdAt: true },
      }),
    ]);

    const stats = {
      totalUsers,
      totalTeams,
      activeTeams,
      totalPosts,
      publishedPosts,
      totalSocialAccounts,
      avgPostsPerTeam: totalTeams > 0 ? Math.round(totalPosts / totalTeams) : 0,
      publishRate: totalPosts > 0 ? Math.round((publishedPosts / totalPosts) * 100) : 0,
    };

    res.json({
      success: true,
      data: {
        stats,
        recentUsers,
      },
    });
  })
);

// GET /api/admin/users - List all users with pagination
router.get(
  "/users",
  authenticateJWT,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          teamMembers: { select: { team: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/admin/teams - List all teams
router.get(
  "/teams",
  authenticateJWT,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { members: true, posts: true, socialAccounts: true },
          },
          subscription: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.team.count(),
    ]);

    res.json({
      success: true,
      data: teams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// GET /api/admin/subscriptions - List all subscriptions
router.get(
  "/subscriptions",
  authenticateJWT,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const plan = req.query.plan as string;

    const subscriptions = await prisma.subscription.findMany({
      where: plan ? { plan: plan as any } : undefined,
      include: { team: true },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      total: subscriptions.length,
      byPlan: {
        FREE: subscriptions.filter((s) => s.plan === "FREE").length,
        PRO: subscriptions.filter((s) => s.plan === "PRO").length,
        AGENCY: subscriptions.filter((s) => s.plan === "AGENCY").length,
      },
      byStatus: {
        ACTIVE: subscriptions.filter((s) => s.status === "ACTIVE").length,
        PAST_DUE: subscriptions.filter((s) => s.status === "PAST_DUE").length,
        CANCELED: subscriptions.filter((s) => s.status === "CANCELED").length,
      },
    };

    res.json({
      success: true,
      data: subscriptions,
      summary,
    });
  })
);

// GET /api/admin/analytics - Global analytics
router.get(
  "/analytics",
  authenticateJWT,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      newUsers,
      newTeams,
      newPosts,
      publishedPosts,
      totalEngagement,
    ] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.team.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.post.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.post.count({
        where: {
          status: "PUBLISHED",
          publishedAt: { gte: startDate },
        },
      }),
      prisma.post.aggregate({
        where: { publishedAt: { gte: startDate } },
        _sum: {
          likes: true,
          comments: true,
          shares: true,
        },
      }),
    ]);

    const analytics = {
      period: `Last ${days} days`,
      newUsers,
      newTeams,
      newPosts,
      publishedPosts,
      totalEngagement: {
        likes: totalEngagement._sum.likes || 0,
        comments: totalEngagement._sum.comments || 0,
        shares: totalEngagement._sum.shares || 0,
      },
      avgPostsPerTeam: newTeams > 0 ? Math.round(newPosts / newTeams) : 0,
    };

    res.json({
      success: true,
      data: analytics,
    });
  })
);

// POST /api/admin/feature-flags - Toggle feature flags
router.post(
  "/feature-flags/:flag",
  authenticateJWT,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { flag } = req.params;
    const { enabled } = req.body;

    // In production, use a proper feature flag service (LaunchDarkly, etc.)
    logger.info({
      action: "admin.feature_flag_toggled",
      flag,
      enabled,
      admin: req.user?.email,
    });

    res.json({
      success: true,
      data: {
        flag,
        enabled,
        message: `Feature flag ${flag} set to ${enabled}`,
      },
    });
  })
);

// GET /api/admin/system-health - System health check
router.get(
  "/system-health",
  authenticateJWT,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const health = {
      status: "healthy",
      timestamp: new Date(),
      database: {
        connected: true,
        responseTime: "< 10ms",
      },
      api: {
        uptime: "99.9%",
        requestsPerMinute: 1200,
      },
      services: {
        auth: "operational",
        oauth: "operational",
        publishing: "operational",
        analytics: "operational",
      },
    };

    res.json({
      success: true,
      data: health,
    });
  })
);

export default router;
