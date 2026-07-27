import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiKeyRequest, requireWriteScope } from "../../middleware/apiKeyAuth";
import { ProfileService } from "../../services/profile.service";

const router = Router();

const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateProfileSchema = createProfileSchema.partial();

const asyncHandler =
  (fn: Function) => (req: ApiKeyRequest, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// POST /v1/profiles
router.post(
  "/",
  requireWriteScope,
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const body = createProfileSchema.parse(req.body);
    const profile = await ProfileService.createProfile(req.teamId!, body);
    res.status(201).json({ profile });
  })
);

// GET /v1/profiles
router.get(
  "/",
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await ProfileService.listProfiles(req.teamId!, page, limit);
    res.json({ profiles: result.data, pagination: result.pagination });
  })
);

// GET /v1/profiles/:profileId
router.get(
  "/:profileId",
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const profile = await ProfileService.getProfile(req.teamId!, req.params.profileId);
    res.json({ profile });
  })
);

// PATCH /v1/profiles/:profileId
router.patch(
  "/:profileId",
  requireWriteScope,
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const body = updateProfileSchema.parse(req.body);
    const profile = await ProfileService.updateProfile(req.teamId!, req.params.profileId, body);
    res.json({ profile });
  })
);

// DELETE /v1/profiles/:profileId
router.delete(
  "/:profileId",
  requireWriteScope,
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const result = await ProfileService.deleteProfile(req.teamId!, req.params.profileId);
    res.json(result);
  })
);

export default router;
