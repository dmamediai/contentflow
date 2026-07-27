import { Router, Response, NextFunction } from "express";
import { ApiKeyRequest, requireWriteScope } from "../../middleware/apiKeyAuth";
import { ApiError, ErrorCodes } from "../../types";
import { logger } from "../../lib/logger";
import prisma from "../../lib/db";

const router = Router();

const asyncHandler =
  (fn: Function) => (req: ApiKeyRequest, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const ACCOUNT_SELECT = {
  id: true,
  profileId: true,
  platform: true,
  displayName: true,
  username: true,
  profileUrl: true,
  profileImage: true,
  connectedAt: true,
  updatedAt: true,
} as const;

// GET /v1/accounts?profileId=...
router.get(
  "/",
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const profileId = req.query.profileId as string | undefined;

    const accounts = await prisma.socialAccount.findMany({
      where: { teamId: req.teamId!, ...(profileId && { profileId }) },
      select: ACCOUNT_SELECT,
      orderBy: { connectedAt: "desc" },
    });

    res.json({ accounts: accounts.map((a) => ({ ...a, _id: a.id })) });
  })
);

// GET /v1/accounts/:accountId
router.get(
  "/:accountId",
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const account = await prisma.socialAccount.findFirst({
      where: { id: req.params.accountId, teamId: req.teamId! },
      select: ACCOUNT_SELECT,
    });

    if (!account) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Account not found", 404);
    }

    res.json({ account: { ...account, _id: account.id } });
  })
);

// DELETE /v1/accounts/:accountId
router.delete(
  "/:accountId",
  requireWriteScope,
  asyncHandler(async (req: ApiKeyRequest, res: Response) => {
    const account = await prisma.socialAccount.findFirst({
      where: { id: req.params.accountId, teamId: req.teamId! },
    });

    if (!account) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Account not found", 404);
    }

    await prisma.socialAccount.delete({ where: { id: account.id } });

    logger.info({ action: "v1.accounts.disconnected", teamId: req.teamId, accountId: account.id });

    res.json({ message: "Account disconnected successfully" });
  })
);

export default router;
