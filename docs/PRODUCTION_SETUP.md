# Production Setup & Credentials Guide

Complete guide for getting production credentials and deploying ContentFlow to production.

---

## Phase 1: Third-Party Account Setup

### 1. Supabase (Database & Authentication)

**What you need:** Database hosting, authentication, file storage, real-time capabilities

**Steps:**
1. Go to https://supabase.com
2. Sign up / Log in
3. Click "New Project"
4. Choose:
   - Organization: Your organization
   - Project name: `contentflow-prod`
   - Database password: Generate strong password
   - Region: Choose closest to your users
5. Wait for project creation (5-10 minutes)
6. In Project Settings → API:
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`
   - Copy `JWT Secret` → `SUPABASE_JWT_SECRET`
7. Enable Auth Providers:
   - Go to Authentication → Providers
   - Enable "Google" (you'll add credentials in next step)
8. Create storage buckets:
   - Storage → New bucket
   - Create: `media`, `uploads`, `avatars` (all public)
9. Enable Row Level Security (RLS) on each bucket:
   - Click each bucket → Policies
   - Enable RLS and add policy allowing authenticated users

**Credentials to save:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
```

---

### 2. Stripe (Payments)

**What you need:** Payment processing for subscriptions

**Steps:**
1. Go to https://stripe.com
2. Sign up for production account
3. Verify business details
4. In Dashboard → Developers → API keys:
   - Copy Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copy Secret key → `STRIPE_SECRET_KEY`
5. Set up webhooks:
   - Developers → Webhooks → Add endpoint
   - Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen: `payment_intent.succeeded`, `payment_intent.failed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy Signing secret → `STRIPE_WEBHOOK_SECRET`
6. Create product & price plans (in Stripe Dashboard):
   - Product: "ContentFlow Pro" (monthly subscription)
   - Product: "ContentFlow Agency" (monthly subscription)

**Credentials to save:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### 3. OpenAI (ChatGPT API)

**What you need:** Content generation, rewriting, summarization

**Steps:**
1. Go to https://platform.openai.com
2. Sign up / Log in
3. Billing → Set up paid account
4. API keys → Create new secret key
5. Copy → `OPENAI_API_KEY`

**Credentials to save:**
```
OPENAI_API_KEY=sk-...
```

---

### 4. Anthropic Claude (AI Alternative)

**What you need:** Claude AI for content generation alternatives

**Steps:**
1. Go to https://console.anthropic.com
2. Sign up / Log in
3. Billing → Add payment method
4. API Keys → Create new API key
5. Copy → `ANTHROPIC_API_KEY`

**Credentials to save:**
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

### 5. Google Gemini (Google AI)

**What you need:** Alternative AI model for content generation

**Steps:**
1. Go to https://ai.google.dev
2. Sign up / Log in
3. Get API key → Create API key
4. Select your GCP project
5. Copy → `GOOGLE_GEMINI_API_KEY`

**Credentials to save:**
```
GOOGLE_GEMINI_API_KEY=AIzaSy...
```

---

### 6. Google OAuth (Social Login)

**What you need:** Google login for users

**Steps:**
1. Go to https://console.developers.google.com
2. Create new project: `ContentFlow`
3. Enable APIs:
   - Google+ API
   - People API
4. OAuth consent screen:
   - User type: External
   - Fill app name: ContentFlow
   - Add scopes: email, profile
5. Credentials → Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: 
     - `http://localhost:3000`
     - `https://yourdomain.com`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google`
6. Copy Client ID → `GOOGLE_CLIENT_ID`
7. Copy Client Secret → `GOOGLE_CLIENT_SECRET`

**Credentials to save:**
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

### 7. Twitter / X API (Social Publishing)

**What you need:** Tweet posting, account management

**Steps:**
1. Go to https://developer.twitter.com
2. Apply for developer account
3. Verify email and fill form
4. Create project: `ContentFlow`
5. Create app under project
6. Keys & tokens:
   - Copy API Key → `TWITTER_API_KEY`
   - Copy API Secret Key → `TWITTER_API_SECRET`
   - Copy Bearer Token → `TWITTER_BEARER_TOKEN`
7. In app settings:
   - Permissions: Read & Write
   - Callback URLs: `https://yourdomain.com/api/oauth/twitter/callback`

**Credentials to save:**
```
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_BEARER_TOKEN=...
```

---

### 8. LinkedIn API (Social Publishing)

**What you need:** LinkedIn post publishing, account management

**Steps:**
1. Go to https://www.linkedin.com/developers/apps
2. Create new app:
   - App name: ContentFlow
   - LinkedIn Page: Your company page (create if needed)
3. In Auth → OAuth 2.0 settings:
   - Redirect URLs: `https://yourdomain.com/api/oauth/linkedin/callback`
   - Copy Client ID → `LINKEDIN_CLIENT_ID`
   - Copy Client Secret → `LINKEDIN_CLIENT_SECRET`

**Credentials to save:**
```
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
```

---

### 9. Facebook / Meta API (Social Publishing)

**What you need:** Facebook/Instagram posting, page management

