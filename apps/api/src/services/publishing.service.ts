import axios from "axios";
import FormData from "form-data";
import { Prisma } from "@prisma/client";
import prisma from "../lib/db";
import { logger } from "../lib/logger";
import { ApiError, ErrorCodes } from "../types";
import { OAuthService } from "./oauth.service";

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

const GRAPH_VERSION = "v18.0";
const LINKEDIN_VERSION = "202401";

function graphErrorMessage(error: any, fallback: string): string {
  return error?.response?.data?.error?.message || (error instanceof Error ? error.message : fallback);
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
          metadata: { publishResults: results } as unknown as Prisma.InputJsonValue,
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
   * Publish to Twitter (X API v2). Requires the connected account's OAuth2
   * user token to carry the tweet.write scope (already requested in
   * OAuthService.generateTwitterAuthUrl).
   */
  static async publishToTwitter(
    teamId: string,
    content: string,
    mediaUrls?: string[]
  ): Promise<PublishResult> {
    try {
      const account = await prisma.socialAccount.findFirst({
        where: { teamId, platform: "TWITTER" },
      });

      if (!account) {
        return { platform: "TWITTER", success: false, error: "Twitter account not connected" };
      }

      const accessToken = await OAuthService.refreshTokenIfNeeded(account);

      const mediaIds: string[] = [];
      for (const url of (mediaUrls || []).slice(0, 4)) {
        mediaIds.push(await this.uploadTwitterMedia(accessToken, url));
      }

      const body: Record<string, unknown> = { text: content };
      if (mediaIds.length > 0) {
        body.media = { media_ids: mediaIds };
      }

      const response = await axios.post("https://api.twitter.com/2/tweets", body, {
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });

      logger.info({ action: "publishing.twitter", teamId, contentLength: content.length });

      return { platform: "TWITTER", success: true, externalPostId: response.data.data.id };
    } catch (error: any) {
      logger.error({
        action: "publishing.twitter_error",
        teamId,
        error: error?.response?.data || (error instanceof Error ? error.message : String(error)),
      });
      return {
        platform: "TWITTER",
        success: false,
        error:
          error?.response?.data?.detail ||
          error?.response?.data?.title ||
          (error instanceof Error ? error.message : "Twitter publishing failed"),
      };
    }
  }

  private static async uploadTwitterMedia(accessToken: string, url: string): Promise<string> {
    const media = await axios.get(url, { responseType: "arraybuffer" });
    const contentType = String(media.headers["content-type"] || "image/jpeg");

    const form = new FormData();
    form.append("media", Buffer.from(media.data), { filename: "media", contentType });
    form.append("media_category", "tweet_image");

    const response = await axios.post("https://api.twitter.com/2/media/upload", form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${accessToken}` },
      maxBodyLength: Infinity,
    });

    return response.data.data.id;
  }

  /**
   * Publish to LinkedIn (versioned /rest/posts API). Posts as the connected
   * member (urn:li:person:{id}) - requires the w_member_social scope already
   * requested in OAuthService.generateLinkedInAuthUrl.
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

      if (!account || !account.accessToken) {
        return { platform: "LINKEDIN", success: false, error: "LinkedIn account not connected" };
      }

      const accessToken = account.accessToken;
      const author = `urn:li:person:${account.platformAccountId}`;
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": LINKEDIN_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      };

      let media: { id: string; title: string } | undefined;
      if (mediaUrls && mediaUrls.length > 0) {
        media = { id: await this.uploadLinkedInImage(accessToken, author, mediaUrls[0], headers), title: "Image" };
      }

      const body: Record<string, unknown> = {
        author,
        commentary: content,
        visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      };
      if (media) {
        body.content = { media };
      }

      const response = await axios.post("https://api.linkedin.com/rest/posts", body, { headers });
      const postId = String(response.headers["x-restli-id"] || response.data?.id || "");

      logger.info({ action: "publishing.linkedin", teamId, contentLength: content.length });

      return { platform: "LINKEDIN", success: true, externalPostId: postId };
    } catch (error: any) {
      logger.error({
        action: "publishing.linkedin_error",
        teamId,
        error: error?.response?.data || (error instanceof Error ? error.message : String(error)),
      });
      return {
        platform: "LINKEDIN",
        success: false,
        error: error?.response?.data?.message || (error instanceof Error ? error.message : "LinkedIn publishing failed"),
      };
    }
  }

  private static async uploadLinkedInImage(
    accessToken: string,
    owner: string,
    url: string,
    headers: Record<string, string>
  ): Promise<string> {
    const init = await axios.post(
      "https://api.linkedin.com/rest/images?action=initializeUpload",
      { initializeUploadRequest: { owner } },
      { headers }
    );

    const uploadUrl = init.data.value.uploadInstructions[0].uploadUrl;
    const imageUrn = init.data.value.image;

    const media = await axios.get(url, { responseType: "arraybuffer" });
    await axios.put(uploadUrl, media.data, { headers: { Authorization: `Bearer ${accessToken}` } });

    return imageUrn;
  }

  /**
   * Publish to Facebook (Graph API). Posts to the connected Page's feed, or
   * as a photo post when media is attached.
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
        return { platform: "FACEBOOK", success: false, error: "Facebook account not connected" };
      }

      const pageId = account.platformAccountId;
      const hasMedia = mediaUrls && mediaUrls.length > 0;

      const response = hasMedia
        ? await axios.post(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/photos`, {
            url: mediaUrls![0],
            caption: content,
            access_token: account.accessToken,
          })
        : await axios.post(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/feed`, {
            message: content,
            access_token: account.accessToken,
          });

      logger.info({ action: "publishing.facebook", teamId, contentLength: content.length });

      return { platform: "FACEBOOK", success: true, externalPostId: response.data.id || response.data.post_id };
    } catch (error: any) {
      logger.error({
        action: "publishing.facebook_error",
        teamId,
        error: error?.response?.data || (error instanceof Error ? error.message : String(error)),
      });
      return { platform: "FACEBOOK", success: false, error: graphErrorMessage(error, "Facebook publishing failed") };
    }
  }

  /**
   * Publish to Instagram (Graph API). Two-step container + publish flow;
   * Instagram requires at least one image or video, there is no text-only post.
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
        return { platform: "INSTAGRAM", success: false, error: "Instagram account not connected" };
      }

      if (!mediaUrls || mediaUrls.length === 0) {
        return { platform: "INSTAGRAM", success: false, error: "Instagram requires at least one image" };
      }

      const igUserId = account.platformAccountId;
      const accessToken = account.accessToken;

      const container = await axios.post(`https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media`, {
        image_url: mediaUrls[0],
        caption: content,
        access_token: accessToken,
      });

      const publish = await axios.post(`https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media_publish`, {
        creation_id: container.data.id,
        access_token: accessToken,
      });

      logger.info({
        action: "publishing.instagram",
        teamId,
        contentLength: content.length,
        mediaCount: mediaUrls.length,
      });

      return { platform: "INSTAGRAM", success: true, externalPostId: publish.data.id };
    } catch (error: any) {
      logger.error({
        action: "publishing.instagram_error",
        teamId,
        error: error?.response?.data || (error instanceof Error ? error.message : String(error)),
      });
      return { platform: "INSTAGRAM", success: false, error: graphErrorMessage(error, "Instagram publishing failed") };
    }
  }

  /**
   * Publish to Threads (Threads Graph API). Same container + publish shape
   * as Instagram, but on graph.threads.net and text-only posts are allowed.
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
        return { platform: "THREADS", success: false, error: "Threads account not connected" };
      }

      const accessToken = account.accessToken;
      const hasMedia = mediaUrls && mediaUrls.length > 0;

      const container = await axios.post("https://graph.threads.net/v1.0/me/threads", {
        media_type: hasMedia ? "IMAGE" : "TEXT",
        text: content,
        ...(hasMedia ? { image_url: mediaUrls![0] } : {}),
        access_token: accessToken,
      });

      const publish = await axios.post(`https://graph.threads.net/v1.0/${container.data.id}/publish`, {
        creation_id: container.data.id,
        access_token: accessToken,
      });

      logger.info({ action: "publishing.threads", teamId, contentLength: content.length });

      return { platform: "THREADS", success: true, externalPostId: publish.data.id };
    } catch (error: any) {
      logger.error({
        action: "publishing.threads_error",
        teamId,
        error: error?.response?.data || (error instanceof Error ? error.message : String(error)),
      });
      return { platform: "THREADS", success: false, error: graphErrorMessage(error, "Threads publishing failed") };
    }
  }

  /**
   * Get publishing status for a post
   */
  static async getPublishStatus(teamId: string, postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { socialAccounts: true },
    });

    if (!post || post.teamId !== teamId) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Post not found", 404);
    }

    const metadata = post.metadata as { publishResults?: PublishResult[] } | null;

    return {
      status: post.status,
      publishedAt: post.publishedAt,
      platforms: post.socialAccounts,
      results: metadata?.publishResults,
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
