import crypto from "crypto";

const API_KEY_PREFIX = "sk_";
const WEBHOOK_SECRET_PREFIX = "whsec_";

/**
 * Generate a new public API key. Only the prefix (first 11 chars) is kept
 * for display purposes - the full value is shown to the caller exactly once.
 */
export function generateApiKey(): { key: string; keyPrefix: string } {
  const key = API_KEY_PREFIX + crypto.randomBytes(32).toString("hex");
  return { key, keyPrefix: key.slice(0, 11) };
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateWebhookSecret(): string {
  return WEBHOOK_SECRET_PREFIX + crypto.randomBytes(24).toString("hex");
}

/**
 * HMAC-SHA256 signature for outgoing webhook payloads, verifiable by the
 * receiver against their stored webhook secret (same pattern as Stripe).
 */
export function signPayload(secret: string, payload: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}
