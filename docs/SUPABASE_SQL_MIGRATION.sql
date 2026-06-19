-- ContentFlow Database Schema Migration
-- Run this SQL in Supabase SQL Editor
-- This creates all tables needed for ContentFlow

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PRO', 'AGENCY');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'INACTIVE');
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TWITTER', 'THREADS', 'TIKTOK', 'YOUTUBE', 'BLUESKY');
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'ARCHIVED');
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL', 'REPOST');
CREATE TYPE "SourceType" AS ENUM ('BLOG', 'YOUTUBE', 'PODCAST', 'ARTICLE', 'MANUAL');
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER');
CREATE TYPE "EventType" AS ENUM ('LIKE', 'COMMENT', 'SHARE', 'IMPRESSION', 'CLICK', 'SAVE', 'REPOST', 'MENTION', 'FOLLOWER_GAINED', 'FOLLOWER_LOST');
CREATE TYPE "AiOperation" AS ENUM ('GENERATE_POST', 'REWRITE', 'EXPAND', 'SUMMARIZE', 'TRANSLATE', 'GENERATE_HOOK', 'GENERATE_CTA', 'GENERATE_HASHTAGS', 'REPURPOSE_CONTENT', 'GENERATE_CAROUSEL');

-- ============================================================================
-- AUTHENTICATION & TEAM MANAGEMENT
-- ============================================================================

CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "emailVerified" TIMESTAMP WITH TIME ZONE,
  name TEXT,
  image TEXT,
  password TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "User_email_idx" ON "User"(email);

CREATE TABLE "UserProfile" (
  id TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  bio TEXT,
  website TEXT,
  location TEXT,
  company TEXT,
  role TEXT,
  avatar TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "UserProfile_userId_idx" ON "UserProfile"("userId");

CREATE TABLE "Account" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, "providerAccountId")
);

CREATE INDEX "Account_userId_idx" ON "Account"("userId");

