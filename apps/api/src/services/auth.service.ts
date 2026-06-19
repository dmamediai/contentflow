import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/db";
import { ApiError, ErrorCodes } from "../types";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";
const JWT_EXPIRATION = "1h";
const REFRESH_TOKEN_EXPIRATION = "30d";

export class AuthService {
  /**
   * Hash password using bcryptjs
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcryptjs.genSalt(10);
    return bcryptjs.hash(password, salt);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcryptjs.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  static generateToken(
    userId: string,
    email: string,
    teamId?: string,
    expiresIn: string = JWT_EXPIRATION
  ): string {
    return jwt.sign(
      {
        sub: userId,
        id: userId,
        email,
        teamId,
      },
      JWT_SECRET,
      { expiresIn }
    );
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as any;
    } catch (error) {
      throw new ApiError(
        ErrorCodes.INVALID_TOKEN,
        "Invalid or expired token",
        401
      );
    }
  }

  /**
   * Register new user and create first team
   */
  static async register(data: {
    email: string;
    password: string;
    name: string;
    teamName: string;
  }) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ApiError(
        ErrorCodes.CONFLICT,
        "User with this email already exists",
        409
      );
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user and team in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
        },
      });

      // Create team
      const team = await tx.team.create({
        data: {
          name: data.teamName,
          slug: data.teamName.toLowerCase().replace(/\s+/g, "-"),
          createdBy: user.id,
        },
      });

      // Add user as OWNER
      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: user.id,
          role: "OWNER",
        },
      });

      // Create free subscription
      await tx.subscription.create({
        data: {
          teamId: team.id,
          plan: "FREE",
          status: "ACTIVE",
          postsLimit: 10,
          aiCreditsLimit: 100,
          teamMembersLimit: 1,
          storageLimit: 100,
        },
      });

      return { user, team };
    });

    // Generate tokens
    const accessToken = this.generateToken(
      result.user.id,
      result.user.email,
      result.team.id
    );

    const refreshToken = this.generateToken(
      result.user.id,
      result.user.email,
      result.team.id,
      REFRESH_TOKEN_EXPIRATION
    );

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        image: result.user.image,
      },
      team: {
        id: result.team.id,
        name: result.team.name,
        slug: result.team.slug,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user with email and password
   */
  static async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        teamMembers: {
          take: 1,
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(
        ErrorCodes.UNAUTHORIZED,
        "Invalid email or password",
        401
      );
    }

    if (!user.password) {
      throw new ApiError(
        ErrorCodes.UNAUTHORIZED,
        "User registered with OAuth. Please use OAuth to login.",
        401
      );
    }

    // Compare password
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(
        ErrorCodes.UNAUTHORIZED,
        "Invalid email or password",
        401
      );
    }

    // Get default team (first one user is member of)
    const defaultTeam = user.teamMembers[0]?.team;

    // Generate tokens
    const accessToken = this.generateToken(
      user.id,
      user.email,
      defaultTeam?.id
    );

    const refreshToken = this.generateToken(
      user.id,
      user.email,
      defaultTeam?.id,
      REFRESH_TOKEN_EXPIRATION
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      team: defaultTeam
        ? {
            id: defaultTeam.id,
            name: defaultTeam.name,
            slug: defaultTeam.slug,
          }
        : null,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string) {
    try {
      const decoded = this.verifyToken(refreshToken);

      // Generate new access token
      const newAccessToken = this.generateToken(
        decoded.sub,
        decoded.email,
        decoded.teamId
      );

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      throw new ApiError(
        ErrorCodes.INVALID_TOKEN,
        "Invalid or expired refresh token",
        401
      );
    }
  }

  /**
   * Get user profile with teams
   */
  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teamMembers: {
          include: {
            team: true,
          },
        },
        profile: true,
      },
    });

    if (!user) {
      throw new ApiError(ErrorCodes.NOT_FOUND, "User not found", 404);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        profile: user.profile,
      },
      teams: user.teamMembers.map((m) => ({
        id: m.team.id,
        name: m.team.name,
        slug: m.team.slug,
        role: m.role,
      })),
    };
  }

  /**
   * Verify email (placeholder for future email verification)
   */
  static async verifyEmail(email: string) {
    // TODO: Implement email verification flow
    // For now, mark as verified on registration
    return true;
  }
}
