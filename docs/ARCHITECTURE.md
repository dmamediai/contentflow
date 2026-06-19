# ContentFlow Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer (Web)                        │
│                    Next.js 15 + React 18 + TS                   │
│                  (Browser, Device, Responsive)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/WSS
┌────────────────────────────┼────────────────────────────────────┐
│                   API Gateway Layer (CDN/Edge)                   │
│              Vercel Edge Functions / CloudFront                  │
│           (Caching, Rate Limiting, Security Headers)            │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────┼────────────────────────────────────┐
│                  Application Server Layer (API)                  │
│                    Express.js on Node.js 18+                     │
│              (Business Logic, Authentication, n8n Hooks)         │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   PostgreSQL     │ │    Supabase      │ │    Redis Cache   │
│    (Primary)     │ │   (Secondary)    │ │   (Session/Rate  │
│  - Data Store    │ │  - Auth Store    │ │     Limiting)    │
│  - Transactions  │ │  - RLS Policies  │ │                  │
│                  │ │  - Webhooks      │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│                    External Services                          │
├──────────────────────────────────────────────────────────────┤
│  OpenAI / Anthropic / Google Gemini (AI)                     │
│  Stripe (Payments)                                           │
│  SendGrid (Email)                                            │
│  Social APIs (Twitter, LinkedIn, Facebook, Instagram, etc.)  │
│  n8n (Automation/Webhooks)                                   │
│  Sentry (Error Tracking)                                     │
│  Supabase Storage (Media)                                    │
└──────────────────────────────────────────────────────────────┘
```

## Multi-Tenant Architecture

ContentFlow uses **database-level isolation** with **Row Level Security (RLS)**:

```
Database
├── Teams (Tenant boundaries)
│   ├── Team A
│   │   ├── Users (Team A only)
│   │   ├── Posts (Team A only)
│   │   ├── Social Accounts (Team A only)
│   │   └── Analytics (Team A only)
│   └── Team B
│       ├── Users (Team B only)
│       ├── Posts (Team B only)
│       ├── Social Accounts (Team B only)
│       └── Analytics (Team B only)
```

**RLS Policies Example:**
```sql
-- Users can only see their team's posts
CREATE POLICY "team_isolation"
ON posts FOR SELECT
USING (team_id IN (
  SELECT team_id FROM team_members 
  WHERE user_id = auth.uid()
));
```

## Authentication Flow

```
┌─────────┐
│ Browser │
└────┬────┘
     │ 1. Login form
     ▼
┌─────────────────────────────────────────────────┐
│           NextAuth.js (Protected by CSRF)       │
├─────────────────────────────────────────────────┤
│ Providers:                                       │
│  - Email/Password                               │
│  - Google OAuth                                 │
│  - Apple (Future)                               │
└────┬────────────────────────────────────────────┘
     │ 2. Create session
     ▼
┌─────────────────────────────────────────────────┐
│     Supabase Auth (Handles User Records)        │
└────┬────────────────────────────────────────────┘
     │ 3. Issue JWT
     ▼
┌─────────────────────────────────────────────────┐
│    Store in HttpOnly Cookie (Secure + SameSite) │
└────┬────────────────────────────────────────────┘
     │ 4. Redirect
     ▼
┌─────────────────────────────────────────────────┐
│         Dashboard (Protected Route)             │
└─────────────────────────────────────────────────┘
```

## Data Flow Architecture

### Creating a Post

```
1. Frontend (React)
   └─> POST /api/posts
       ├─> Middleware: Authenticate JWT
       ├─> Middleware: Extract team context
       ├─> Route Handler: Validate input
       │   └─> POST schema validation
       ├─> Service: Save post to DB
       │   ├─> Insert into posts table
       │   └─> Link to social accounts
       ├─> Service: Log AI usage (if AI-generated)
       ├─> Trigger n8n workflow (if scheduled)
       └─> Response: Return post object

2. Database Transaction
   ├─> INSERT post (with team_id)
   ├─> INSERT post_social_account associations
   ├─> UPDATE subscription usage
   └─> INSERT audit_log

