import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { OAuthService } from "../services/oauth.service";
import { logger } from "../lib/logger";
import prisma from "../lib/db";

const router = Router();

// Store OAuth states temporarily (in production, use Redis)
const oauthStates = new Map<string, { provider: string; teamId: string; userId: string; expiresAt: Date }>();

// Clean up expired states every minute
setInterval(() => {
  const now = new Date();
  for (const [state, data] of oauthStates.entries()) {
    if (data.expiresAt < now) {
      oauthStates.delete(state);
    }
  }
}, 60000);

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/oauth/authorize/:provider - Start OAuth flow
router.get(
  "/authorize/:provider",
  authenticateJWT,
  teamContext,
  authorize("social:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const provider = req.params.provider.toUpperCase() as any;

    // Validate provider
    const validProviders = ["TWITTER", "LINKEDIN", "FACEBOOK", "INSTAGRAM", "THREADS"];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: "Invalid provider" });
    }

    // Generate state
    const state = uuidv4();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store state
    oauthStates.set(state, {
      provider,
      teamId: req.user!.teamId!,
      userId: req.user!.id!,
      expiresAt,
    });

    // Generate auth URL
    const authUrl = OAuthService.generateAuthUrl(provider, state);

    logger.info({
      action: "oauth.authorize_initiated",
      provider,
      teamId: req.user!.teamId,
    });

    res.json({
      success: true,
      data: {
        authUrl,
      },
    });
  })
);

// GET /api/oauth/callback/:provider - Handle OAuth callback
router.get(
  "/callback/:provider",
  asyncHandler(async (req: Request, res: Response) => {
    const provider = req.params.provider.toUpperCase();
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;

    // Check for errors
    if (error) {
      logger.error({
        action: "oauth.callback_error",
        provider,
        error,
      });
      return res.redirect(`/social/connect?error=${error}`);
    }

    // Validate state
    const stateData = oauthStates.get(state);
    if (!stateData || stateData.provider !== provider) {
      logger.error({
        action: "oauth.invalid_state",
        provider,
      });
      return res.redirect("/social/connect?error=invalid_state");
    }

    try {
      // Remove used state
      oauthStates.delete(state);

      // Exchange code for token
      const token = await OAuthService.exchangeCodeForToken(provider as any, code);

      // Get user info
      const userInfo = await OAuthService.getUserInfo(provider as any, token.accessToken);

      // Save social account
      const account = await OAuthService.saveSocialAccount(
        stateData.teamId,
        stateData.userId,
        provider as any,
        token,
        userInfo
      );

      logger.info({
        action: "oauth.callback_success",
        provider,
        teamId: stateData.teamId,
        accountId: account.id,
      });

      // Redirect back to frontend with success
      res.redirect(`/social/connect?success=true&provider=${provider}`);
    } catch (error: any) {
      logger.error({
        action: "oauth.callback_error",
        provider,
        error: error.message,
      });
      res.redirect(`/social/connect?error=${error.message}`);
    }
  })
);

// GET /api/oauth/accounts - Get connected accounts
router.get(
  "/accounts",
  authenticateJWT,
  teamContext,
  authorize("social:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const accounts = await OAuthService.getConnectedAccounts(req.user!.teamId!);

    res.json({
      success: true,
      data: accounts,
    });
  })
);

// DELETE /api/oauth/accounts/:accountId - Disconnect account
router.delete(
  "/accounts/:accountId",
  authenticateJWT,
  teamContext,
  authorize("social:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await OAuthService.disconnectAccount(
      req.user!.teamId!,
      req.params.accountId
    );

    logger.info({
      action: "oauth.account_disconnected",
      teamId: req.user!.teamId,
      accountId: req.params.accountId,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
