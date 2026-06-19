import { MCPContext, MCPToolInput } from "../router";
import { z } from "zod";
import prisma from "../../lib/db";

const getAnalyticsSchema = z.object({
  postId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export async function getAnalytics(
  input: MCPToolInput,
  context: MCPContext
): Promise<any> {
  const validated = getAnalyticsSchema.parse(input);

  if (validated.postId) {
    // Get analytics for specific post
    const post = await prisma.post.findUnique({
      where: { id: validated.postId },
      include: {
        analyticsEvents: true,
      },
    });

    if (!post || post.teamId !== context.teamId) {
      throw new Error("Post not found or access denied");
    }

    return {
      postId: post.id,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      impressions: post.impressions,
      clicks: post.clicks,
      engagementRate: post.impressions > 0 ? ((post.likes + post.comments) / post.impressions) * 100 : 0,
    };
  }

  // Get team analytics summary
  const summary = await prisma.analyticsSummary.findUnique({
    where: { teamId: context.teamId },
  });

  return {
    teamId: context.teamId,
    totalFollowers: summary?.totalFollowers || 0,
    totalImpressions: summary?.totalImpressions || 0,
    totalEngagements: summary?.totalEngagements || 0,
    avgEngagementRate: summary?.avgEngagementRate || 0,
    totalPosts: summary?.totalPosts || 0,
  };
}