3. Event Emission
   ├─> Emit 'post.created' event
   └─> n8n Webhook (if scheduled)
       ├─> Create job in queue
       └─> Schedule publish at time
```

### Publishing a Post

```
1. Scheduled Post Triggers
   └─> n8n Workflow
       ├─> Check post status
       ├─> Verify team subscription
       └─> For each connected social account:

2. Social Publishing Service
   ├─> Refresh OAuth tokens (if expired)
   ├─> Prepare post content
   │   ├─> Truncate for platform limits
   │   ├─> Add link previews
   │   └─> Upload media
   ├─> Call social API
   │   ├─> POST /tweets (Twitter)
   │   ├─> POST /feed (LinkedIn)
   │   ├─> Graph API (Facebook)
   │   └─> Instagram API
   └─> Store platform post IDs

3. Analytics Collection
   ├─> Store post IDs in posts table
   ├─> Setup webhook listeners
   ├─> Collect engagement metrics
   └─> Aggregate analytics
```

## Module Architecture

### 1. Authentication Module
```
auth/
├── login.tsx         # Login page
├── register.tsx      # Signup page
├── callback/         # OAuth callbacks
├── [...nextauth].ts  # NextAuth config
└── services/
    ├── auth.ts       # Auth logic
    └── oauth.ts      # OAuth providers
```

**Technology:** NextAuth.js + Supabase Auth + JWT

### 2. Dashboard Module
```
dashboard/
├── layout.tsx        # Dashboard layout
├── page.tsx          # Overview
├── posts/            # Posts management
├── analytics/        # Analytics view
├── media/            # Media library
└── settings/         # Team settings
```

**Technology:** React + Recharts (analytics) + Zustand (state)

### 3. AI Content Studio Module
```
ai/
├── generate/         # Generate new content
├── rewrite/          # Rewrite existing
├── expand/           # Expand content
├── summarize/        # Summarize
├── translate/        # Translate
└── services/
    ├── openai.ts     # OpenAI integration
    ├── claude.ts     # Anthropic Claude
    └── gemini.ts     # Google Gemini
```

**Technology:** OpenAI SDK + Anthropic SDK + Google AI SDK

### 4. Content Repurposing Module
```
repurpose/
├── blog-to-posts/    # Blog article processing
├── youtube/          # YouTube URL handler
├── podcast/          # Podcast transcript
├── services/
    └── repurpose.ts  # Repurposing logic
```

**Technology:** YouTube Data API + Transcript extraction

### 5. Carousel Creator Module
```
carousel/
├── editor/           # Visual editor
├── templates/        # Pre-built templates
├── preview/          # Preview mode
├── export/           # PNG/PDF export
└── services/
    ├── editor.ts     # State management
    └── export.ts     # Export logic
```

**Technology:** Canvas API + HTML2PDF + Sharp (image)

### 6. Social Media Scheduler Module
```
scheduler/
├── calendar/         # Calendar view
├── queue/            # Publishing queue
├── recurring/        # Recurring posts
└── services/
    ├── scheduler.ts  # Job scheduling
    └── queue.ts      # Job queue
```

**Technology:** Bull (job queue) + Cron + n8n

### 7. Social Publishing Module
```
social/
├── connect/          # Account connection
├── publishing/       # Publishing logic
├── oauth/            # OAuth flows
└── services/
    ├── twitter.ts    # Twitter API
    ├── linkedin.ts   # LinkedIn API
    ├── facebook.ts   # Facebook API
    ├── instagram.ts  # Instagram API
    └── threads.ts    # Threads API
```

**Technology:** Official social APIs + OAuth 2.0

### 8. Media Library Module
```
media/
├── upload/           # File upload
├── gallery/          # Media gallery
├── ai-generation/    # AI image generation
└── services/
    ├── supabase.ts   # Storage
    └── cdn.ts        # CDN integration
