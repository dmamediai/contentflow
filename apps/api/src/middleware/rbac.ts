import { Response, NextFunction } from "express";
import { ApiError, ErrorCodes } from "../types";
import { AuthRequest } from "./auth";
import prisma from "../lib/db";

export type Permission =
  | "team:read"
  | "team:write"
  | "team:delete"
  | "team:invite"
  | "posts:read"
  | "posts:write"
  | "posts:delete"
  | "posts:publish"
  | "media:read"
  | "media:write"
  | "media:delete"
  | "analytics:read"
  | "subscriptions:read"
  | "subscriptions:write"
  | "admin:read"
  | "admin:write";

export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

const rolePermissions: Record<Role, Permission[]> = {
  OWNER: [
    "team:read",
    "team:write",
    "team:delete",
    "team:invite",
    "posts:read",
    "posts:write",
    "posts:delete",
    "posts:publish",
    "media:read",
    "media:write",
    "media:delete",
    "analytics:read",
    "subscriptions:read",
    "subscriptions:write",
    "admin:read",
    "admin:write",
  ],
  ADMIN: [
    "team:read",
    "team:write",
    "team:invite",
    "posts:read",
    "posts:write",
    "posts:delete",
    "posts:publish",
    "media:read",
    "media:write",
    "media:delete",
    "analytics:read",
    "subscriptions:read",
    "admin:read",
  ],
  MEMBER: [
    "team:read",
    "posts:read",
    "posts:write",
    "posts:publish",
    "media:read",
    "media:write",
    "analytics:read",
  ],
  VIEWER: ["team:read", "posts:read", "analytics:read"],
};

export function authorize(...requiredPermissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    (async () => {
      try {
        if (!req.user?.teamId) {
          throw new ApiError(
            ErrorCodes.FORBIDDEN,
            "No team context found",
            403
          );
        }

        // Get user's role in team
        const teamMember = await prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: req.user.teamId,
              userId: req.user.id,
            },
          },
        });

        if (!teamMember) {
          throw new ApiError(
            ErrorCodes.FORBIDDEN,
            "User not a member of this team",
            403
          );
        }

        // Get permissions for user's role
        const userPermissions = rolePermissions[teamMember.role];

        // Check if user has all required permissions
        const hasPermission = requiredPermissions.every((perm) =>
          userPermissions.includes(perm)
        );

        if (!hasPermission) {
          throw new ApiError(
            ErrorCodes.FORBIDDEN,
            `Missing required permissions: ${requiredPermissions.join(", ")}`,
            403
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    })();
  };
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    (async () => {
      try {
        if (!req.user?.teamId) {
          throw new ApiError(
            ErrorCodes.FORBIDDEN,
            "No team context found",
            403
          );
        }

        const teamMember = await prisma.teamMember.findUnique({
          where: {
            teamId_userId: {
              teamId: req.user.teamId,
              userId: req.user.id,
            },
          },
        });

        if (!teamMember || !roles.includes(teamMember.role)) {
          throw new ApiError(
            ErrorCodes.FORBIDDEN,
            `Required roles: ${roles.join(", ")}`,
            403
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    })();
  };
}

export function teamContext(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  (async () => {
    try {
      if (!req.user?.teamId) {
        throw new ApiError(
          ErrorCodes.UNAUTHORIZED,
          "Team context required",
          401
        );
      }

      // Verify team exists and user is member
      const team = await prisma.team.findUnique({
        where: { id: req.user.teamId },
      });

      if (!team) {
        throw new ApiError(ErrorCodes.NOT_FOUND, "Team not found", 404);
      }

      const teamMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: req.user.teamId,
            userId: req.user.id,
          },
        },
      });

      if (!teamMember) {
        throw new ApiError(
          ErrorCodes.FORBIDDEN,
          "User not a member of this team",
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  })();
}
