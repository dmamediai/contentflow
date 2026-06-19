import axios from "axios";
import { z } from "zod";
import { logger } from "../lib/logger";

export type AIProvider = "OPENAI" | "ANTHROPIC" | "GOOGLE";

export interface GeneratePostRequest {
  topic: string;
  platform: "TWITTER" | "LINKEDIN" | "FACEBOOK" | "INSTAGRAM" | "THREADS";
  tone?: "professional" | "casual" | "funny" | "engaging" | "educational";
  length?: "short" | "medium" | "long";
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  includeCallToAction?: boolean;
}

export interface RewriteContentRequest {
  content: string;
  tone?: "professional" | "casual" | "funny" | "engaging" | "educational";
  style?: "concise" | "detailed" | "storytelling" | "persuasive";
}

export interface ExpandContentRequest {
  content: string;
  platform?: string;
  targetLength?: "medium" | "long";
}

export interface SummarizeContentRequest {
  content: string;
  style?: "bullet-points" | "paragraph" | "key-takeaways";
}

export interface TranslateContentRequest {
  content: string;
  targetLanguage: string;
}

export interface GenerateHashtagsRequest {
  content: string;
  count?: number;
  platform?: string;
  includeNiche?: boolean;
}

export interface GenerateHooksRequest {
  content: string;
  count?: number;
  style?: "question" | "statement" | "curiosity" | "benefit";
}

export interface GenerateCallToActionRequest {
  context: string;
  type?: "engagement" | "click" | "signup" | "purchase";
  count?: number;
}

export class AIService {
  private static provider: AIProvider = "OPENAI";
  private static openaiKey = process.env.OPENAI_API_KEY;
  private static anthropicKey = process.env.ANTHROPIC_API_KEY;
  private static googleKey = process.env.GOOGLE_API_KEY;

  /**
   * Generate a social media post using AI
   */
  static async generatePost(request: GeneratePostRequest): Promise<string> {
    const prompt = this.buildGeneratePostPrompt(request);
    return this.callAI(prompt, "You are a social media expert creating engaging posts.");
  }

  /**
   * Rewrite content with different tone/style
   */
  static async rewriteContent(request: RewriteContentRequest): Promise<string> {
    const prompt = `Rewrite the following content in a ${request.tone || "professional"} tone with ${request.style || "concise"} style:\n\n"${request.content}"`;
    return this.callAI(prompt, "You are a copywriting expert.");
  }

  /**
   * Expand content to longer form
   */
  static async expandContent(request: ExpandContentRequest): Promise<string> {
    const targetLength = request.targetLength === "long" ? "500+ words" : "200-300 words";
    const prompt = `Expand the following content to approximately ${targetLength}. Keep it engaging and add more details:\n\n"${request.content}"`;
    return this.callAI(prompt, "You are a content writer expert at expanding ideas.");
  }

  /**
   * Summarize content
   */
  static async summarizeContent(request: SummarizeContentRequest): Promise<string> {
    const style = request.style || "paragraph";
    const format = style === "bullet-points" ? "bullet points" : style === "key-takeaways" ? "key takeaways" : "a concise paragraph";
    const prompt = `Summarize the following content as ${format}:\n\n"${request.content}"`;
    return this.callAI(prompt, "You are an expert at condensing information.");
  }

  /**
   * Translate content to another language
   */
  static async translateContent(request: TranslateContentRequest): Promise<string> {
    const prompt = `Translate the following content to ${request.targetLanguage}. Keep the tone and meaning intact:\n\n"${request.content}"`;
    return this.callAI(prompt, "You are a professional translator.");
  }

  /**
   * Generate hashtags
   */
  static async generateHashtags(request: GenerateHashtagsRequest): Promise<string[]> {
    const count = request.count || 10;
    const niche = request.includeNiche ? "including niche and specific hashtags" : "popular and relevant";
    const prompt = `Generate ${count} ${niche} hashtags for this ${request.platform || "social media"} post:\n\n"${request.content}"`;
    const response = await this.callAI(prompt, "You are a social media strategy expert.");
    return response.split("\n").filter((tag) => tag.startsWith("#")).slice(0, count);
  }

