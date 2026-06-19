import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { logger } from "../lib/logger";
import rateLimit from "express-rate-limit";

const router = Router();

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: "Too many authentication attempts. Please try again later.",
  skipSuccessfulRequests: true,
});

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  teamName: z.string().min(2, "Team name must be at least 2 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

// Error handler wrapper
const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// POST /api/auth/register - Register new user
router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const body = registerSchema.parse(req.body);

    const result = await AuthService.register({
      email: body.email,
      password: body.password,
      name: body.name,
      teamName: body.teamName,
    });

    logger.info({
      action: "user.registered",
      userId: result.user.id,
      email: result.user.email,
    });

    // Set refresh token in httpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        team: result.team,
        accessToken: result.accessToken,
      },
    });
  })
);

// POST /api/auth/login - Login user
router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const body = loginSchema.parse(req.body);

    const result = await AuthService.login(body.email, body.password);

    logger.info({
      action: "user.login",
      userId: result.user.id,
      email: result.user.email,
    });

    // Set refresh token in httpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        team: result.team,
        accessToken: result.accessToken,
      },
    });
  })
);

// POST /api/auth/refresh - Refresh access token
router.post(
  "/refresh",
  asyncHandler(async (req: Request, res: Response) => {
    const body = refreshSchema.parse(req.body);

    const result = await AuthService.refreshToken(body.refreshToken);

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
    });
  })
);

// GET /api/auth/me - Get current user profile
router.get(
  "/me",
  authenticateJWT,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.getUserProfile(req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  })
);

// POST /api/auth/logout - Logout user
router.post(
  "/logout",
  authenticateJWT,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    logger.info({
      action: "user.logout",
      userId: req.user!.id,
    });

    // Clear refresh token cookie
    res.clearCookie("refreshToken");

    res.json({
      success: true,
      data: { message: "Logged out successfully" },
    });
  })
);

export default router;
