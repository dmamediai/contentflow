-- Public v1 API layer: Profile, PostTarget, Webhook/WebhookDelivery, ApiKey rework,
-- Post additions (metadata/timezone/idempotencyKey), PostStatus PUBLISHING/PARTIAL.
--
-- Written by hand from `prisma migrate diff` output so it backfills existing rows
-- safely instead of adding NOT NULL columns directly onto populated tables.
-- Apply with: npx prisma migrate deploy   (from packages/db, once DATABASE_URL is reachable)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Enums
-- ============================================================================

CREATE TYPE "PostTargetStatus" AS ENUM ('PENDING', 'PUBLISHING', 'PUBLISHED', 'FAILED');
CREATE TYPE "ApiKeyScope" AS ENUM ('FULL', 'READ_ONLY');

-- Safe on Postgres 12+: new enum values are usable outside the creating transaction.
ALTER TYPE "PostStatus" ADD VALUE IF NOT EXISTS 'PUBLISHING';
ALTER TYPE "PostStatus" ADD VALUE IF NOT EXISTS 'PARTIAL';

-- ============================================================================
-- Profile (new tenant-boundary container between Team and SocialAccount)
-- ============================================================================

CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Profile_teamId_name_key" ON "Profile"("teamId", "name");
CREATE INDEX "Profile_teamId_idx" ON "Profile"("teamId");

ALTER TABLE "Profile" ADD CONSTRAINT "Profile_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing team gets a "Default" profile.
INSERT INTO "Profile" ("id", "teamId", "name", "isDefault", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", 'Default', true, now(), now()
FROM "Team";

-- ============================================================================
-- SocialAccount.profileId (added nullable, backfilled, then locked to NOT NULL)
-- ============================================================================

ALTER TABLE "SocialAccount" ADD COLUMN "profileId" TEXT;

UPDATE "SocialAccount" sa
SET "profileId" = p."id"
FROM "Profile" p
WHERE p."teamId" = sa."teamId" AND p."isDefault" = true;

ALTER TABLE "SocialAccount" ALTER COLUMN "profileId" SET NOT NULL;

DROP INDEX IF EXISTS "SocialAccount_teamId_platform_platformAccountId_key";

CREATE UNIQUE INDEX "SocialAccount_profileId_platform_platformAccountId_key"
    ON "SocialAccount"("profileId", "platform", "platformAccountId");
CREATE INDEX "SocialAccount_profileId_idx" ON "SocialAccount"("profileId");

ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Post: metadata / timezone / idempotencyKey (all nullable, no backfill needed)
-- ============================================================================

ALTER TABLE "Post"
    ADD COLUMN "idempotencyKey" TEXT,
    ADD COLUMN "metadata" JSONB,
    ADD COLUMN "timezone" TEXT;

CREATE INDEX "Post_teamId_idempotencyKey_idx" ON "Post"("teamId", "idempotencyKey");

-- ============================================================================
-- PostTarget (per-platform publish result for the public v1 posts API)
-- ============================================================================

CREATE TABLE "PostTarget" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "status" "PostTargetStatus" NOT NULL DEFAULT 'PENDING',
    "customContent" TEXT,
    "platformPostId" TEXT,
    "platformPostUrl" TEXT,
    "error" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostTarget_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PostTarget_postId_idx" ON "PostTarget"("postId");
CREATE INDEX "PostTarget_socialAccountId_idx" ON "PostTarget"("socialAccountId");
CREATE INDEX "PostTarget_status_idx" ON "PostTarget"("status");

ALTER TABLE "PostTarget" ADD CONSTRAINT "PostTarget_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostTarget" ADD CONSTRAINT "PostTarget_socialAccountId_fkey"
    FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Webhook / WebhookDelivery
-- ============================================================================

CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Webhook_teamId_idx" ON "Webhook"("teamId");

ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebhookDelivery_webhookId_idx" ON "WebhookDelivery"("webhookId");
CREATE INDEX "WebhookDelivery_event_idx" ON "WebhookDelivery"("event");

ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_webhookId_fkey"
    FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- ApiKey rework: plaintext `key` -> hashed `hashedKey` + `keyPrefix` + scope
-- ============================================================================

ALTER TABLE "ApiKey" ADD COLUMN "hashedKey" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN "keyPrefix" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN "revokedAt" TIMESTAMP(3);
ALTER TABLE "ApiKey" ADD COLUMN "scope" "ApiKeyScope" NOT NULL DEFAULT 'FULL';

-- Backfill safety net for any pre-existing rows (none expected: no code issued
-- ApiKey rows before this migration). Placeholder values force re-issuance
-- rather than leaving an unusable row with NULL hashedKey/keyPrefix.
UPDATE "ApiKey" SET "hashedKey" = 'legacy_' || "id", "keyPrefix" = 'legacy_'
WHERE "hashedKey" IS NULL;

ALTER TABLE "ApiKey" ALTER COLUMN "hashedKey" SET NOT NULL;
ALTER TABLE "ApiKey" ALTER COLUMN "keyPrefix" SET NOT NULL;

DROP INDEX IF EXISTS "ApiKey_key_key";
DROP INDEX IF EXISTS "ApiKey_key_idx";
ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "key";

CREATE UNIQUE INDEX "ApiKey_hashedKey_key" ON "ApiKey"("hashedKey");
CREATE INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");

-- ============================================================================
-- Team relations (Profile[], Webhook[]) require no DDL - FKs above cover them.
-- ============================================================================
