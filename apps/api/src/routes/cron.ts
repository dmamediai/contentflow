import { Router, Request, Response, NextFunction } from "express";
import { runDueScheduledPosts } from "../jobs/post-scheduler-job";
import { logger } from "../lib/logger";

const router = Router();

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GET /api/cron/scheduler
 *
 * Publishes any scheduled posts whose time has passed. Called by Vercel Cron
 * (configured in apps/api/vercel.json) because setInterval doesn't survive on
 * serverless. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>`
 * on cron invocations, so we reject anything without the matching secret.
 */
router.get(
  "/scheduler",
  asyncHandler(async (req: Request, res: Response) => {
    const expected = process.env.CRON_SECRET;
    const provided = req.headers.authorization;

    if (!expected || provided !== `Bearer ${expected}`) {
      logger.warn({ action: "cron.scheduler.unauthorized" });
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const result = await runDueScheduledPosts();
    logger.info({ action: "cron.scheduler.ran", processed: result.processed });

    res.json({ success: true, ...result });
  })
);

export default router;
