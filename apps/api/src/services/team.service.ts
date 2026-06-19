import { Prisma } from "@prisma/client";
import prisma from "../lib/db";
import { ApiError, ErrorCodes } from "@social-media-saas/types";
import { slugify } from "../utils/string";

export class TeamService {
  /**
   * Create a new team and add the creator as OWNER
   */
  static async createTeam(
    userId: string,
    data: {
      name: string;
      slug?: string;
      image?: string;
      description?: string;
    }
  ) {
    const slug = data.slug || slugify(data.name);

    // Check if slug already exists
    const existingTeam = await prisma.team.findUnique({
      where: { slug },
    });

    if (existingTeam) {
      throw new ApiError(
        ErrorCodes.CONFLICT,
        "Team slug already exists",
        409
      );
    }

    // Create team with transaction
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: data.name,
          slug,
          image: data.image,
          description: data.description,
          createdBy: userId,
        },
      });

      // Add creator as OWNER
      await tx.teamMember.create({
        data: {
          teamId: newTeam.id,
          userId,
          role: "OWNER",
        },
      });

      // Create free tier subscription
      await tx.subscription.create({
        data: {
          teamId: newTeam.id,
          plan: "FREE",
          status: "ACTIVE",
          postsLimit: 10,
          aiCreditsLimit: 100,
          teamMembersLimit: 1,
          storageLimit: 100,
        },
      });

      return newTeam;
    });

    return team;
  }

  /**
   * Get all teams for a user
   */
  static async getUserTeams(userId: string, page = 1, limit = 20) {
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: true,
        subscription: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.team.count({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
    });

    return {
      data: teams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get team details by ID
   */
  static async getTeamById(teamId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        subscription: true,
        _count: {
          select: {
            members: true,
            posts: true,
            socialAccounts: true,
          },
        },
      },
    });

    if (!team) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "Team not found", 404);
    }

    return team;
  }

  /**
   * Update team details
   */
  static async updateTeam(
    teamId: string,
    data: Partial<{
      name: string;
      description: string;
      image: string;
    }>
  ) {
    const team = await prisma.team.update({
      where: { id: teamId },
      data,
    });

    return team;
  }

  /**
   * Delete team (OWNER only)
   */
  static async deleteTeam(teamId: string) {
    return await prisma.$transaction(async (tx) => {
      // Delete all team data
      await tx.teamMember.deleteMany({ where: { teamId } });
      await tx.subscription.deleteMany({ where: { teamId } });
      await tx.post.deleteMany({ where: { teamId } });
      await tx.media.deleteMany({ where: { teamId } });
      await tx.socialAccount.deleteMany({ where: { teamId } });
      await tx.analyticsEvent.deleteMany({ where: { teamId } });
      await tx.aiUsageLog.deleteMany({ where: { teamId } });
      await tx.apiKey.deleteMany({ where: { teamId } });
      await tx.featureFlagVariant.deleteMany({ where: { teamId } });

      // Delete team
      const team = await tx.team.delete({ where: { id: teamId } });

      return team;
    });
  }

  /**
   * Add member to team
   */
  static async addTeamMember(
    teamId: string,
    userEmail: string,
    role: "ADMIN" | "MEMBER" | "VIEWER"
  ) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "User not found", 404);
    }

    // Check if already member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ApiError(
        ErrorCodes.CONFLICT,
        "User is already a team member",
        409
      );
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return member;
  }

  /**
   * Update team member role
   */
  static async updateTeamMemberRole(
    teamId: string,
    userId: string,
    role: "ADMIN" | "MEMBER" | "VIEWER"
  ) {
    const member = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return member;
  }

  /**
   * Remove team member
   */
  static async removeTeamMember(teamId: string, userId: string) {
    // Check if there's at least one OWNER remaining
    const ownerCount = await prisma.teamMember.count({
      where: {
        teamId,
        role: "OWNER",
      },
    });

    const memberToRemove = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (memberToRemove?.role === "OWNER" && ownerCount === 1) {
      throw new ApiError(
        ErrorCodes.BAD_REQUEST,
        "Cannot remove the only owner. Transfer ownership first.",
        400
      );
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });
  }

  /**
   * Get team members
   */
  static async getTeamMembers(teamId: string, page = 1, limit = 20) {
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { joinedAt: "desc" },
    });

    const total = await prisma.teamMember.count({
      where: { teamId },
    });

    return {
      data: members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get team subscription
   */
  static async getTeamSubscription(teamId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { teamId },
    });

    if (!subscription) {
      throw new ApiError(
        ErrorCodes.NOT_FOUND,
        "Subscription not found",
        404
      );
    }

    return subscription;
  }
}
