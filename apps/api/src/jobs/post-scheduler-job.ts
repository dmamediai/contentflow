import prisma from "../lib/db";
import { logger } from "../lib/logger";
import { V1PostsService } from "../services/v1-posts.service";

const POLL_INTERVAL_MS = 60 * 1000;
const BATCH_SIZE = 20;

/**
 * Single-process poller that executes scheduled v1 posts once their
 * scheduledAt has passed. Fine for a single API instance; a real deployment
 * with multiple instances should replace this with a proper job queue
 * (e.g. BullMQ + Redis) so posts aren't claimed more than once per replica -
 * documented in docs/PUBLIC_API.md.
 */
export function startPostSchedulerJob(): void {
  setInterval(async () => {
    try {
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
    } catch (error) {
      logger.error({
        action: "post_scheduler_job.poll_failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, POLL_INTERVAL_MS);

  logger.info({ action: "post_scheduler_job.started", intervalMs: POLL_INTERVAL_MS });
}
