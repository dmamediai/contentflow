import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { MediaService } from "../services/media.service";
import { logger } from "../lib/logger";
import type { MediaType } from "@social-media-saas/types";

const router = Router();

// Validation schemas
const uploadMediaSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "OTHER"]),
  url: z.string().url(),
  size: z.number().min(0),
  mimeType: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
  isAiGenerated: z.boolean().optional(),
  aiModel: z.string().optional(),
  aiPrompt: z.string().optional(),
});

const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().default(10),
});

// Error handler wrapper
const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// GET /api/media - List team media
router.get(
  "/",
  authenticateJWT,
  teamContext,
  authorize("media:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as MediaType | undefined;

    const result = await MediaService.getTeamMedia(
      req.user!.teamId!,
      type,
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

// GET /api/media/search - Search media
router.get(
  "/search",
  authenticateJWT,
  teamContext,
  authorize("media:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = searchSchema.parse(req.query);

    const results = await MediaService.searchMedia(
      req.user!.teamId!,
      body.query,
      body.limit
    );

    res.json({
      success: true,
      data: results,
    });
  })
);

// GET /api/media/ai - Get AI-generated media
router.get(
  "/ai",
  authenticateJWT,
  teamContext,
  authorize("media:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await MediaService.getAiGeneratedMedia(
      req.user!.teamId!,
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

// GET /api/media/storage-usage - Get team storage usage
router.get(
  "/storage-usage",
  authenticateJWT,
  teamContext,
  authorize("media:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const usage = await MediaService.getTeamStorageUsage(req.user!.teamId!);

    res.json({
      success: true,
      data: usage,
    });
  })
);

// POST /api/media - Create media (with URL, for Supabase storage)
router.post(
  "/",
  authenticateJWT,
  teamContext,
  authorize("media:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = uploadMediaSchema.parse(req.body);

    // Validate file size
    if (!MediaService.validateFileSize(body.size)) {
      throw new Error("File size exceeds 50MB limit");
    }

    // Create media record
    const media = await MediaService.createMedia({
      teamId: req.user!.teamId!,
      ...body,
    });

    logger.info({
      action: "media.uploaded",
      teamId: req.user!.teamId,
      mediaId: media.id,
      fileName: media.name,
      size: media.size,
    });

    res.status(201).json({
      success: true,
      data: media,
    });
  })
);

// GET /api/media/:mediaId - Get media details
router.get(
  "/:mediaId",
  authenticateJWT,
  teamContext,
  authorize("media:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const media = await MediaService.getMediaById(
      req.params.mediaId,
      req.user!.teamId!
    );

    res.json({
      success: true,
      data: media,
    });
  })
);

// PUT /api/media/:mediaId - Update media
router.put(
  "/:mediaId",
  authenticateJWT,
  teamContext,
  authorize("media:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name } = z.object({ name: z.string().optional() }).parse(req.body);

    const media = await MediaService.updateMedia(
      req.params.mediaId,
      req.user!.teamId!,
      { name }
    );

    logger.info({
      action: "media.updated",
      teamId: req.user!.teamId,
      mediaId: media.id,
    });

    res.json({
      success: true,
      data: media,
    });
  })
);

// DELETE /api/media/:mediaId - Delete media
router.delete(
  "/:mediaId",
  authenticateJWT,
  teamContext,
  authorize("media:delete"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await MediaService.deleteMedia(
      req.params.mediaId,
      req.user!.teamId!
    );

    logger.info({
      action: "media.deleted",
      teamId: req.user!.teamId,
      mediaId: req.params.mediaId,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// GET /api/media/type/:type - Get media by type
router.get(
  "/type/:type",
  authenticateJWT,
  teamContext,
  authorize("media:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const type = req.params.type as MediaType;

    const media = await MediaService.getMediaByType(req.user!.teamId!, type);

    res.json({
      success: true,
      data: media,
    });
  })
);

export default router;
