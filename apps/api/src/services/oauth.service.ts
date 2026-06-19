import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import prisma from "../lib/db";
import { logger } from "../lib/logger";
import { ApiError, ErrorCodes } from "@social-media-saas/types";

export type OAuthProvider = "TWITTER" | "LINKEDIN" | "FACEBOOK" | "INSTAGRAM" | "THREADS";

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}

export class OAuthService {
  private static configs: Record<OAuthProvider, OAuthConfig> = {
    TWITTER: {
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
      redirectUri: `${process.env.API_URL}/api/oauth/callback/twitter`,
    },
    LINKEDIN: {
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
      redirectUri: `${process.env.API_URL}/api/oauth/callback/linkedin`,
    },
    FACEBOOK: {
      clientId: process.env.FACEBOOK_APP_ID || "",
      clientSecret: process.env.FACEBOOK_APP_SECRET || "",
      redirectUri: `${process.env.API_URL}/api/oauth/callback/facebook`,
    },
    INSTAGRAM: {
      clientId: process.env.FACEBOOK_APP_ID || "",
      clientSecret: process.env.FACEBOOK_APP_SECRET || "",
      redirectUri: `${process.env.API_URL}/api/oauth/callback/instagram`,
    },
    THREADS: {
      clientId: process.env.THREADS_CLIENT_ID || "",
      clientSecret: process.env.THREADS_CLIENT_SECRET || "",
      redirectUri: `${process.env.API_URL}/api/oauth/callback/threads`,
    },
  };

