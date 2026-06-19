import { AIService } from "./ai.service";
import { logger } from "../lib/logger";
import { z } from "zod";

export type RepurposeType =
  | "BLOG_TO_LINKEDIN"
  | "BLOG_TO_TWITTER"
  | "YOUTUBE_TO_SOCIAL"
  | "PODCAST_TO_SOCIAL"
  | "LONG_TO_CAROUSEL"
  | "ARTICLE_TO_THREADS";

export interface RepurposeRequest {
  originalContent: string;
  sourceType: RepurposeType;
  targetPlatforms?: string[];
}

export interface CarouselSlide {
  title: string;
  content: string;
  cta?: string;
}

export class RepurposingService {
  /**
   * Repurpose blog content to LinkedIn post
   */
  static async blogToLinkedIn(content: string): Promise<string> {
    const prompt = `Convert this blog post into a professional LinkedIn post (300-500 characters) that:
- Highlights the key insight
- Uses professional tone
- Includes a call-to-action
- May include relevant hashtags

Blog: "${content}"`;

    return AIService["callAI"](prompt, "You are a LinkedIn content strategist.");
  }

  /**
   * Repurpose blog content to Twitter thread
   */
  static async blogToTwitter(content: string): Promise<string[]> {
    const prompt = `Convert this blog post into a Twitter thread (5-10 tweets, max 280 chars each).
Each tweet should:
- Stand alone but connect to thread
- Use engaging language
- Include relevant hashtags where appropriate
- Number tweets (1/, 2/, etc.)

Blog: "${content}"`;

    const response = await AIService["callAI"](prompt, "You are a Twitter content expert.");
    return response.split("\n").filter((tweet) => tweet.trim().length > 0);
  }

  /**
   * Repurpose YouTube video to social posts
   */
  static async youtubeToSocial(videoTitle: string, videoDescription: string): Promise<{
    linkedin: string;
    twitter: string;
    instagram: string;
  }> {
    const content = `${videoTitle}\n\n${videoDescription}`;

    const [linkedin, twitter, instagram] = await Promise.all([
      this.blogToLinkedIn(content),
      this.generateInstagramCaption(videoTitle),
      this.blogToLinkedIn(content), // Instagram uses similar to LinkedIn
    ]);

    return { linkedin, twitter, instagram };
  }

  /**
   * Repurpose podcast transcript to social posts
   */
  static async podcastToSocial(
    episodeTitle: string,
    transcript: string
  ): Promise<{
    headline: string;
    posts: string[];
    clips: string[];
  }> {
    // Extract key quotes from transcript
    const keyPoints = await this.extractKeyPoints(transcript, 3);

    // Generate social posts from key points
    const posts = await Promise.all(
      keyPoints.map((point) =>
        AIService["generatePost"]({
          topic: point,
          platform: "TWITTER",
          tone: "engaging",
          includeHashtags: true,
        })
      )
    );

    // Generate headline
    const headline = await AIService["generateHooks"]({
      content: `Episode: ${episodeTitle}\n\nTranscript excerpt: ${transcript.substring(0, 500)}`,
      count: 1,
    });

    return {
      headline: headline[0] || episodeTitle,
      posts,
      clips: keyPoints,
    };
  }

  /**
   * Repurpose long content to carousel slides
   */
  static async longToCarousel(content: string): Promise<CarouselSlide[]> {
    const prompt = `Convert this long-form content into 5-7 carousel slides.
Each slide should have:
- A clear title (5-10 words)
- Main content (50-100 words)
- Optional CTA for last slide

Format as JSON array:
[
  { "title": "...", "content": "..." },
  ...
]

Content: "${content}"`;

    const response = await AIService["callAI"](
      prompt,
      "You are a content designer creating carousel posts."
    );

    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [{ title: "Slide", content: response }];
    } catch {
      // Fallback if JSON parsing fails
      return [
        {
          title: "Main Idea",
          content: response,
        },
      ];
    }
  }

  /**
   * Repurpose article to threaded posts
   */
  static async articleToThreads(
    title: string,
    content: string
  ): Promise<{
    headline: string;
    threads: Array<{ title: string; posts: string[] }>;
  }> {
    const keyPoints = await this.extractKeyPoints(content, 5);

    const threads = await Promise.all(
      keyPoints.map(async (point, idx) => ({
        title: `Part ${idx + 1}: ${point}`,
        posts: await this.blogToTwitter(point),
      }))
    );

    return {
      headline: title,
      threads,
    };
  }

  /**
   * Generate Instagram caption
   */
  static async generateInstagramCaption(topic: string): Promise<string> {
    const prompt = `Create an Instagram caption for: "${topic}"
- Use emojis strategically
- Include 1-2 relevant hashtags
- Call to action
- Conversational tone
- Max 150 characters`;

    return AIService["callAI"](
      prompt,
      "You are an Instagram content expert."
    );
  }

  /**
   * Extract key points from long content
   */
  static async extractKeyPoints(content: string, count: number = 5): Promise<string[]> {
    const prompt = `Extract ${count} main key points or insights from this content.
Return as numbered list (1. ..., 2. ..., etc.)
Keep each point concise (1-2 sentences).

Content: "${content}"`;

    const response = await AIService["callAI"](
      prompt,
      "You are an expert at extracting key insights."
    );

    return response
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => line.replace(/^\d+\.\s*/, ""))
      .slice(0, count);
  }

  /**
   * Repurpose content (main orchestrator)
   */
  static async repurpose(request: RepurposeRequest): Promise<any> {
    logger.info({
      action: "repurposing.start",
      type: request.sourceType,
    });

    try {
      let result: any = {};

      switch (request.sourceType) {
        case "BLOG_TO_LINKEDIN":
          result = await this.blogToLinkedIn(request.originalContent);
          break;

        case "BLOG_TO_TWITTER":
          result = await this.blogToTwitter(request.originalContent);
          break;

        case "YOUTUBE_TO_SOCIAL":
          result = await this.youtubeToSocial(
            request.originalContent.split("\n")[0],
            request.originalContent
          );
          break;

        case "PODCAST_TO_SOCIAL":
          result = await this.podcastToSocial(
            request.originalContent.split("\n")[0],
            request.originalContent
          );
          break;

        case "LONG_TO_CAROUSEL":
          result = await this.longToCarousel(request.originalContent);
          break;

        case "ARTICLE_TO_THREADS":
          result = await this.articleToThreads(
            request.originalContent.split("\n")[0],
            request.originalContent
          );
          break;

        default:
          throw new Error(`Unknown repurpose type: ${request.sourceType}`);
      }

      logger.info({
        action: "repurposing.complete",
        type: request.sourceType,
      });

      return result;
    } catch (error) {
      logger.error({
        action: "repurposing.error",
        type: request.sourceType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get available repurposing types
   */
  static getAvailableTypes(): Array<{ type: RepurposeType; description: string }> {
    return [
      {
        type: "BLOG_TO_LINKEDIN",
        description: "Convert blog post to LinkedIn article",
      },
      {
        type: "BLOG_TO_TWITTER",
        description: "Convert blog post to Twitter thread",
      },
      {
        type: "YOUTUBE_TO_SOCIAL",
        description: "Convert YouTube video to social posts",
      },
      {
        type: "PODCAST_TO_SOCIAL",
        description: "Convert podcast episode to social posts",
      },
      {
        type: "LONG_TO_CAROUSEL",
        description: "Convert long content to carousel slides",
      },
      {
        type: "ARTICLE_TO_THREADS",
        description: "Convert article to multi-part threads",
      },
    ];
  }
}
