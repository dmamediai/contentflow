import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { AIService } from "../services/ai.service";
import { logger } from "../lib/logger";
import prisma from "../lib/db";

const router = Router();

// Validation schemas
const generatePostSchema = z.object({
  topic: z.string().min(1).max(500),
  platform: z.enum(["TWITTER", "LINKEDIN", "FACEBOOK", "INSTAGRAM", "THREADS"]),
  tone: z.enum(["professional", "casual", "funny", "engaging", "educational"]).optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
  includeHashtags: z.boolean().optional(),
  includeEmojis: z.boolean().optional(),
  includeCallToAction: z.boolean().optional(),
});

const rewriteContentSchema = z.object({
  content: z.string().min(1),
  tone: z.enum(["professional", "casual", "funny", "engaging", "educational"]).optional(),
  style: z.enum(["concise", "detailed", "storytelling", "persuasive"]).optional(),
});

const expandContentSchema = z.object({
  content: z.string().min(1),
  platform: z.string().optional(),
  targetLength: z.enum(["medium", "long"]).optional(),
});

const summarizeContentSchema = z.object({
  content: z.string().min(1),
  style: z.enum(["bullet-points", "paragraph", "key-takeaways"]).optional(),
});

const translateContentSchema = z.object({
  content: z.string().min(1),
  targetLanguage: z.string().min(2),
});

const generateHashtagsSchema = z.object({
  content: z.string().min(1),
  count: z.number().min(1).max(30).default(10),
  platform: z.string().optional(),
  includeNiche: z.boolean().optional(),
});

const generateHooksSchema = z.object({
  content: z.string().min(1),
  count: z.number().min(1).max(10).default(5),
  style: z.enum(["question", "statement", "curiosity", "benefit"]).optional(),
});

const generateCtaSchema = z.object({
  context: z.string().min(1),
  type: z.enum(["engagement", "click", "signup", "purchase"]).optional(),
  count: z.number().min(1).max(10).default(5),
});

// Error handler
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// POST /api/ai/generate-post - Generate a social media post
router.post(
  "/generate-post",
  authenticateJWT,
  teamContext,
  authorize("ai:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = generatePostSchema.parse(req.body);

    const content = await AIService.generatePost(body);

    // Log AI usage
    await prisma.aIUsageLog.create({
      data: {
        teamId: req.user!.teamId!,
        userId: req.user!.id!,
        feature: "generate_post",
        inputTokens: Math.ceil(body.topic.length / 4),
        outputTokens: Math.ceil(content.length / 4),
        metadata: body,
      },
    });

    logger.info({
      action: "ai.generate_post",
      teamId: req.user!.teamId,
      platform: body.platform,
    });

    res.json({
      success: true,
      data: {
        content,
        platform: body.platform,
        topic: body.topic,
      },
    });
  })
);

// POST /api/ai/rewrite - Rewrite existing content
router.post(
  "/rewrite",
  authenticateJWT,
  teamContext,
  authorize("ai:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = rewriteContentSchema.parse(req.body);

    const rewrittenContent = await AIService.rewriteContent(body);

    await prisma.aIUsageLog.create({
      data: {
        teamId: req.user!.teamId!,
        userId: req.user!.id!,
        feature: "rewrite_content",
        inputTokens: Math.ceil(body.content.length / 4),
        outputTokens: Math.ceil(rewrittenContent.length / 4),
        metadata: body,
      },
    });

    res.json({
      success: true,
      data: {
        originalContent: body.content,
        rewrittenContent,
        tone: body.tone || "professional",
      },
    });
  })
);