**Steps:**
1. Go to https://developers.facebook.com
2. Create app:
   - App type: Business
   - App name: ContentFlow
3. In Settings → Basic:
   - Copy App ID → `FACEBOOK_APP_ID`
   - Copy App Secret → `FACEBOOK_APP_SECRET`
4. Add products:
   - Facebook Login
   - Pages API
5. In Facebook Login → Settings:
   - Valid OAuth Redirect URIs: `https://yourdomain.com/api/oauth/facebook/callback`

**Credentials to save:**
```
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
```

---

### 10. Resend (Transactional Email)

**What you need:** Sending signup/password reset emails

**Steps:**
1. Go to https://resend.com
2. Sign up
3. Add domain for sending (verify DNS records)
4. API Keys → Create API Key
5. Copy → `RESEND_API_KEY`

**Credentials to save:**
```
RESEND_API_KEY=re_...
SMTP_FROM=noreply@yourdomain.com
```

---

## Phase 2: Environment Configuration

### Create Production .env File

Create `.env.production` in root directory:

```bash
# Database
DATABASE_URL="postgresql://user:password@db.supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_JWT_SECRET="your-jwt-secret"

# Authentication
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://yourdomain.com"

# Google OAuth
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AI APIs
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_GEMINI_API_KEY="AIzaSy..."

# Social Media APIs
FACEBOOK_APP_ID="..."
FACEBOOK_APP_SECRET="..."
INSTAGRAM_APP_ID="..."
INSTAGRAM_APP_SECRET="..."
LINKEDIN_CLIENT_ID="..."
LINKEDIN_CLIENT_SECRET="..."
TWITTER_API_KEY="..."
TWITTER_API_SECRET="..."
TWITTER_BEARER_TOKEN="..."

# Email
RESEND_API_KEY="re_..."
SMTP_FROM="noreply@yourdomain.com"

# n8n Integration
N8N_WEBHOOK_URL="https://n8n.yourdomain.com/webhook"
N8N_API_KEY="..."

# App Config
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_NAME="ContentFlow"
NODE_ENV="production"

# Logging
LOG_LEVEL="info"

# Sentry (Optional)
SENTRY_AUTH_TOKEN="..."
NEXT_PUBLIC_SENTRY_DSN="..."
```

---

### Vercel Configuration

**For Frontend (apps/web):**

1. Go to https://vercel.com
2. Import GitHub repository
3. Select `apps/web` as root directory
4. Add environment variables (from .env.production)
5. Deploy

**For Backend (apps/api):**

1. Create new project in Vercel
2. Import same GitHub repository
3. Select `apps/api` as root directory
4. Add environment variables
5. Deploy

---

## Phase 3: Database Setup

### Run Migrations

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run migrations on production database
pnpm db:migrate -- --skip-generate
```

---

## Phase 4: End-to-End Testing

### Test Checklist

**Authentication:**
- [ ] User signup with email/password
- [ ] User login
- [ ] User logout
- [ ] JWT token refresh
- [ ] Google OAuth login
- [ ] Password reset flow

**Team Management:**
- [ ] Create team
- [ ] Invite team members
- [ ] Manage roles & permissions
- [ ] Remove team member

**AI Features:**
- [ ] Generate social post
- [ ] Rewrite content
- [ ] Expand content
- [ ] Summarize content
- [ ] Generate hashtags

**Media:**
- [ ] Upload image
- [ ] Upload video
- [ ] Delete media
- [ ] List media library

**Social Accounts:**
- [ ] Connect Twitter account
- [ ] Connect LinkedIn account
- [ ] Connect Facebook account
- [ ] Connect Instagram account

**Scheduler:**
- [ ] Create draft post
- [ ] Schedule post
- [ ] Publish immediately
- [ ] View calendar

**Payments:**
- [ ] Upgrade to Pro plan
- [ ] Stripe payment processing
- [ ] Subscription confirmation

**Analytics:**
- [ ] View engagement metrics
- [ ] View growth tracking
- [ ] View post analytics

---

## Testing API Endpoints

See `docs/API_TESTING.md` for complete API testing guide with cURL examples.

---

## Post-Launch Checklist

- [ ] Monitor Sentry for errors
- [ ] Monitor uptime and performance
- [ ] Check email delivery (Resend)
- [ ] Verify webhook processing
- [ ] Monitor database performance
- [ ] Set up automated backups
- [ ] Configure WAF (Web Application Firewall)
- [ ] Enable DDoS protection
- [ ] Set up monitoring alerts

---

## Troubleshooting

### Database Connection Failed
```bash
# Test connection
psql "postgresql://user:password@db.supabase.co:5432/postgres"
```

### Stripe Webhook Not Receiving Events
1. Check endpoint URL is correct
2. Verify signing secret matches
3. Check firewall/security groups allow webhooks
4. Monitor Stripe Dashboard → Events

### OAuth Not Working
1. Verify redirect URIs match exactly
2. Check API keys are valid
3. Test in incognito window
4. Check browser console for errors

### Email Not Sending
1. Verify Resend API key is correct
2. Check domain is verified
3. Check email is not in spam
4. Monitor Resend dashboard

---

## Support

- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
