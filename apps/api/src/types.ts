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

// Posts & Content
export type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED" | "ARCHIVED";
export type ContentType = "TEXT" | "IMAGE" | "VIDEO" | "CAROUSEL" | "REPOST";

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

// Error Handling
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    statusCodeOrMessage: number | string,
    codeOrMessage?: string,
    message?: string
  ) {
    // Handle both old and new signatures
    if (typeof statusCodeOrMessage === 'number') {
      super(message || codeOrMessage || '');
      this.statusCode = statusCodeOrMessage;
      this.code = codeOrMessage || 'INTERNAL_SERVER_ERROR';
    } else {
      super(statusCodeOrMessage);
      this.statusCode = 500;
      this.code = codeOrMessage || 'INTERNAL_SERVER_ERROR';
    }
    this.name = "ApiError";
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  BAD_REQUEST: "BAD_REQUEST",
  CONFLICT: "CONFLICT",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  EXPIRED_TOKEN: "EXPIRED_TOKEN",
  INVALID_TOKEN: "INVALID_TOKEN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type Permission =
  | "ai:write"
  | "ai:read"
  | "social:write"
  | "social:read"
  | "analytics:write"
  | "analytics:read"
  | "admin:write"
  | "admin:read";
