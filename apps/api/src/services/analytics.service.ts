import prisma from "../lib/db";
import { logger } from "../lib/logger";
import { ApiError, ErrorCodes } from "../types";

export interface PostMetrics {
  postId: string;
  platform: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
  engagementRate: number;
  reachRate: number;
}

export interface TeamAnalytics {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalImpressions: number;
  totalReach: number;
  avgEngagementRate: number;
  topPost: any;
  topPlatform: string;
  postsLastWeek: number;
  growthTrend: number;
}

export class AnalyticsService {
  /**
   * Record analytics event for a post
   */
  static async recordEvent(
    postId: string,
    teamId: string,
    data: {
      likes?: number;
      comments?: number;
      shares?: number;
      impressions?: number;
      clicks?: number;
    }
  ) {
    // Verify post belongs to team
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.teamId !== teamId) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Post not found", 404);
    }

    // Update post metrics
    await prisma.post.update({
      where: { id: postId },
      data: {
        likes: (post.likes || 0) + (data.likes || 0),
        comments: (post.comments || 0) + (data.comments || 0),
        shares: (post.shares || 0) + (data.shares || 0),
        impressions: (post.impressions || 0) + (data.impressions || 0),
        clicks: (post.clicks || 0) + (data.clicks || 0),
      },
    });

    // Create analytics event log
    await prisma.analyticsEvent.create({
      data: {
        postId,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      },
    });

    logger.info({
      action: "analytics.event_recorded",
      postId,
      data,
    });
  }

  /**
   * Get metrics for a single post
   */
  static async getPostMetrics(teamId: string, postId: string): Promise<PostMetrics> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { socialAccounts: true },
    });

    if (!post || post.teamId !== teamId) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Post not found", 404);
    }

    const engagementRate =
      post.impressions > 0
        ? ((post.likes + post.comments + post.shares) / post.impressions) * 100
        : 0;

    const reachRate = post.impressions > 0 ? (post.clicks / post.impressions) * 100 : 0;

    return {
      postId: post.id,
      platform: post.socialAccounts[0]?.platform || "unknown",
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      impressions: post.impressions,
      clicks: post.clicks,
      engagementRate: Math.round(engagementRate * 100) / 100,
      reachRate: Math.round(reachRate * 100) / 100,
    };
  }

  /**
   * Get team-wide analytics
   */
  static async getTeamAnalytics(teamId: string, days: number = 30): Promise<TeamAnalytics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const posts = await prisma.post.findMany({
      where: {
        teamId,
        status: "PUBLISHED",
        publishedAt: { gte: startDate },
      },
      include: { socialAccounts: true },
    });

    const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);
    const totalShares = posts.reduce((sum, p) => sum + p.shares, 0);
    const totalImpressions = posts.reduce((sum, p) => sum + p.impressions, 0);
    const totalReach = posts.reduce((sum, p) => sum + p.clicks, 0);

    const avgEngagementRate =
      totalImpressions > 0
        ? ((totalLikes + totalComments + totalShares) / totalImpressions) * 100
        : 0;

    // Find top post
    const topPost = posts.reduce((top, current) => {
      const currentEngagement = current.likes + current.comments + current.shares;
      const topEngagement = (top?.likes || 0) + (top?.comments || 0) + (top?.shares || 0);
      return currentEngagement > topEngagement ? current : top;
    }, null);

    // Find top platform
    const platformCounts = posts.reduce(
      (acc, p) => {
        const platform = p.socialAccounts[0]?.platform || "unknown";
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topPlatform = Object.entries(platformCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";

    // Growth trend (compare to previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    const previousPosts = await prisma.post.findMany({
      where: {
        teamId,
        status: "PUBLISHED",
        publishedAt: { gte: previousStartDate, lt: startDate },
      },
    });

    const previousLikes = previousPosts.reduce((sum, p) => sum + p.likes, 0);
    const growthTrend = previousLikes > 0 ? ((totalLikes - previousLikes) / previousLikes) * 100 : 0;

    // Posts last week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const postsLastWeek = await prisma.post.count({
      where: {
        teamId,
        status: "PUBLISHED",
        publishedAt: { gte: weekStart },
      },
    });

    return {
      totalPosts: posts.length,
      totalLikes,
      totalComments,
      totalShares,
      totalImpressions,
      totalReach,
      avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      topPost: topPost
        ? {
            id: topPost.id,
            content: topPost.content.substring(0, 100),
            likes: topPost.likes,
          }
        : null,
      topPlatform,
      postsLastWeek,
      growthTrend: Math.round(growthTrend * 100) / 100,
    };
  }

  /**
   * Get analytics by platform
   */
  static async getByPlatform(teamId: string, platform: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const posts = await prisma.post.findMany({
      where: {
        teamId,
        status: "PUBLISHED",
        publishedAt: { gte: startDate },
      },
      include: { socialAccounts: true },
    });

    const platformPosts = posts.filter(
      (p) => p.socialAccounts.some((a) => a.platform === platform)
    );

    return {
      platform,
      totalPosts: platformPosts.length,
      totalLikes: platformPosts.reduce((sum, p) => sum + p.likes, 0),
      totalComments: platformPosts.reduce((sum, p) => sum + p.comments, 0),
      totalShares: platformPosts.reduce((sum, p) => sum + p.shares, 0),
      totalImpressions: platformPosts.reduce((sum, p) => sum + p.impressions, 0),
      avgLikes:
        platformPosts.length > 0
          ? Math.round(
              (platformPosts.reduce((sum, p) => sum + p.likes, 0) /
                platformPosts.length) *
                100
            ) / 100
          : 0,
    };
  }

  /**
   * Get trending content
   */
  static async getTrendingPosts(teamId: string, limit: number = 5) {
    const posts = await prisma.post.findMany({
      where: { teamId, status: "PUBLISHED" },
      orderBy: {
        likes: "desc",
      },
      take: limit,
      include: { socialAccounts: true },
    });

    return posts.map((p) => ({
      id: p.id,
      content: p.content.substring(0, 100),
      likes: p.likes,
      comments: p.comments,
      shares: p.shares,
      engagementRate:
        p.impressions > 0
          ? Math.round(((p.likes + p.comments + p.shares) / p.impressions) * 10000) / 100
          : 0,
      platform: p.socialAccounts[0]?.platform || "unknown",
    }));
  }

  /**
   * Get audience growth data
   */
  static async getAudienceGrowth(teamId: string, days: number = 90) {
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // TODO: Fetch actual follower counts from social media APIs
      // For now, return mock data
      data.push({
        date: date.toISOString().split("T")[0],
        followers: 1000 + i * 10,
      });
    }

    return data;
  }

  /**
   * Get performance summary
   */
  static async getPerformanceSummary(teamId: string) {
    const today = new Date();

    // Last 7 days
    const week = await this.getTeamAnalytics(teamId, 7);

    // Last 30 days
    const month = await this.getTeamAnalytics(teamId, 30);

    // Trending posts
    const trending = await this.getTrendingPosts(teamId, 3);

    return {
      weekSummary: {
        posts: week.totalPosts,
        engagement: week.totalLikes + week.totalComments + week.totalShares,
        reach: week.totalReach,
        avgEngagementRate: week.avgEngagementRate,
      },
      monthSummary: {
        posts: month.totalPosts,
        engagement: month.totalLikes + month.totalComments + month.totalShares,
        reach: month.totalReach,
        avgEngagementRate: month.avgEngagementRate,
      },
      trending,
      topPlatform: month.topPlatform,
      growthTrend: month.growthTrend,
    };
  }
}
