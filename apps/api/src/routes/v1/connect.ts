import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { ApiKeyRequest, requireWriteScope } from "../../middleware/apiKeyAuth";
import { ProfileService } from "../../services/profile.service";
import { OAuthService, OAuthProvider } from "../../services/oauth.service";
import { BlueskyService } from "../../services/bluesky.service";
import { createOAuthState } from "../../lib/oauth-state-store";
import { ApiError, ErrorCodes } from "../../types";
import { logger } from "../../lib/logger";
import prisma from "../../lib/db";

const router = Router();

const OAUTH_PLATFORMS: OAuthProvider[] = ["TWITTER", "LINKEDIN", "FACEBOOK", "INSTAGRAM", "THREADS"];

const asyncHandler =
  (fn: Function) => (req: ApiKeyRequest, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// GET /v1/connect/:platform?profileId=... - start an OAuth connect flow
router.get(
  "/:platform",
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const platform = req.params.platform.toUpperCase() as OAuthProvider;
    const profileId = req.query.profileId as string | undefined;

    if (!profileId) {
      throw new ApiError(ErrorCodes.BAD_REQUEST, "profileId query parameter is required", 400);
    }
    if (!OAUTH_PLATFORMS.includes(platform)) {
      throw new ApiError(
        ErrorCodes.BAD_REQUEST,
        `Unsupported platform for OAuth connect: ${req.params.platform}. Use POST /v1/connect/bluesky/credentials for Bluesky.`,
        400
      );
    }

    // Throws 404 if the profile doesn't belong to this team.
    await ProfileService.getProfile(req.teamId!, profileId);

    const state = uuidv4();
    createOAuthState(state, {
      provider: platform,
      teamId: req.teamId!,
      userId: req.apiKeyId || "",
      profileId,
    });

    const authUrl = OAuthService.generateAuthUrl(platform, state);

    logger.info({ action: "v1.connect.authorize_initiated", platform, teamId: req.teamId, profileId });

    res.json({ authUrl });
  })
);

const blueskyCredentialsSchema = z.object({
  identifier: z.string().min(1),
  appPassword: z.string().min(1),
  profileId: z.string().min(1),
});

// POST /v1/connect/bluesky/credentials - connect via handle + App Password
router.post(
  "/bluesky/credentials",
  requireWriteScope,
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const body = blueskyCredentialsSchema.parse(req.body);

    await ProfileService.getProfile(req.teamId!, body.profileId);

    const session = await BlueskyService.createSession(body.identifier, body.appPassword);

    const existing = await prisma.socialAccount.findFirst({
      where: { profileId: body.profileId, platform: "BLUESKY", platformAccountId: session.did },
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
            teamId: req.teamId!,
            profileId: body.profileId,
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

    logger.info({ action: "v1.connect.bluesky_connected", teamId: req.teamId, accountId: account.id });

    res.status(201).json({
      account: {
        _id: account.id,
        platform: account.platform,
        username: account.username,
        displayName: account.displayName,
        profileId: account.profileId,
        connectedAt: account.connectedAt,
      },
    });
  })
);

export default router;
