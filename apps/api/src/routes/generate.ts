import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { MediaGenerationService } from "../services/media-generation.service";

const router = Router();

const generateSchema = z.object({
  type: z.enum(["image", "video"]),
  prompt: z.string().min(1).max(4000),
  aspectRatio: z.enum(["1:1", "9:16", "16:9"]).optional(),
  duration: z.number().int().min(1).max(60).optional(),
  mode: z.string().max(40).optional(),
  imageUrl: z.string().url().optional(),
});

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function serialize(gen: any) {
  return {
    id: gen.id,
    type: gen.type,
    status: gen.status,
    model: gen.model,
    outputUrl: gen.outputUrl,
    error: gen.error,
    createdAt: gen.createdAt,
  };
}

// POST /api/generate - Start an image (sync) or video (async) generation
router.post(
  "/",
  authenticateJWT,
  teamContext,
  authorize("media:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = generateSchema.parse(req.body);
    const gen = await MediaGenerationService.create(req.user!.teamId!, {
      type: body.type,
      prompt: body.prompt,
      aspectRatio: body.aspectRatio || "1:1",
      duration: body.duration,
      mode: body.mode,
    });
    res.json({ success: true, data: serialize(gen) });
  })
);

// GET /api/generate/:id - Poll a generation's status (finalizes async video)
router.get(
  "/:id",
  authenticateJWT,
  teamContext,
  authorize("media:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const gen = await MediaGenerationService.get(req.user!.teamId!, req.params.id);
    res.json({ success: true, data: serialize(gen) });
  })
);

export default router;
