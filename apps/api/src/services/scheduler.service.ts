import prisma from "../lib/db";
import { ApiError, ErrorCodes } from "@social-media-saas/types";
import { logger } from "../lib/logger";
import { z } from "zod";

export type RecurrenceType = "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY";

export interface SchedulePostRequest {
  content: string;
  socialAccountIds: string[];
  scheduledAt: Date;
  mediaIds?: string[];
  recurrence?: RecurrenceType;
  recurrenceEndDate?: Date;
}

export interface UpdateScheduleRequest {
  content?: string;
  scheduledAt?: Date;
  socialAccountIds?: string[];
  status?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
}

export class SchedulerService {
  /**
   * Schedule a post
   */
  static async schedulePost(teamId: string, data: SchedulePostRequest) {
    // Validate team exists
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Team not found", 404);
    }

    // Validate social accounts belong to team
    const accounts = await prisma.socialAccount.findMany({
      where: {
        teamId,
        id: { in: data.socialAccountIds },
      },
    });

    if (accounts.length === 0) {
      throw new ApiError(
        ErrorCodes.BAD_REQUEST,
        "No valid social accounts provided",
        400
      );
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        teamId,
        content: data.content,
        contentType: "TEXT",
        status: "SCHEDULED",
        scheduledAt: data.scheduledAt,
        socialAccounts: {
          connect: accounts.map((a) => ({ id: a.id })),
        },
        metadata: {
          recurrence: data.recurrence || "ONCE",
          recurrenceEndDate: data.recurrenceEndDate,
        },
      },
      include: {
        socialAccounts: true,
      },
    });

    logger.info({
      action: "scheduler.post_scheduled",
      teamId,
      postId: post.id,
      scheduledAt: post.scheduledAt,
      platforms: accounts.map((a) => a.platform),
    });

    return post;
  }

  /**
   * Get scheduled posts for a team
   */
  static async getScheduledPosts(
    teamId: string,
    page = 1,
    limit = 20,
    status?: string
  ) {
    const where: any = { teamId };
    if (status) {
      where.status = status;
    }

    const posts = await prisma.post.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { scheduledAt: "asc" },
      include: {
        socialAccounts: true,
      },
    });

    const total = await prisma.post.count({ where });

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get posts for calendar view (by date range)
   */
  static async getPostsByDateRange(
    teamId: string,
    startDate: Date,
    endDate: Date,
    status?: string
  ) {
    const where: any = {
      teamId,
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (status) {
      where.status = status;
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      include: {
        socialAccounts: true,
      },
    });

    return posts;
  }

  /**
   * Get posts by specific date (for day view)
   */
  static async getPostsByDate(teamId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getPostsByDateRange(teamId, startOfDay, endOfDay);
  }

  /**
   * Update scheduled post
   */
  static async updatePost(teamId: string, postId: string, data: UpdateScheduleRequest) {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post || post.teamId !== teamId) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Post not found", 404);
    }

    if (post.status === "PUBLISHED") {
      throw new ApiError(
        ErrorCodes.BAD_REQUEST,
        "Cannot edit published posts",
        400
      );
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data,
      include: {
        socialAccounts: true,
      },
    });

    logger.info({
      action: "scheduler.post_updated",
      teamId,
      postId,
    });

    return updated;
  }

  /**
   * Delete scheduled post
   */
  static async deletePost(teamId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post || post.teamId !== teamId) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Post not found", 404);
    }

    if (post.status === "PUBLISHED") {
      throw new ApiError(
        ErrorCodes.BAD_REQUEST,
        "Cannot delete published posts",
        400
      );
    }

    await prisma.post.delete({ where: { id: postId } });

    logger.info({
      action: "scheduler.post_deleted",
      teamId,
      postId,
    });

    return { message: "Post deleted successfully" };
  }

  /**
   * Get draft posts
   */
  static async getDrafts(teamId: string, page = 1, limit = 20) {
    return this.getScheduledPosts(teamId, page, limit, "DRAFT");
  }

  /**
   * Move post to draft
   */
  static async moveToDraft(teamId: string, postId: string) {
    return this.updatePost(teamId, postId, { status: "DRAFT" });
  }

  /**
   * Get queue (posts publishing soon)
   */
  static async getQueue(teamId: string, hoursAhead = 24) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const posts = await prisma.post.findMany({
      where: {
        teamId,
        status: "SCHEDULED",
        scheduledAt: {
          gte: now,
          lte: futureDate,
        },
      },
      orderBy: { scheduledAt: "asc" },
      include: {
        socialAccounts: true,
      },
    });

    return posts;
  }

  /**
   * Get best times to post (based on historical data)
   */
  static async getBestTimes(teamId: string, platform: string) {
    // TODO: Implement analytics-based best times
    // For now, return common best times
    const bestTimes: Record<string, string[]> = {
      TWITTER: ["09:00", "12:00", "17:00", "20:00"],
      LINKEDIN: ["08:00", "12:00", "17:00"],
      FACEBOOK: ["13:00", "19:00", "20:00"],
      INSTAGRAM: ["11:00", "14:00", "19:00"],
      THREADS: ["09:00", "12:00", "18:00"],
    };

    return bestTimes[platform] || ["09:00", "12:00", "17:00"];
  }

  /**
   * Publish a scheduled post (called by background job)
   */
  static async publishScheduledPost(postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { socialAccounts: true },
    });

    if (!post || post.status !== "SCHEDULED") {
      throw new Error("Post not found or not scheduled");
    }

    try {
      // TODO: Integrate with social media APIs to actually publish
      // For now, just update status
      const published = await prisma.post.update({
        where: { id: postId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
        include: { socialAccounts: true },
      });

      logger.info({
        action: "scheduler.post_published",
        postId,
        platforms: post.socialAccounts.map((a) => a.platform),
      });

      return published;
    } catch (error) {
      logger.error({
        action: "scheduler.publish_failed",
        postId,
        error: error instanceof Error ? error.message : String(error),
      });

      await prisma.post.update({
        where: { id: postId },
        data: { status: "FAILED" },
      });

      throw error;
    }
  }

  /**
   * Get statistics about scheduled posts
   */
  static async getScheduleStats(teamId: string) {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalScheduled,
      scheduledThisWeek,
      drafts,
      published,
      failed,
    ] = await Promise.all([
      prisma.post.count({
        where: { teamId, status: "SCHEDULED" },
      }),
      prisma.post.count({
        where: {
          teamId,
          status: "SCHEDULED",
          scheduledAt: { gte: now, lte: weekFromNow },
        },
      }),
      prisma.post.count({
        where: { teamId, status: "DRAFT" },
      }),
      prisma.post.count({
        where: { teamId, status: "PUBLISHED" },
      }),
      prisma.post.count({
        where: { teamId, status: "FAILED" },
      }),
    ]);

    return {
      totalScheduled,
      scheduledThisWeek,
      drafts,
      published,
      failed,
      total: totalScheduled + drafts + published + failed,
    };
  }
}