// POST /api/ai/expand - Expand content
router.post(
  "/expand",
  authenticateJWT,
  teamContext,
  authorize("ai:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = expandContentSchema.parse(req.body);

    const expandedContent = await AIService.expandContent(body);

    await prisma.aIUsageLog.create({
      data: {
        teamId: req.user!.teamId!,
        userId: req.user!.id!,
        feature: "expand_content",
        inputTokens: Math.ceil(body.content.length / 4),
        outputTokens: Math.ceil(expandedContent.length / 4),
        metadata: body,
      },
    });

    res.json({
      success: true,
      data: {
        originalContent: body.content,
        expandedContent,
      },
    });
  })
);

// POST /api/ai/summarize - Summarize content
router.post(
  "/summarize",
  authenticateJWT,
  teamContext,
  authorize("ai:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = summarizeContentSchema.parse(req.body);

    const summary = await AIService.summarizeContent(body);

    await prisma.aIUsageLog.create({
      data: {
        teamId: req.user!.teamId!,
        userId: req.user!.id!,
        feature: "summarize_content",
        inputTokens: Math.ceil(body.content.length / 4),
        outputTokens: Math.ceil(summary.length / 4),
        metadata: body,
      },
    });

    res.json({
      success: true,
      data: {
        originalContent: body.content,
        summary,
        style: body.style || "paragraph",
      },
    });
  })
);

// POST /api/ai/translate - Translate content
router.post(
  "/translate",
  authenticateJWT,
  teamContext,
  authorize("ai:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = translateContentSchema.parse(req.body);

    const translated = await AIService.translateContent(body);

    await prisma.aIUsageLog.create({
      data: {
        teamId: req.user!.teamId!,
        userId: req.user!.id!,
        feature: "translate_content",
        inputTokens: Math.ceil(body.content.length / 4),
        outputTokens: Math.ceil(translated.length / 4),
        metadata: body,
      },
    });

    res.json({
      success: true,
      data: {
        originalContent: body.content,
        translatedContent: translated,
        targetLanguage: body.targetLanguage,
      },
    });
  })
);

// POST /api/ai/hashtags - Generate hashtags
router.post(
  "/hashtags",
  authenticateJWT,
  teamContext,
  authorize("ai:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = generateHashtagsSchema.parse(req.body);

    const hashtags = await AIService.generateHashtags(body);

    await prisma.aIUsageLog.create({
      data: {
        teamId: req.user!.teamId!,
        userId: req.user!.id!,
        feature: "generate_hashtags",
        inputTokens: Math.ceil(body.content.length / 4),
        outputTokens: hashtags.length * 5,
        metadata: body,
      },
    });

    res.json({
      success: true,
      data: {
        hashtags,
        count: hashtags.length,
      },
    });
  })
);

// POST /api/ai/hooks - Generate hooks
router.post(
  "/hooks",
  authenticateJWT,
  teamContext,
  authorize("ai:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = generateHooksSchema.parse(req.body);

    const hooks = await AIService.generateHooks(body);

    await prisma.aIUsageLog.create({
      data: {
        teamId: req.user!.teamId!,
        userId: req.user!.id!,
        feature: "generate_hooks",
        inputTokens: Math.ceil(body.content.length / 4),
        outputTokens: hooks.reduce((sum, h) => sum + h.length, 0) / 4,
        metadata: body,
      },
    });

    res.json({
      success: true,
      data: {
        hooks,
        count: hooks.length,
      },
    });
  })
);

// POST /api/ai/cta - Generate call-to-actions
router.post(
  "/cta",
  authenticateJWT,
  teamContext,
  authorize("ai:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = generateCtaSchema.parse(req.body);

    const ctas = await AIService.generateCallToActions(body);

    await prisma.aIUsageLog.create({
      data: {
        teamId: req.user!.teamId!,
        userId: req.user!.id!,
        feature: "generate_cta",
        inputTokens: Math.ceil(body.context.length / 4),
        outputTokens: ctas.reduce((sum, c) => sum + c.length, 0) / 4,
        metadata: body,
      },
    });

    res.json({
      success: true,
      data: {
        ctas,
        count: ctas.length,
      },
    });
  })
);

export default router;
