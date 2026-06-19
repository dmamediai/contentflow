import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { authorize, requireRole, teamContext } from "../middleware/rbac";
import { TeamService } from "../services/team.service";
import { ApiError, ErrorCodes } from "@social-media-saas/types";
import { logger } from "../lib/logger";

const router = Router();

// Validation schemas
const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().optional(),
  image: z.string().url().optional(),
  description: z.string().max(500).optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
  description: z.string().max(500).optional(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

const updateMemberSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

// Error handler wrapper
const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// GET /api/teams - List user's teams
router.get(
  "/",
  authenticateJWT,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await TeamService.getUserTeams(req.user!.id, page, limit);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

// POST /api/teams - Create new team
router.post(
  "/",
  authenticateJWT,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = createTeamSchema.parse(req.body);

    const team = await TeamService.createTeam(req.user!.id, body);

    logger.info({
      action: "team.created",
      teamId: team.id,
      userId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: team,
    });
  })
);

// GET /api/teams/:teamId - Get team details
router.get(
  "/:teamId",
  authenticateJWT,
  teamContext,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const team = await TeamService.getTeamById(req.params.teamId);

    res.json({
      success: true,
      data: team,
    });
  })
);

// PUT /api/teams/:teamId - Update team
router.put(
  "/:teamId",
  authenticateJWT,
  requireRole("OWNER", "ADMIN"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = updateTeamSchema.parse(req.body);

    const team = await TeamService.updateTeam(req.params.teamId, body);

    logger.info({
      action: "team.updated",
      teamId: team.id,
      userId: req.user!.id,
    });

    res.json({
      success: true,
      data: team,
    });
  })
);

// DELETE /api/teams/:teamId - Delete team (OWNER only)
router.delete(
  "/:teamId",
  authenticateJWT,
  requireRole("OWNER"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await TeamService.deleteTeam(req.params.teamId);

    logger.info({
      action: "team.deleted",
      teamId: req.params.teamId,
      userId: req.user!.id,
    });

    res.json({
      success: true,
      data: { message: "Team deleted successfully" },
    });
  })
);

// GET /api/teams/:teamId/members - Get team members
router.get(
  "/:teamId/members",
  authenticateJWT,
  teamContext,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await TeamService.getTeamMembers(
      req.params.teamId,
      page,
      limit
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

// POST /api/teams/:teamId/members - Add team member
router.post(
  "/:teamId/members",
  authenticateJWT,
  requireRole("OWNER", "ADMIN"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = addMemberSchema.parse(req.body);

    const member = await TeamService.addTeamMember(
      req.params.teamId,
      body.email,
      body.role
    );

    logger.info({
      action: "team.member.added",
      teamId: req.params.teamId,
      newMemberId: member.userId,
      invitedBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: member,
    });
  })
);

// PUT /api/teams/:teamId/members/:userId - Update member role
router.put(
  "/:teamId/members/:userId",
  authenticateJWT,
  requireRole("OWNER", "ADMIN"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = updateMemberSchema.parse(req.body);

    // Prevent self-demotion from OWNER
    if (req.user!.id === req.params.userId && body.role !== "OWNER") {
      throw new ApiError(
        ErrorCodes.BAD_REQUEST,
        "Cannot remove yourself as owner",
        400
      );
    }

    const member = await TeamService.updateTeamMemberRole(
      req.params.teamId,
      req.params.userId,
      body.role
    );

    logger.info({
      action: "team.member.role.updated",
      teamId: req.params.teamId,
      memberId: req.params.userId,
      newRole: body.role,
      updatedBy: req.user!.id,
    });

    res.json({
      success: true,
      data: member,
    });
  })
);

// DELETE /api/teams/:teamId/members/:userId - Remove member
router.delete(
  "/:teamId/members/:userId",
  authenticateJWT,
  requireRole("OWNER", "ADMIN"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await TeamService.removeTeamMember(req.params.teamId, req.params.userId);

    logger.info({
      action: "team.member.removed",
      teamId: req.params.teamId,
      memberId: req.params.userId,
      removedBy: req.user!.id,
    });

    res.json({
      success: true,
      data: { message: "Member removed successfully" },
    });
  })
);

// GET /api/teams/:teamId/subscription - Get subscription
router.get(
  "/:teamId/subscription",
  authenticateJWT,
  authorize("subscriptions:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const subscription = await TeamService.getTeamSubscription(
      req.params.teamId
    );

    res.json({
      success: true,
      data: subscription,
    });
  })
);

export default router;