```

**Technology:** Supabase Storage + Multer + Sharp

### 9. Analytics Module
```
analytics/
├── overview/         # High-level metrics
├── posts/            # Post-level analytics
├── growth/           # Growth tracking
└── services/
    ├── collection.ts # Data collection
    ├── aggregation.ts # Metric calculation
    └── export.ts     # Export reports
```

**Technology:** PostgreSQL aggregations + Recharts

### 10. Subscription Module
```
billing/
├── plans/            # Plan selection
├── upgrade/          # Plan upgrade
├── manage/           # Subscription management
└── services/
    ├── stripe.ts     # Stripe integration
    ├── webhooks.ts   # Webhook handlers
    └── usage.ts      # Usage tracking
```

**Technology:** Stripe + Webhooks

### 11. Admin Panel Module
```
admin/
├── users/            # User management
├── subscriptions/    # Subscription management
├── features/         # Feature flags
├── analytics/        # Admin analytics
└── services/
    ├── admin.ts      # Admin operations
    └── flags.ts      # Feature flags
```

**Technology:** Admin-only routes + Vercel KV (optional)

## State Management

### Frontend State

```typescript
// App-wide state (Zustand)
useAuthStore     // User & session
useTeamStore     // Team context
useSubscriptionStore // Subscription info
useNotificationStore // Toasts & alerts

// Component state
useState         // Local component state
useContext       // Theme, modal state

// Server state (React Query)
useQuery         // Fetch operations
useMutation      // Create/update operations
```

### Backend State

```typescript
// In-memory
Cache (Node-cache)
Sessions (Redis)

// Database
Transactions (PostgreSQL ACID)
Event sourcing (Audit log)
```

## API Rate Limiting

```
General endpoints:     100 req/15 min
Auth endpoints:         5 req/15 min
AI endpoints:          50 req/15 min
Publishing:            20 req/15 min
Analytics export:      10 req/15 min
```

**Implementation:** Express rate-limit middleware + Redis

## Error Handling Strategy

```typescript
// Custom error class
class ApiError extends Error {
  constructor(code, message, statusCode, details) {}
}

// Middleware catches errors
app.use(errorHandler);

// Client shows appropriate message
try {
  await api.createPost(data);
} catch (error) {
  if (error.code === 'INSUFFICIENT_CREDITS') {
    // Show upgrade prompt
  }
}
```

## Deployment Topology

### Development
```
localhost:3000 (Next.js)
localhost:3001 (Express)
localhost:5432 (PostgreSQL)
```

### Staging
```
Next.js on Vercel Preview
Express on Render (preview branch)
PostgreSQL on Supabase (staging project)
```

### Production
```
Next.js on Vercel
Express on Render/AWS/VPS
PostgreSQL on Supabase/RDS
Redis on Upstash/AWS ElastiCache
```

## Security Architecture

### Network Security
- HTTPS/TLS 1.3
- CORS with origin whitelist
- CSRF protection (tokens)
- Helmet.js security headers

### Authentication
- JWT in secure HttpOnly cookies
- Token expiration: 1 hour
- Refresh tokens: 30 days
- Password hashing: bcryptjs

### Authorization
- RBAC at API level
- RLS at database level
- Scoped API keys

### Data Protection
- Encryption at rest (Supabase)
- Encryption in transit (TLS)
- PII redaction in logs
- Secrets in environment variables

### Compliance
- GDPR data deletion
- CCPA privacy
- SOC 2 ready
- HIPAA ready (with encryption)

## Performance Optimization

### Frontend
- Image optimization (Next.js Image)
- Code splitting (React.lazy)
- Bundle analysis (next/bundle-analyzer)
- Caching strategy (SWR)

### Backend
- Database query optimization (indexes)
- Connection pooling (PgBouncer)
- Response caching (Redis)
- Compression (gzip)

### Database
- Indexes on foreign keys
- Partitioning for large tables
- Query plan analysis
- Vacuum and analyze

---

For implementation details, see [docs/API.md](API.md) and [docs/DEPLOYMENT.md](DEPLOYMENT.md).
