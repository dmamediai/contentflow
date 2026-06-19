// User & Authentication
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio: string | null;
  website: string | null;
  location: string | null;
  company: string | null;
  role: string | null;
  avatar: string | null;
  preferences: Record<string, unknown>;
}

// Team & Organization
export interface Team {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  permissions: string[];
  joinedAt: Date;
}

// Subscription & Billing
export type PlanType = "FREE" | "PRO" | "AGENCY";

export interface Subscription {
  id: string;
  teamId: string;
  plan: PlanType;
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "INACTIVE";
  postsUsed: number;
  postsLimit: number;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  teamMembersUsed: number;
  teamMembersLimit: number;
  storageUsed: number;
  storageLimit: number;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
}

// Social Media Accounts
export type SocialPlatform =
  | "FACEBOOK"
  | "INSTAGRAM"
  | "LINKEDIN"
  | "TWITTER"
  | "THREADS"
  | "TIKTOK"
  | "YOUTUBE"
  | "BLUESKY";

export interface SocialAccount {
  id: string;
  teamId: string;
  platform: SocialPlatform;
  platformAccountId: string;
  displayName: string;
  username: string;
  profileUrl: string | null;
  profileImage: string | null;
  connectedAt: Date;
  updatedAt: Date;
}

// Posts & Content
export type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED" | "ARCHIVED";
export type ContentType = "TEXT" | "IMAGE" | "VIDEO" | "CAROUSEL" | "REPOST";
export type SourceType = "BLOG" | "YOUTUBE" | "PODCAST" | "ARTICLE" | "MANUAL";

export interface Post {
  id: string;
  teamId: string;
  title: string | null;
  content: string;
  contentType: ContentType;
  status: PostStatus;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  sourceType: SourceType | null;
  sourceUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostRequest {
  title?: string;
  content: string;
  contentType?: ContentType;
  scheduledAt?: Date;
  socialAccountIds: string[];
  mediaIds?: string[];
  sourceType?: SourceType;
  sourceUrl?: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  scheduledAt?: Date;
  status?: PostStatus;
}

// Carousel
export interface CarouselSlide {
  id: string;
  postId: string;
  order: number;
  content: string;
  mediaUrl: string | null;
  template: string | null;
  customData: Record<string, unknown> | null;
}

export interface CreateCarouselRequest {
  title?: string;
  slides: {
    content: string;
    mediaUrl?: string;
    template?: string;
  }[];
  socialAccountIds: string[];
  scheduledAt?: Date;
}

// Media Library
export type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "OTHER";

export interface Media {
  id: string;
  teamId: string;
  name: string;
  type: MediaType;
  url: string;
  publicUrl: string | null;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  mimeType: string;
  isAiGenerated: boolean;
  aiModel: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics
export type EventType =
  | "LIKE"
  | "COMMENT"
  | "SHARE"
  | "IMPRESSION"
  | "CLICK"
  | "SAVE"
  | "REPOST"
  | "MENTION"
  | "FOLLOWER_GAINED"
  | "FOLLOWER_LOST";

export interface AnalyticsEvent {
  id: string;
  teamId: string;
  postId: string | null;
  socialAccountId: string | null;
  eventType: EventType;
  metric: string;
  value: number;
  eventDate: Date;
  createdAt: Date;
}

export interface AnalyticsSummary {
  id: string;
  teamId: string;
  totalFollowers: number;
  followerGrowth: number;
  avgEngagementRate: number;
  totalImpressions: number;
  totalEngagements: number;
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  topPost: string | null;
  topPostEngagements: number;
  period: string;
  generatedAt: Date;
}

// AI Operations
export type AiOperation =
  | "GENERATE_POST"
  | "REWRITE"
  | "EXPAND"
  | "SUMMARIZE"
  | "TRANSLATE"
  | "GENERATE_HOOK"
  | "GENERATE_CTA"
  | "GENERATE_HASHTAGS"
  | "REPURPOSE_CONTENT"
  | "GENERATE_CAROUSEL";

export interface AiRequest {
  operation: AiOperation;
  content?: string;
  contentType?: ContentType;
  platform?: SocialPlatform;
  sourceUrl?: string;
  sourceType?: SourceType;
  language?: string;
  tone?: string;
}

export interface AiResponse {
  id: string;
  content: string;
  operation: AiOperation;
  tokensUsed: number;
  costUsd: number;
}

// API Keys
export interface ApiKey {
  id: string;
  teamId: string;
  name: string;
  key: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Feature Flags
export interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rolloutPercentage: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Authentication
export interface AuthSession {
  user: User;
  team?: Team;
  permissions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  teamName: string;
}

export interface OAuthCallback {
  provider: string;
  code: string;
  state?: string;
}

// Errors
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  BAD_REQUEST: "BAD_REQUEST",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  INVALID_TOKEN: "INVALID_TOKEN",
  EXPIRED_TOKEN: "EXPIRED_TOKEN",
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
} as const;

// MCP (Model Context Protocol) - AI Client Integration
export interface MCPApiKey {
  id: string;
  key: string;
  userId: string;
  revoked: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MCPRequestLog {
  id: string;
  apiKeyId: string;
  userId: string;
  toolName: string;
  input: Record<string, unknown>;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
}

export interface MCPTool {
  name: string;
  description: string;
}

export interface MCPToolCall {
  tool: string;
  input: Record<string, unknown>;
}

export interface MCPToolResult {
  success: boolean;
  tool: string;
  result?: any;
  error?: string;
}
