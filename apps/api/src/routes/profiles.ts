import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { ProfileService } from "../services/profile.service";
import { logger } from "../lib/logger";

const router = Router();

const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateProfileSchema = createProfileSchema.partial();

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/profiles - List profiles for the current team
router.get(
  "/",
  authenticateJWT,
  teamContext,
  authorize("social:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await ProfileService.listProfiles(req.user!.teamId!, page, limit);

    res.json({ success: true, data: result.data, pagination: result.pagination });
  })
);

// POST /api/profiles - Create a profile
router.post(
  "/",
  authenticateJWT,
  teamContext,
  authorize("social:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = createProfileSchema.parse(req.body);
    const profile = await ProfileService.createProfile(req.user!.teamId!, body);

    logger.info({ action: "profile.created", teamId: req.user!.teamId, profileId: profile.id });

    res.status(201).json({ success: true, data: profile });
  })
);

// PATCH /api/profiles/:profileId - Update a profile
router.patch(
  "/:profileId",
  authenticateJWT,
  teamContext,
  authorize("social:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = updateProfileSchema.parse(req.body);
    const profile = await ProfileService.updateProfile(req.user!.teamId!, req.params.profileId, body);

    res.json({ success: true, data: profile });
  })
);

// DELETE /api/profiles/:profileId - Delete a profile
router.delete(
  "/:profileId",
  authenticateJWT,
  teamContext,
  authorize("social:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await ProfileService.deleteProfile(req.user!.teamId!, req.params.profileId);

    logger.info({ action: "profile.deleted", teamId: req.user!.teamId, profileId: req.params.profileId });

    res.json({ success: true, data: result });
  })
);

export default router;
