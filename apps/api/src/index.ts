import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { config } from "dotenv";
import { logger } from "./lib/logger";
import { authenticateJWT } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";

// Load environment variables
config();

const app: Express = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later.",
});

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
import authRoutes from "./routes/auth";
import teamsRoutes from "./routes/teams";
import mediaRoutes from "./routes/media";
import mcpRoutes from "./routes/mcp";
import aiRoutes from "./routes/ai";
import schedulerRoutes from "./routes/scheduler";
import repurposingRoutes from "./routes/repurposing";
import publishingRoutes from "./routes/publishing";
import analyticsRoutes from "./routes/analytics";
import oauthRoutes from "./routes/oauth";
import adminRoutes from "./routes/admin";

app.use("/api/auth", authRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/mcp", mcpRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/scheduler", schedulerRoutes);
app.use("/api/repurposing", repurposingRoutes);
app.use("/api/publishing", publishingRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/admin", adminRoutes);
// app.use("/api/posts", postsRoutes);
// app.use("/api/ai", aiRoutes);
// app.use("/api/media", mediaRoutes);
// app.use("/api/social-accounts", socialAccountsRoutes);
// app.use("/api/analytics", analyticsRoutes);
// app.use("/api/subscriptions", subscriptionsRoutes);
// app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT} [${NODE_ENV}]`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server");
  process.exit(0);
});
