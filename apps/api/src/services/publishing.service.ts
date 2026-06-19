import axios from "axios";
import prisma from "../lib/db";
import { logger } from "../lib/logger";
import { ApiError, ErrorCodes } from "../types";

export type SocialPlatform = "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "TWITTER" | "THREADS";

export interface PublishRequest {
  postId: string;
  teamId: string;
  content: string;
  mediaUrls?: string[];
  platforms: SocialPlatform[];
}

export interface PublishResult {
  platform: SocialPlatform;
  success: boolean;
  externalPostId?: string;
  error?: string;
}

export class PublishingService {
  /**
   * Publish post to all connected accounts
   */
  static async publishPost(request: PublishRequest): Promise<PublishResult[]> {
    const results: PublishResult[] = [];

    for (const platform of request.platforms) {
      try {
        const result = await this.publishToSinglePlatform(
          platform,
          request.teamId,
          request.content,
          request.mediaUrls
        );
        results.push(result);
      } catch (error) {
        logger.error({
          action: "publishing.error",
          platform,
          error: error instanceof Error ? error.message : String(error),
        });

        results.push({
          platform,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Update post with published details
    if (results.some((r) => r.success)) {
      await prisma.post.update({
        where: { id: request.postId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          metadata: {
            publishResults: results,
          },
        },
      });
    }

    return results;
  }

  /**
   * Publish to single platform
   */
  static async publishToSinglePlatform(
    platform: SocialPlatform,
    teamId: string,
    content: string,
    mediaUrls?: string[]
  ): Promise<PublishResult> {
    switch (platform) {
      case "TWITTER":
        return this.publishToTwitter(teamId, content, mediaUrls);
      case "LINKEDIN":
        return this.publishToLinkedIn(teamId, content, mediaUrls);
      case "FACEBOOK":
        return this.publishToFacebook(teamId, content, mediaUrls);
      case "INSTAGRAM":
        return this.publishToInstagram(teamId, content, mediaUrls);
      case "THREADS":
        return this.publishToThreads(teamId, content, mediaUrls);
      default:
        return {
          platform,
          success: false,
          error: `Platform ${platform} not supported`,
        };
    }
  }

  /**
   * Publish to Twitter
   */
  static async publishToTwitter(
    teamId: string,
    content: string,
    mediaUrls?: string[]
  ): Promise<PublishResult> {
    try {
      // Get team's Twitter credentials
      const account = await prisma.socialAccount.findFirst({
        where: { teamId, platform: "TWITTER" },
      });

      if (!account) {
        return {
          platform: "TWITTER",
          success: false,
          error: "Twitter account not connected",
        };
      }

      // TODO: Implement actual Twitter API call
      // const response = await axios.post(
      //   "https://api.twitter.com/2/tweets",
      //   { text: content },
      //   { headers: { Authorization: `Bearer ${account.accessToken}` } }
      // );

      logger.info({
        action: "publishing.twitter",
        teamId,
        contentLength: content.length,
      });

      return {
        platform: "TWITTER",
        success: true,
        externalPostId: `twitter_${Date.now()}`,
      };
    } catch (error) {
      return {
        platform: "TWITTER",
        success: false,
        error: error instanceof Error ? error.message : "Twitter publishing failed",
      };
    }
  }

  /**
   * Publish to LinkedIn
   */
  static async publishToLinkedIn(
    teamId: string,
    content: string,
    mediaUrls?: string[]
  ): Promise<PublishResult> {
    try {
      const account = await prisma.socialAccount.findFirst({
        where: { teamId, platform: "LINKEDIN" },
      });

      if (!account) {
        return {
          platform: "LINKEDIN",
          success: false,
          error: "LinkedIn account not connected",
        };
      }

      // TODO: Implement actual LinkedIn API call
      // const response = await axios.post(
      //   "https://api.linkedin.com/v2/ugcPosts",
      //   { ... },
      //   { headers: { Authorization: `Bearer ${account.accessToken}` } }
      // );

      logger.info({
        action: "publishing.linkedin",
        teamId,
        contentLength: content.length,
      });

      return {
        platform: "LINKEDIN",
        success: true,
        externalPostId: `linkedin_${Date.now()}`,
      };
    } catch (error) {
      return {
        platform: "LINKEDIN",
        success: false,
        error: error instanceof Error ? error.message : "LinkedIn publishing failed",
      };
    }
  }

  /**
   * Publish to Facebook
   */
  static async publishToFacebook(
    teamId: string,
    content: string,
    mediaUrls?: string[]
  ): Promise<PublishResult> {
    try {
      const account = await prisma.socialAccount.findFirst({
        where: { teamId, platform: "FACEBOOK" },
      });

      if (!account) {
        return {
          platform: "FACEBOOK",
          success: false,
          error: "Facebook account not connected",
        };
      }

      // TODO: Implement actual Facebook Graph API call

      logger.info({
        action: "publishing.facebook",
        teamId,
        contentLength: content.length,
      });

      return {
        platform: "FACEBOOK",
        success: true,
        externalPostId: `facebook_${Date.now()}`,
      };
    } catch (error) {
      return {
        platform: "FACEBOOK",
        success: false,
        error: error instanceof Error ? error.message : "Facebook publishing failed",
      };
    }
  }

  /**
   * Publish to Instagram
   */
  static async publishToInstagram(
    teamId: string,
    content: string,
    mediaUrls?: string[]
  ): Promise<PublishResult> {
    try {
      const account = await prisma.socialAccount.findFirst({
        where: { teamId, platform: "INSTAGRAM" },
      });

      if (!account) {
        return {
          platform: "INSTAGRAM",
          success: false,
          error: "Instagram account not connected",
        };
      }

      if (!mediaUrls || mediaUrls.length === 0) {
        return {
          platform: "INSTAGRAM",
          success: false,
          error: "Instagram requires at least one image",
        };
      }

      // TODO: Implement actual Instagram Graph API call

      logger.info({
        action: "publishing.instagram",
        teamId,
        contentLength: content.length,
        mediaCount: mediaUrls.length,
      });

      return {
        platform: "INSTAGRAM",
        success: true,
        externalPostId: `instagram_${Date.now()}`,
      };
    } catch (error) {
      return {
        platform: "INSTAGRAM",
        success: false,
        error: error instanceof Error ? error.message : "Instagram publishing failed",
      };
    }
  }

  /**
   * Publish to Threads
   */
  static async publishToThreads(
    teamId: string,
    content: string,
    mediaUrls?: string[]
  ): Promise<PublishResult> {
    try {
      const account = await prisma.socialAccount.findFirst({
        where: { teamId, platform: "THREADS" },
      });

      if (!account) {
        return {
          platform: "THREADS",
          success: false,
          error: "Threads account not connected",
        };
      }

      // TODO: Implement actual Threads API call

      logger.info({
        action: "publishing.threads",
        teamId,
        contentLength: content.length,
      });

      return {
        platform: "THREADS",
        success: true,
        externalPostId: `threads_${Date.now()}`,
      };
    } catch (error) {
      return {
        platform: "THREADS",
        success: false,
        error: error instanceof Error ? error.message : "Threads publishing failed",
      };
    }
  }

  /**
   * Get publishing status for a post
   */
  static async getPublishStatus(teamId: string, postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.teamId !== teamId) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Post not found", 404);
    }

    return {
      status: post.status,
      publishedAt: post.publishedAt,
      platforms: post.socialAccounts,
      results: post.metadata?.publishResults,
    };
  }

  /**
   * Retry publishing for failed post
   */
  static async retryPublish(teamId: string, postId: string): Promise<PublishResult[]> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { socialAccounts: true },
    });

    if (!post || post.teamId !== teamId) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Post not found", 404);
    }

    return this.publishPost({
      postId,
      teamId,
      content: post.content,
      mediaUrls: [], // TODO: Get from media relations
      platforms: post.socialAccounts.map((a) => a.platform as SocialPlatform),
    });
  }
}
