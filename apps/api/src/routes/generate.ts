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

// POST /api/generate - Generate an image or video from a prompt
router.post(
  "/",
  authenticateJWT,
  teamContext,
  authorize("media:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = generateSchema.parse(req.body);

    const result =
      body.type === "image"
        ? await MediaGenerationService.generateImage(
            req.user!.teamId!,
            body.prompt,
            body.aspectRatio || "1:1",
            body.mode || "Vivid"
          )
        : await MediaGenerationService.generateVideo();

    res.json({ success: true, data: result });
  })
);

export default router;
