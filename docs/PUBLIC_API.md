# ContentFlow Public API (v1)

A developer-facing REST API for scheduling and publishing social posts, modeled on the profile → account → post flow popularized by Zernio. This sits alongside the existing dashboard (JWT/session auth) as a separate, API-key-authenticated surface — nothing here changes how the dashboard works.

**Base URL:** `https://<your-api-host>/api/v1`

## Authentication

Every request needs an API key, created from the dashboard-facing management endpoints (JWT-authenticated, same as the rest of the dashboard API):

```bash
curl -X POST https://<api-host>/api/api-keys \
  -H "Authorization: Bearer <dashboard-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Production key"}'
# => { "success": true, "data": { "id": "...", "key": "sk_...", "keyPrefix": "sk_1a2b3c4d5e", ... } }
```

The `key` value is shown **once** — only its SHA-256 hash and a display prefix are stored. Use it as a bearer token against `/api/v1/*`:

```bash
curl https://<api-host>/api/v1/profiles \
  -H "Authorization: Bearer sk_..."
```

Keys can be `FULL` (default) or `READ_ONLY` (blocked from POST/PATCH/DELETE on `/v1/*`). Revoke via `DELETE /api/api-keys/:id`.

## Key concepts

- **Profile** — a container that groups connected accounts within your team (the tenant boundary). Every team gets a `Default` profile automatically.
- **Account** — a connected social account, living in exactly one profile. `platformAccountId` is the ID the platform assigned to it.
- **Post** — content targeting one or more `{platform, accountId}` pairs. Each target is tracked independently (`PostTarget`), so a single post can end up `PARTIAL` if it publishes to two platforms but fails on a third.

## Quickstart

### 1. Create a profile

```bash
curl -X POST https://<api-host>/api/v1/profiles \
  -H "Authorization: Bearer sk_..." -H "Content-Type: application/json" \
  -d '{"name": "My First Profile"}'
# => { "profile": { "id": "...", "name": "My First Profile", ... } }
```

### 2. Connect an account

**OAuth platforms** (Twitter, LinkedIn, Facebook, Instagram, Threads):

```bash
curl "https://<api-host>/api/v1/connect/twitter?profileId=<profile_id>" \
  -H "Authorization: Bearer sk_..."
# => { "authUrl": "https://twitter.com/i/oauth2/authorize?..." }
```

Open `authUrl` in a browser; the existing OAuth callback saves the connected account into the given profile.

**Bluesky** (App Password, no OAuth app needed):

```bash
curl -X POST https://<api-host>/api/v1/connect/bluesky/credentials \
  -H "Authorization: Bearer sk_..." -H "Content-Type: application/json" \
  -d '{"identifier": "yourhandle.bsky.social", "appPassword": "xxxx-xxxx-xxxx-xxxx", "profileId": "<profile_id>"}'
```

### 3. List accounts

```bash
curl "https://<api-host>/api/v1/accounts?profileId=<profile_id>" -H "Authorization: Bearer sk_..."
```

### 4. Create a post

```bash
curl -X POST https://<api-host>/api/v1/posts \
  -H "Authorization: Bearer sk_..." -H "Content-Type: application/json" \
  -H "x-request-id: <uuid-you-generate>" \
  -d '{
    "content": "Hello world from the ContentFlow API!",
    "platforms": [{"platform": "BLUESKY", "accountId": "<account_id>"}],
    "publishNow": true
  }'
```

One endpoint covers every mode:

| You set | Result |
|---|---|
| `publishNow: true` | Publishes immediately, response reflects the final per-platform result |
| `scheduledFor` (+ optional `timezone`) | Publishes automatically once due (polled every 60s) |
| Neither | Saved as a `DRAFT` |

`x-request-id` is optional but recommended: retrying the same value within 5 minutes returns the original post instead of creating a duplicate.

### 5. Check status

```bash
curl https://<api-host>/api/v1/posts/<post_id> -H "Authorization: Bearer sk_..."
```

`status` is one of `DRAFT → SCHEDULED → PUBLISHING → PUBLISHED / PARTIAL / FAILED`. Each entry in `platforms[]` carries its own `status`, `platformPostId`, and `platformPostUrl` once published.

## Webhooks

```bash
curl -X POST https://<api-host>/api/v1/webhooks \
  -H "Authorization: Bearer sk_..." -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/hooks/contentflow", "events": ["post.published", "post.failed", "post.partial"]}'
```

The response includes `secret` once — store it. Every delivery is a signed POST:

- `X-ContentFlow-Event: post.published`
- `X-ContentFlow-Signature: sha256=<hmac-sha256 of the raw JSON body, keyed by your webhook secret>`

Verify by recomputing the HMAC and comparing. Delivery is at-least-once and best-effort (no retry backoff yet) — dedupe on the envelope's `id` field.

## Endpoint reference

| Method | Path | Notes |
|---|---|---|
| POST | `/v1/profiles` | Create a profile |
| GET | `/v1/profiles` | List profiles |
| GET | `/v1/profiles/:id` | Get a profile |
| PATCH | `/v1/profiles/:id` | Update name/description |
| DELETE | `/v1/profiles/:id` | Delete (not the Default profile) |
| GET | `/v1/connect/:platform?profileId=` | OAuth authUrl (twitter/linkedin/facebook/instagram/threads) |
| POST | `/v1/connect/bluesky/credentials` | Connect via handle + App Password |
| GET | `/v1/accounts?profileId=` | List connected accounts |
| GET | `/v1/accounts/:id` | Get an account |
| DELETE | `/v1/accounts/:id` | Disconnect an account |
| POST | `/v1/posts` | Create (draft / scheduled / publish now) |
| GET | `/v1/posts?profileId=&status=` | List posts |
| GET | `/v1/posts/:id` | Get a post |
| POST | `/v1/webhooks` | Register a webhook |
| GET | `/v1/webhooks` | List webhooks (secret not returned after creation) |
| DELETE | `/v1/webhooks/:id` | Remove a webhook |

## Known limitations (current pass)

- **Only Bluesky actually publishes.** It uses the AT Protocol (handle + App Password), which needs no registered developer app, so it's wired end-to-end for real. Twitter/LinkedIn/Facebook/Instagram/Threads have real OAuth token exchange but the publish call itself is still a stub pending registered app credentials for each platform (pre-existing, unchanged by this work) — `PostTarget.error` will say so.
- **Scheduling is an in-process poller** (60s interval, single instance). Fine for one API instance; a multi-instance deployment should move this to a real job queue (e.g. BullMQ + Redis) so due posts aren't claimed twice.
- **No image auto-compression.** Bluesky's 1MB-per-image limit is enforced with a clear error, not silently worked around.
- **Scoped/multi-tenant API keys, SMS/WhatsApp/voice, ads, unified inbox, and an MCP server** are out of scope for this pass (a separate MCP server already exists for AI-assisted content generation - unrelated to this API).