  /**
   * Generate hook variations for posts
   */
  static async generateHooks(request: GenerateHooksRequest): Promise<string[]> {
    const count = request.count || 5;
    const style = request.style || "curiosity";
    const prompt = `Generate ${count} different ${style} hooks/opening lines for this content:\n\n"${request.content}"\n\nMake each one unique and attention-grabbing.`;
    const response = await this.callAI(prompt, "You are a copywriter expert at creating hooks.");
    return response.split("\n").filter((line) => line.trim().length > 0).slice(0, count);
  }

  /**
   * Generate call-to-action variations
   */
  static async generateCallToActions(request: GenerateCallToActionRequest): Promise<string[]> {
    const count = request.count || 5;
    const type = request.type || "engagement";
    const prompt = `Generate ${count} different call-to-action (CTA) lines for ${type} that work with this context:\n\n"${request.context}"\n\nMake them compelling and varied.`;
    const response = await this.callAI(prompt, "You are a conversion rate optimization expert.");
    return response.split("\n").filter((cta) => cta.trim().length > 0).slice(0, count);
  }

  /**
   * Build prompt for post generation
   */
  private static buildGeneratePostPrompt(request: GeneratePostRequest): string {
    const length =
      request.length === "short"
        ? "280 characters"
        : request.length === "long"
          ? "500+ characters"
          : "280-300 characters";

    const features = [];
    if (request.includeHashtags) features.push("Include relevant hashtags");
    if (request.includeEmojis) features.push("Include relevant emojis");
    if (request.includeCallToAction) features.push("End with a clear call-to-action");

    const featureString = features.length > 0 ? `\n\nRequirements:\n- ${features.join("\n- ")}` : "";

    return `Create a ${request.tone || "engaging"} ${request.platform} post about "${request.topic}" in approximately ${length}.${featureString}`;
  }

  /**
   * Call AI service based on configured provider
   */
  private static async callAI(prompt: string, systemPrompt: string): Promise<string> {
    try {
      if (this.provider === "OPENAI" && this.openaiKey) {
        return await this.callOpenAI(prompt, systemPrompt);
      } else if (this.provider === "ANTHROPIC" && this.anthropicKey) {
        return await this.callAnthropic(prompt, systemPrompt);
      } else if (this.provider === "GOOGLE" && this.googleKey) {
        return await this.callGoogle(prompt, systemPrompt);
      } else {
        // Fallback: return mock response
        return this.generateMockResponse(prompt);
      }
    } catch (error) {
      logger.error({
        action: "ai.call_error",
        provider: this.provider,
        error: error instanceof Error ? error.message : String(error),
      });
      return this.generateMockResponse(prompt);
    }
  }

  /**
   * Call OpenAI API
   */
  private static async callOpenAI(prompt: string, systemPrompt: string): Promise<string> {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${this.openaiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  }

  /**
   * Call Anthropic Claude API
   */
  private static async callAnthropic(prompt: string, systemPrompt: string): Promise<string> {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          "x-api-key": this.anthropicKey,
          "anthropic-version": "2023-06-01",
        },
      }
    );

    return response.data.content[0].text;
  }

  /**
   * Call Google Gemini API
   */
  private static async callGoogle(prompt: string, systemPrompt: string): Promise<string> {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.googleKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${prompt}`,
              },
            ],
          },
        ],
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  }

  /**
   * Generate mock response for testing/fallback
   */
  private static generateMockResponse(prompt: string): string {
    // Extract key info from prompt
    if (prompt.includes("hashtag")) {
      return "#ContentMarketing\n#SocialMedia\n#Digital\n#AI\n#Marketing\n#Growth";
    } else if (prompt.includes("call-to-action") || prompt.includes("CTA")) {
      return "Learn more\nGet started today\nJoin our community\nDiscover the difference";
    } else if (prompt.includes("hook")) {
      return "What if you could...\nHere's something most people miss...\nThis might surprise you...";
    } else {
      return "[AI-generated content] This is a mock response. Configure OpenAI, Anthropic, or Google API keys for real AI generation.";
    }
  }
}
