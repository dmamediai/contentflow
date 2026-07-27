-- Extend AuditLog with status/platform/duration/message for the Logs dashboard page.
-- Existing rows (if any) default to SUCCESS; all new columns are backward-compatible.

CREATE TYPE "AuditLogStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING', 'SKIPPED');

ALTER TABLE "AuditLog"
    ADD COLUMN "status" "AuditLogStatus" NOT NULL DEFAULT 'SUCCESS',
    ADD COLUMN "platform" "SocialPlatform",
    ADD COLUMN "durationMs" INTEGER,
    ADD COLUMN "message" TEXT;

CREATE INDEX "AuditLog_status_idx" ON "AuditLog"("status");
