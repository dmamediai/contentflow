import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiKeyRequest, requireWriteScope } from "../../middleware/apiKeyAuth";
import { V1PostsService } from "../../services/v1-posts.service";

const router = Router();

const SOCIAL_PLATFORMS = [
  "FACEBOOK",
  "INSTAGRAM",
  "LINKEDIN",
  "TWITTER",
  "THREADS",
  "TIKTOK",
  "YOUTUBE",
  "BLUESKY",
] as const;

const mediaItemSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().url(),
  alt: z.string().optional(),
});

const createPostSchema = z
  .object({
    content: z.string().min(1).max(63000),
    platforms: z
      .array(
        z.object({
          platform: z.enum(SOCIAL_PLATFORMS),
          accountId: z.string().min(1),
          customContent: z.string().optional(),
        })
      )
      .min(1),
    mediaItems: z.array(mediaItemSchema).optional(),
    scheduledFor: z.string().optional(),
    timezone: z.string().optional(),
    publishNow: z.boolean().optional(),
  })
  .refine((data) => !(data.publishNow && data.scheduledFor), {
    message: "Provide either publishNow or scheduledFor, not both",
  });

const asyncHandler =
  (fn: Function) => (req: ApiKeyRequest, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

function serializePost(post: any) {
  return {
    _id: post.id,
    status: post.status,
    content: post.content,
    scheduledAt: post.scheduledAt,
    timezone: post.timezone,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    platforms: post.targets.map((t: any) => ({
      platform: t.platform,
      accountId: t.socialAccountId,
      status: t.status,
      platformPostId: t.platformPostId,
      platformPostUrl: t.platformPostUrl,
      error: t.error,
    })),
  };
}

// POST /v1/posts
router.post(
  "/",
  requireWriteScope,
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const body = createPostSchema.parse(req.body);
    const idempotencyKey = req.headers["x-request-id"] as string | undefined;

    const { post, existingPost } = await V1PostsService.createPost(req.teamId!, body, idempotencyKey);

    res.status(existingPost ? 200 : 201).json({ post: serializePost(post), existingPost });
  })
);

// GET /v1/posts
router.get(
  "/",
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const profileId = req.query.profileId as string | undefined;
    const status = req.query.status as string | undefined;

    const result = await V1PostsService.listPosts(req.teamId!, { profileId, status, page, limit });

    res.json({ posts: result.data.map(serializePost), pagination: result.pagination });
  })
);

// GET /v1/posts/:postId
router.get(
  "/:postId",
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const post = await V1PostsService.getPost(req.teamId!, req.params.postId);
    res.json({ post: serializePost(post) });
  })
);

export default router;