CREATE TABLE "Session" (
  id TEXT PRIMARY KEY,
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- ============================================================================
-- TEAM & ORGANIZATION
-- ============================================================================

CREATE TABLE "Team" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT,
  description TEXT,
  "createdBy" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Team_createdBy_idx" ON "Team"("createdBy");
CREATE INDEX "Team_slug_idx" ON "Team"(slug);

CREATE TABLE "TeamMember" (
  id TEXT PRIMARY KEY,
  "teamId" TEXT NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  role "TeamRole" NOT NULL DEFAULT 'MEMBER',
  permissions TEXT[] DEFAULT '{}'::text[],
  "joinedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("teamId", "userId")
);

CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- ============================================================================
-- SUBSCRIPTION & BILLING
-- ============================================================================

CREATE TABLE "Subscription" (
  id TEXT PRIMARY KEY,
  "teamId" TEXT UNIQUE NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  "stripeCustomerId" TEXT UNIQUE,
  "stripeSubscriptionId" TEXT UNIQUE,
  plan "PlanType" NOT NULL DEFAULT 'FREE',
  status "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "currentPeriodStart" TIMESTAMP WITH TIME ZONE,
  "currentPeriodEnd" TIMESTAMP WITH TIME ZONE,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT FALSE,
  "postsUsed" INTEGER NOT NULL DEFAULT 0,
  "postsLimit" INTEGER NOT NULL DEFAULT 0,
  "aiCreditsUsed" INTEGER NOT NULL DEFAULT 0,
  "aiCreditsLimit" INTEGER NOT NULL DEFAULT 0,
  "teamMembersUsed" INTEGER NOT NULL DEFAULT 1,
  "teamMembersLimit" INTEGER NOT NULL DEFAULT 1,
  "storageUsed" INTEGER NOT NULL DEFAULT 0,
  "storageLimit" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Subscription_teamId_idx" ON "Subscription"("teamId");
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");

CREATE TABLE "Invoice" (
  id TEXT PRIMARY KEY,
  "stripeInvoiceId" TEXT UNIQUE NOT NULL,
  "customerId" TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  "paidAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- ============================================================================
-- SOCIAL MEDIA ACCOUNTS & CONNECTIONS
-- ============================================================================

CREATE TABLE "SocialAccount" (
  id TEXT PRIMARY KEY,
  "teamId" TEXT NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  platform "SocialPlatform" NOT NULL,
  "platformAccountId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  username TEXT NOT NULL,
  "profileUrl" TEXT,
  "profileImage" TEXT,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  "connectedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("teamId", platform, "platformAccountId")
);

CREATE INDEX "SocialAccount_teamId_idx" ON "SocialAccount"("teamId");
CREATE INDEX "SocialAccount_platform_idx" ON "SocialAccount"(platform);

-- ============================================================================
-- CONTENT & POSTS
-- ============================================================================

CREATE TABLE "Post" (
  id TEXT PRIMARY KEY,
  "teamId" TEXT NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  "contentType" "ContentType" NOT NULL DEFAULT 'TEXT',
  status "PostStatus" NOT NULL DEFAULT 'DRAFT',
  "scheduledAt" TIMESTAMP WITH TIME ZONE,
  "publishedAt" TIMESTAMP WITH TIME ZONE,
  "aiGeneratedData" JSONB,
  "sourceType" "SourceType",
  "sourceUrl" TEXT,
  "repurposedFrom" TEXT,
  "repurposedPlatforms" TEXT[] DEFAULT '{}'::text[],
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT
);

CREATE INDEX "Post_teamId_idx" ON "Post"("teamId");
CREATE INDEX "Post_status_idx" ON "Post"(status);
CREATE INDEX "Post_scheduledAt_idx" ON "Post"("scheduledAt");
CREATE INDEX "Post_publishedAt_idx" ON "Post"("publishedAt");

-- ============================================================================
-- CAROUSEL & SLIDES
-- ============================================================================

CREATE TABLE "CarouselSlide" (
  id TEXT PRIMARY KEY,
  "postId" TEXT NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  content TEXT NOT NULL,
  "mediaUrl" TEXT,
  template TEXT,
  "customData" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("postId", "order")
);

CREATE INDEX "CarouselSlide_postId_idx" ON "CarouselSlide"("postId");

-- ============================================================================
-- MEDIA LIBRARY
-- ============================================================================

CREATE TABLE "Media" (
  id TEXT PRIMARY KEY,
  "teamId" TEXT NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type "MediaType" NOT NULL,
  url TEXT NOT NULL,
  "publicUrl" TEXT,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  "mimeType" TEXT NOT NULL,
  "isAiGenerated" BOOLEAN NOT NULL DEFAULT FALSE,
  "aiModel" TEXT,
  "aiPrompt" TEXT,
  "storageKey" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Media_teamId_idx" ON "Media"("teamId");
CREATE INDEX "Media_type_idx" ON "Media"(type);
CREATE INDEX "Media_isAiGenerated_idx" ON "Media"("isAiGenerated");

-- ============================================================================
-- ANALYTICS
-- ============================================================================

CREATE TABLE "AnalyticsEvent" (
  id TEXT PRIMARY KEY,
  "teamId" TEXT NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  "postId" TEXT REFERENCES "Post"(id) ON DELETE SET NULL,
  "socialAccountId" TEXT REFERENCES "SocialAccount"(id) ON DELETE SET NULL,
  "eventType" "EventType" NOT NULL,
  "platformEventId" TEXT,
  metric TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  "eventDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AnalyticsEvent_teamId_idx" ON "AnalyticsEvent"("teamId");
CREATE INDEX "AnalyticsEvent_postId_idx" ON "AnalyticsEvent"("postId");
CREATE INDEX "AnalyticsEvent_socialAccountId_idx" ON "AnalyticsEvent"("socialAccountId");
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");
CREATE INDEX "AnalyticsEvent_eventDate_idx" ON "AnalyticsEvent"("eventDate");

CREATE TABLE "AnalyticsSummary" (
  id TEXT PRIMARY KEY,
  "teamId" TEXT UNIQUE NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  "totalFollowers" INTEGER NOT NULL DEFAULT 0,
  "followerGrowth" FLOAT NOT NULL DEFAULT 0,
  "avgEngagementRate" FLOAT NOT NULL DEFAULT 0,
  "totalImpressions" INTEGER NOT NULL DEFAULT 0,
  "totalEngagements" INTEGER NOT NULL DEFAULT 0,
  "totalPosts" INTEGER NOT NULL DEFAULT 0,
  "publishedPosts" INTEGER NOT NULL DEFAULT 0,
  "scheduledPosts" INTEGER NOT NULL DEFAULT 0,
  "topPost" TEXT,
  "topPostEngagements" INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL,
  "generatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AnalyticsSummary_teamId_idx" ON "AnalyticsSummary"("teamId");

-- ============================================================================
-- AI USAGE & COSTS
-- ============================================================================

CREATE TABLE "AiUsageLog" (
  id TEXT PRIMARY KEY,
  "teamId" TEXT NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  "postId" TEXT REFERENCES "Post"(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  operation "AiOperation" NOT NULL,
  "promptTokens" INTEGER NOT NULL DEFAULT 0,
  "completionTokens" INTEGER NOT NULL DEFAULT 0,
  "totalTokens" INTEGER NOT NULL DEFAULT 0,
  "costUsd" FLOAT NOT NULL DEFAULT 0,
  metadata JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AiUsageLog_teamId_idx" ON "AiUsageLog"("teamId");
CREATE INDEX "AiUsageLog_model_idx" ON "AiUsageLog"(model);
CREATE INDEX "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");

-- ============================================================================
-- API KEYS & INTEGRATIONS
-- ============================================================================

CREATE TABLE "ApiKey" (
  id TEXT PRIMARY KEY,
  "teamId" TEXT NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  "lastUsedAt" TIMESTAMP WITH TIME ZONE,
  "expiresAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ApiKey_teamId_idx" ON "ApiKey"("teamId");
CREATE INDEX "ApiKey_key_idx" ON "ApiKey"(key);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE "AuditLog" (
  id TEXT PRIMARY KEY,
  "teamId" TEXT,
  "userId" TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  "resourceId" TEXT,
  changes JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AuditLog_teamId_idx" ON "AuditLog"("teamId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"(action);
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- ============================================================================
-- FEATURE FLAGS
-- ============================================================================

CREATE TABLE "FeatureFlag" (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  "rolloutPercentage" INTEGER NOT NULL DEFAULT 0,
  rules JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "FeatureFlag_name_idx" ON "FeatureFlag"(name);

CREATE TABLE "FeatureFlagVariant" (
  id TEXT PRIMARY KEY,
  "teamId" TEXT NOT NULL,
  "flagName" TEXT NOT NULL,
  enabled BOOLEAN NOT NULL,
  variant TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("teamId", "flagName")
);

CREATE INDEX "FeatureFlagVariant_teamId_idx" ON "FeatureFlagVariant"("teamId");

-- ============================================================================
-- MCP (MODEL CONTEXT PROTOCOL) - AI CLIENT INTEGRATION
-- ============================================================================

CREATE TABLE "MCPApiKey" (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  "lastUsedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "MCPApiKey_userId_idx" ON "MCPApiKey"("userId");
CREATE INDEX "MCPApiKey_key_idx" ON "MCPApiKey"(key);

CREATE TABLE "MCPRequestLog" (
  id TEXT PRIMARY KEY,
  "apiKeyId" TEXT NOT NULL REFERENCES "MCPApiKey"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "toolName" TEXT NOT NULL,
  input JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "MCPRequestLog_apiKeyId_idx" ON "MCPRequestLog"("apiKeyId");
CREATE INDEX "MCPRequestLog_userId_idx" ON "MCPRequestLog"("userId");
CREATE INDEX "MCPRequestLog_toolName_idx" ON "MCPRequestLog"("toolName");
CREATE INDEX "MCPRequestLog_createdAt_idx" ON "MCPRequestLog"("createdAt");

-- ============================================================================
-- JUNCTION TABLES FOR MANY-TO-MANY RELATIONSHIPS
-- ============================================================================

CREATE TABLE "_PostToSocialAccount" (
  "A" TEXT NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "SocialAccount"(id) ON DELETE CASCADE,
  UNIQUE("A", "B")
);

CREATE INDEX "_PostToSocialAccount_A_idx" ON "_PostToSocialAccount"("A");
CREATE INDEX "_PostToSocialAccount_B_idx" ON "_PostToSocialAccount"("B");

CREATE TABLE "_MediaToPost" (
  "A" TEXT NOT NULL REFERENCES "Media"(id) ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  UNIQUE("A", "B")
);

CREATE INDEX "_MediaToPost_A_idx" ON "_MediaToPost"("A");
CREATE INDEX "_MediaToPost_B_idx" ON "_MediaToPost"("B");

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

-- All tables created successfully!
-- Run this SQL to see all created tables:
-- SELECT tablename FROM pg_tables WHERE schemaname='public';
