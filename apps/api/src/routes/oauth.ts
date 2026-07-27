import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { teamContext, authorize } from "../middleware/rbac";
import { OAuthService } from "../services/oauth.service";
import { ProfileService } from "../services/profile.service";
import { createOAuthState, consumeOAuthState } from "../lib/oauth-state-store";
import { logger } from "../lib/logger";
import prisma from "../lib/db";

const router = Router();

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

    // Resolve the team's Default profile - the dashboard flow doesn't expose
    // profile selection yet, so connected accounts land there.
    const defaultProfile = await ProfileService.getDefaultProfile(req.user!.teamId!);

    // Generate state
    const state = uuidv4();
    createOAuthState(state, {
      provider,
      teamId: req.user!.teamId!,
      userId: req.user!.id!,
      profileId: defaultProfile.id,
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
    const stateData = consumeOAuthState(state);
    if (!stateData || stateData.provider !== provider) {
      logger.error({
        action: "oauth.invalid_state",
        provider,
      });
      return res.redirect("/social/connect?error=invalid_state");
    }

    try {
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
        userInfo,
        stateData.profileId
      );

      logger.info({
        action: "oauth.callback_success",
        provider,
        teamId: stateData.teamId,
        accountId: account.id,
      });

      const { AuditLogService } = await import("../services/audit-log.service");
      AuditLogService.record({
        teamId: stateData.teamId,
        userId: stateData.userId,
        action: "account.connected",
        resource: "Connections",
        resourceId: account.id,
        platform: provider as any,
        message: `Connected ${account.displayName} (@${account.username})`,
      });

      // Redirect back to frontend with success
      res.redirect(`/social/connect?success=true&provider=${provider}`);
    } catch (error: any) {
      logger.error({
        action: "oauth.callback_error",
        provider,
        error: error.message,
      });

      const { AuditLogService } = await import("../services/audit-log.service");
      AuditLogService.record({
        teamId: stateData.teamId,
        userId: stateData.userId,
        action: "account.connect_failed",
        resource: "Connections",
        status: "FAILED",
        platform: provider as any,
        message: error.message,
      });

      res.redirect(`/social/connect?error=${error.message}`);
    }
  })
);

const blueskyCredentialsSchema = z.object({
  identifier: z.string().min(1),
  appPassword: z.string().min(1),
  profileId: z.string().min(1).optional(),
});

// POST /api/oauth/bluesky/credentials - Connect Bluesky via handle + App Password
router.post(
  "/bluesky/credentials",
  authenticateJWT,
  teamContext,
  authorize("social:write"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = blueskyCredentialsSchema.parse(req.body);
    const { BlueskyService } = await import("../services/bluesky.service");

    const profile = body.profileId
      ? await ProfileService.getProfile(req.user!.teamId!, body.profileId)
      : await ProfileService.getDefaultProfile(req.user!.teamId!);

    const session = await BlueskyService.createSession(body.identifier, body.appPassword);

    const existing = await prisma.socialAccount.findFirst({
      where: { profileId: profile.id, platform: "BLUESKY", platformAccountId: session.did },
    });

    const account = existing
      ? await prisma.socialAccount.update({
          where: { id: existing.id },
          data: {
            accessToken: session.accessJwt,
            refreshToken: session.refreshJwt,
            displayName: session.handle,
            username: session.handle,
            meta: { did: session.did, handle: session.handle },
          },
        })
      : await prisma.socialAccount.create({
          data: {
            teamId: req.user!.teamId!,
            profileId: profile.id,
            platform: "BLUESKY",
            platformAccountId: session.did,
            displayName: session.handle,
            username: session.handle,
            profileUrl: `https://bsky.app/profile/${session.handle}`,
            accessToken: session.accessJwt,
            refreshToken: session.refreshJwt,
            meta: { did: session.did, handle: session.handle },
          },
        });

    logger.info({ action: "oauth.bluesky_connected", teamId: req.user!.teamId, accountId: account.id });

    res.status(201).json({ success: true, data: account });
  })
);

// GET /api/oauth/accounts - Get connected accounts
router.get(
  "/accounts",
  authenticateJWT,
  teamContext,
  authorize("social:read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const profileId = req.query.profileId as string | undefined;
    const accounts = await OAuthService.getConnectedAccounts(req.user!.teamId!, profileId);

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

    const { AuditLogService } = await import("../services/audit-log.service");
    AuditLogService.record({
      teamId: req.user!.teamId!,
      userId: req.user!.id,
      action: "account.disconnected",
      resource: "Connections",
      resourceId: req.params.accountId,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