  /**
   * Generate OAuth authorization URL
   */
  static generateAuthUrl(provider: OAuthProvider, state: string): string {
    const config = this.configs[provider];

    switch (provider) {
      case "TWITTER":
        return this.generateTwitterAuthUrl(config, state);
      case "LINKEDIN":
        return this.generateLinkedInAuthUrl(config, state);
      case "FACEBOOK":
        return this.generateFacebookAuthUrl(config, state);
      case "INSTAGRAM":
        return this.generateInstagramAuthUrl(config, state);
      case "THREADS":
        return this.generateThreadsAuthUrl(config, state);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Generate Twitter OAuth URL
   */
  private static generateTwitterAuthUrl(config: OAuthConfig, state: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: "tweet.read tweet.write users.read follows.read follows.write",
      state,
      code_challenge_method: "s256",
      code_challenge: state, // In production, generate proper PKCE challenge
    });

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Generate LinkedIn OAuth URL
   */
  private static generateLinkedInAuthUrl(config: OAuthConfig, state: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: "w_member_social r_organization_social w_organization_social",
      state,
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  /**
   * Generate Facebook OAuth URL
   */
  private static generateFacebookAuthUrl(config: OAuthConfig, state: string): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: "pages_manage_posts,pages_read_engagement,instagram_basic,instagram_graph_user_media",
      response_type: "code",
      state,
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Generate Instagram OAuth URL
   */
  private static generateInstagramAuthUrl(config: OAuthConfig, state: string): string {
    // Instagram uses Facebook OAuth
    return this.generateFacebookAuthUrl(config, state);
  }

  /**
   * Generate Threads OAuth URL
   */
  private static generateThreadsAuthUrl(config: OAuthConfig, state: string): string {
    // Threads uses Meta/Facebook auth
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: "threads_basic,threads_manage_posts,threads_read_replies",
      response_type: "code",
      state,
    });

    return `https://www.threads.net/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange code for token
   */
  static async exchangeCodeForToken(
    provider: OAuthProvider,
    code: string
  ): Promise<OAuthToken> {
    const config = this.configs[provider];

    switch (provider) {
      case "TWITTER":
        return this.exchangeTwitterToken(config, code);
      case "LINKEDIN":
        return this.exchangeLinkedInToken(config, code);
      case "FACEBOOK":
        return this.exchangeFacebookToken(config, code);
      case "INSTAGRAM":
        return this.exchangeInstagramToken(config, code);
      case "THREADS":
        return this.exchangeThreadsToken(config, code);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Exchange Twitter code for token
   */
  private static async exchangeTwitterToken(config: OAuthConfig, code: string): Promise<OAuthToken> {
    try {
      const response = await axios.post(
        "https://twitter.com/2/oauth2/token",
        {
          code,
          grant_type: "authorization_code",
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          code_verifier: "challenge", // In production, use real PKCE verifier
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          auth: {
            username: config.clientId,
            password: config.clientSecret,
          },
        }
      );

      const expiresAt = response.data.expires_in
        ? new Date(Date.now() + response.data.expires_in * 1000)
        : undefined;

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt,
        scope: response.data.scope,
      };
    } catch (error) {
      logger.error({
        action: "oauth.twitter_exchange_error",
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError(ErrorCodes.BAD_REQUEST, "Failed to exchange Twitter token", 400);
    }
  }

  /**
   * Exchange LinkedIn code for token
   */
  private static async exchangeLinkedInToken(
    config: OAuthConfig,
    code: string
  ): Promise<OAuthToken> {
    try {
      const response = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
          grant_type: "authorization_code",
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.redirectUri,
        }
      );

      const expiresAt = response.data.expires_in
        ? new Date(Date.now() + response.data.expires_in * 1000)
        : undefined;

      return {
        accessToken: response.data.access_token,
        refreshToken: undefined,
        expiresAt,
      };
    } catch (error) {
      logger.error({
        action: "oauth.linkedin_exchange_error",
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError(ErrorCodes.BAD_REQUEST, "Failed to exchange LinkedIn token", 400);
    }
  }

  /**
   * Exchange Facebook code for token
   */
  private static async exchangeFacebookToken(
    config: OAuthConfig,
    code: string
  ): Promise<OAuthToken> {
    try {
      const response = await axios.get(
        "https://graph.facebook.com/v18.0/oauth/access_token",
        {
          params: {
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: config.redirectUri,
            code,
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: undefined,
        expiresAt: response.data.expires_in
          ? new Date(Date.now() + response.data.expires_in * 1000)
          : undefined,
      };
    } catch (error) {
      logger.error({
        action: "oauth.facebook_exchange_error",
        error: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError(ErrorCodes.BAD_REQUEST, "Failed to exchange Facebook token", 400);
    }
  }

  /**
   * Exchange Instagram code for token
   */
  private static async exchangeInstagramToken(
    config: OAuthConfig,
    code: string
  ): Promise<OAuthToken> {
    // Instagram uses Facebook token exchange
    return this.exchangeFacebookToken(config, code);
  }

  /**
   * Exchange Threads code for token
   */
  private static async exchangeThreadsToken(
    config: OAuthConfig,
    code: string
  ): Promise<OAuthToken> {
    // Threads uses Meta/Facebook token exchange
    return this.exchangeFacebookToken(config, code);
  }

  /**
   * Get user info from provider
   */
  static async getUserInfo(
    provider: OAuthProvider,
    accessToken: string
  ): Promise<{ id: string; username: string; name: string; profileImage?: string }> {
    switch (provider) {
      case "TWITTER":
        return this.getTwitterUserInfo(accessToken);
      case "LINKEDIN":
        return this.getLinkedInUserInfo(accessToken);
      case "FACEBOOK":
        return this.getFacebookUserInfo(accessToken);
      case "INSTAGRAM":
        return this.getInstagramUserInfo(accessToken);
      case "THREADS":
        return this.getThreadsUserInfo(accessToken);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Get Twitter user info
   */
  private static async getTwitterUserInfo(accessToken: string): Promise<any> {
    const response = await axios.get("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { "user.fields": "profile_image_url" },
    });

    return {
      id: response.data.data.id,
      username: response.data.data.username,
      name: response.data.data.name,
      profileImage: response.data.data.profile_image_url,
    };
  }

  /**
   * Get LinkedIn user info
   */
  private static async getLinkedInUserInfo(accessToken: string): Promise<any> {
    const response = await axios.get("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      id: response.data.id,
      username: response.data.localizedFirstName,
      name: `${response.data.localizedFirstName} ${response.data.localizedLastName}`,
      profileImage: response.data.profilePicture?.displayImage,
    };
  }

  /**
   * Get Facebook user info
   */
  private static async getFacebookUserInfo(accessToken: string): Promise<any> {
    const response = await axios.get("https://graph.facebook.com/me", {
      params: {
        access_token: accessToken,
        fields: "id,name,picture",
      },
    });

    return {
      id: response.data.id,
      username: response.data.name,
      name: response.data.name,
      profileImage: response.data.picture?.data?.url,
    };
  }

  /**
   * Get Instagram user info
   */
  private static async getInstagramUserInfo(accessToken: string): Promise<any> {
    // Get Instagram business account info via Facebook API
    const response = await axios.get("https://graph.instagram.com/me", {
      params: {
        access_token: accessToken,
        fields: "id,username,name,profile_picture_url",
      },
    });

    return {
      id: response.data.id,
      username: response.data.username,
      name: response.data.name,
      profileImage: response.data.profile_picture_url,
    };
  }

  /**
   * Get Threads user info
   */
  private static async getThreadsUserInfo(accessToken: string): Promise<any> {
    const response = await axios.get("https://graph.threads.net/me", {
      params: {
        access_token: accessToken,
        fields: "id,username,name,profile_picture_url",
      },
    });

    return {
      id: response.data.id,
      username: response.data.username,
      name: response.data.name,
      profileImage: response.data.profile_picture_url,
    };
  }

  /**
   * Refresh token if needed
   */
  static async refreshTokenIfNeeded(socialAccount: any): Promise<string> {
    // Check if token is expired
    if (socialAccount.accessTokenExpiresAt && new Date() > socialAccount.accessTokenExpiresAt) {
      // Try to refresh
      if (socialAccount.refreshToken) {
        try {
          const newToken = await this.refreshToken(
            socialAccount.platform as OAuthProvider,
            socialAccount.refreshToken
          );

          // Update in database
          await prisma.socialAccount.update({
            where: { id: socialAccount.id },
            data: {
              accessToken: newToken.accessToken,
              accessTokenExpiresAt: newToken.expiresAt,
            },
          });

          return newToken.accessToken;
        } catch (error) {
          logger.error({
            action: "oauth.token_refresh_error",
            platform: socialAccount.platform,
            error: error instanceof Error ? error.message : String(error),
          });
          throw new ApiError(
            ErrorCodes.BAD_REQUEST,
            "Failed to refresh social media token",
            400
          );
        }
      }
    }

    return socialAccount.accessToken;
  }

  /**
   * Refresh access token
   */
  private static async refreshToken(
    provider: OAuthProvider,
    refreshToken: string
  ): Promise<OAuthToken> {
    const config = this.configs[provider];

    // Twitter has different refresh logic
    if (provider === "TWITTER") {
      const response = await axios.post(
        "https://twitter.com/2/oauth2/token",
        {
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: config.clientId,
        },
        {
          auth: {
            username: config.clientId,
            password: config.clientSecret,
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: response.data.expires_in
          ? new Date(Date.now() + response.data.expires_in * 1000)
          : undefined,
      };
    }

    throw new Error(`Token refresh not implemented for ${provider}`);
  }

  /**
   * Save social account
   */
  static async saveSocialAccount(
    teamId: string,
    userId: string,
    provider: OAuthProvider,
    token: OAuthToken,
    userInfo: any
  ) {
    // Check if account already exists
    const existing = await prisma.socialAccount.findFirst({
      where: {
        teamId,
        platform: provider,
        platformAccountId: userInfo.id,
      },
    });

    if (existing) {
      // Update existing
      return prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          accessToken: token.accessToken,
          accessTokenExpiresAt: token.expiresAt,
          refreshToken: token.refreshToken,
          displayName: userInfo.name,
          username: userInfo.username,
          profileImage: userInfo.profileImage,
        },
      });
    }

    // Create new
    return prisma.socialAccount.create({
      data: {
        teamId,
        platform: provider,
        platformAccountId: userInfo.id,
        displayName: userInfo.name,
        username: userInfo.username,
        profileUrl: `https://${provider.toLowerCase()}.com/${userInfo.username}`,
        profileImage: userInfo.profileImage,
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.expiresAt,
        refreshToken: token.refreshToken,
        connectedAt: new Date(),
      },
    });
  }

  /**
   * Disconnect social account
   */
  static async disconnectAccount(teamId: string, accountId: string) {
    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || account.teamId !== teamId) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Account not found", 404);
    }

    await prisma.socialAccount.delete({
      where: { id: accountId },
    });

    return { message: "Account disconnected successfully" };
  }

  /**
   * Get connected accounts for team
   */
  static async getConnectedAccounts(teamId: string) {
    return prisma.socialAccount.findMany({
      where: { teamId },
      select: {
        id: true,
        platform: true,
        displayName: true,
        username: true,
        profileImage: true,
        connectedAt: true,
      },
    });
  }
}
