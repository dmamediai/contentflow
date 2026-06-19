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
  createdAt: Date;
  updatedAt: Date;
}

// Media
export type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";

export interface Media {
  id: string;
  teamId: string;
  name: string;
  type: MediaType;
  url: string;
  size: number;
  mimeType: string;
  duration?: number;
  width?: number;
  height?: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
