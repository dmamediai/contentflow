import prisma from "../lib/db";
import { logger } from "../lib/logger";
import { V1PostsService } from "../services/v1-posts.service";

const POLL_INTERVAL_MS = 60 * 1000;
const BATCH_SIZE = 20;

/**
 * Execute one batch of scheduled posts whose scheduledAt has passed.
 * Returns how many posts were processed. Per-post errors are isolated so a
 * single failure doesn't stop the batch. Shared by both the in-process poller
 * (long-running hosts) and the /api/cron/scheduler endpoint (Vercel Cron on
 * serverless, where setInterval never fires).
 */
export async function runDueScheduledPosts(): Promise<{ processed: number }> {
  const due = await prisma.post.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
    take: BATCH_SIZE,
    select: { id: true },
  });

  for (const { id } of due) {
    try {
      await V1PostsService.executePost(id);
    } catch (error) {
      logger.error({
        action: "post_scheduler_job.execute_failed",
        postId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { processed: due.length };
}

/**
 * In-process poller for long-running hosts (Render, Railway, a VM). On Vercel
 * serverless this interval never fires — the Vercel Cron hitting
 * /api/cron/scheduler drives scheduling there instead.
 */
export function startPostSchedulerJob(): void {
  setInterval(async () => {
    try {
      await runDueScheduledPosts();
    } catch (error) {
      logger.error({
        action: "post_scheduler_job.poll_failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, POLL_INTERVAL_MS);

  logger.info({ action: "post_scheduler_job.started", intervalMs: POLL_INTERVAL_MS });
}
