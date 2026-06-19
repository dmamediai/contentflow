# ContentFlow Production - Quick Reference Card

## 🚀 Fast Track to Production

### 1. Run Tests (5 min)
```powershell
# Windows
.\scripts\e2e-test.ps1

# Mac/Linux  
bash scripts/e2e-test.sh
```

### 2. Get Credentials (1-2 days)
Follow: [docs/PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)

| Service | Link | Key Variables |
|---------|------|---------------|
| Supabase | https://supabase.com | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Stripe | https://stripe.com | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| OpenAI | https://platform.openai.com | `OPENAI_API_KEY` |
| Google OAuth | https://console.developers.google.com | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Twitter/X | https://developer.twitter.com | `TWITTER_API_KEY`, `TWITTER_BEARER_TOKEN` |
| LinkedIn | https://www.linkedin.com/developers | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| Facebook | https://developers.facebook.com | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` |
| Resend | https://resend.com | `RESEND_API_KEY` |

### 3. Create Production .env
```bash
cp .env.example .env.production
# Fill in all credentials
# DO NOT commit to Git!
```

### 4. Run Database Migrations
```bash
pnpm db:migrate
```

### 5. Deploy
- Frontend: Deploy `apps/web` to Vercel
- Backend: Deploy `apps/api` to Vercel/Render
- Add all env vars from `.env.production`

### 6. Test Production
```powershell
.\scripts\e2e-test.ps1 -ApiUrl "https://api.yourdomain.com"
```

---

## 📋 Complete Checklist

### Supabase
- [ ] Create project
- [ ] Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copy service role → `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Copy JWT secret → `SUPABASE_JWT_SECRET`
- [ ] Create buckets: media, uploads, avatars
- [ ] Enable RLS on buckets
- [ ] Enable Google OAuth

### Stripe
- [ ] Create production account
- [ ] Copy Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Copy Secret key → `STRIPE_SECRET_KEY`
- [ ] Add webhook URL: `/api/webhooks/stripe`
- [ ] Copy Webhook secret → `STRIPE_WEBHOOK_SECRET`
- [ ] Create product plans

### AI APIs
- [ ] OpenAI: Get `OPENAI_API_KEY`
- [ ] Anthropic: Get `ANTHROPIC_API_KEY`
- [ ] Google Gemini: Get `GOOGLE_GEMINI_API_KEY`

### OAuth & Social
- [ ] Google: Get `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- [ ] Twitter: Get `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_BEARER_TOKEN`
- [ ] LinkedIn: Get `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
- [ ] Facebook: Get `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`

### Email
- [ ] Resend: Get `RESEND_API_KEY`
- [ ] Set `SMTP_FROM` to verified domain

### Environment
- [ ] Generate `NEXTAUTH_SECRET`
- [ ] Generate `NEXTAUTH_URL` (production domain)
- [ ] Set `DATABASE_URL` (Supabase connection)

---

## 🧪 Test Commands

### Local Development
```bash
# Start all services
pnpm dev

# Run E2E tests
.\scripts\e2e-test.ps1

# Test specific endpoints
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/teams
```

### Production
```bash
# Test against production API
.\scripts\e2e-test.ps1 -ApiUrl "https://api.yourdomain.com"

# Test specific endpoint
curl https://api.yourdomain.com/api/health
```

---

## 📚 Documentation Quick Links

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [GETTING_STARTED_PRODUCTION.md](GETTING_STARTED_PRODUCTION.md) | **START HERE** | 10 min |
| [PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md) | Credentials guide | 30 min |
| [API_TESTING.md](docs/API_TESTING.md) | API endpoints reference | 20 min |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | Full pre-launch checklist | 15 min |
| [README.md](README.md) | Project overview | 10 min |

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Tests fail with "Connection refused" | Start API: `cd apps/api && pnpm dev` |
| "401 Unauthorized" errors | Check JWT token is valid, not expired |
| Database connection fails | Verify DATABASE_URL in .env |
| Stripe webhook not working | Check webhook URL and signing secret |
| Email not sending | Verify Resend API key and domain verified |
| Social auth fails | Check OAuth credentials and redirect URIs |

---

## 🎯 Success Criteria

✅ Deployment is successful when:

```
[ ] All E2E tests pass (0 failures)
[ ] Can signup and login
[ ] Can create team
[ ] Can generate AI content
[ ] Can schedule posts
[ ] Can upload media
[ ] Stripe payments work
[ ] Social media posting works
[ ] Analytics showing data
[ ] No critical errors first 24h
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│            ContentFlow Production Stack              │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Frontend (Vercel)              Backend (Vercel)    │
│  ┌──────────────────┐          ┌──────────────────┐ │
│  │  Next.js 15      │◄────────►│  Express.js      │ │
│  │  React 18        │          │  TypeScript      │ │
│  │  TailwindCSS     │          │  Prisma ORM      │ │
│  │  Shadcn UI       │          │  Auth (JWT)      │ │
│  └──────────────────┘          └──────────────────┘ │
│          ▲                             ▲              │
│          │                             │              │
│          └─────────┬──────────────────┘              │
│                    │                                  │
│              ┌─────▼──────┐                          │
│              │  Supabase   │                          │
│              ├─────────────┤                          │
│              │ PostgreSQL  │                          │
│              │ Auth        │                          │
│              │ Storage     │                          │
│              └─────────────┘                          │
│                    ▲                                  │
│                    │                                  │
│      ┌─────────────┼─────────────┐                  │
│      │             │             │                  │
│  ┌───▼──┐  ┌──────▼──┐  ┌──────▼──┐              │
│  │Stripe│  │ AI APIs │  │ Social  │              │
│  │      │  │         │  │ APIs    │              │
│  └──────┘  └─────────┘  └─────────┘              │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## ⏱️ Timeline

| Phase | Duration | Task |
|-------|----------|------|
| 1 | 5 min | Run local E2E tests |
| 2 | 1-2 days | Get third-party credentials |
| 3 | 1 hour | Create `.env.production` |
| 4 | 1-2 hours | Run production E2E tests |
| 5 | 2-4 hours | Manual testing |
| 6 | 1 hour | Deploy to production |
| 7 | 24 hours | Monitor and support |

**Total: 2-3 days to production**

---

## 🔗 Key Files

```
contentflow/
├── DEPLOYMENT_CHECKLIST.md          ← Launch checklist
├── GETTING_STARTED_PRODUCTION.md    ← Start here
├── QUICK_REFERENCE.md               ← This file
├── .env.example                     ← Template
├── .env.production                  ← Create this (don't commit)
├── docs/
│   ├── PRODUCTION_SETUP.md          ← Credentials guide
│   └── API_TESTING.md               ← API reference
├── scripts/
│   ├── e2e-test.ps1                 ← Windows tests
│   └── e2e-test.sh                  ← Bash tests
├── apps/
│   ├── web/                         ← Next.js frontend
│   └── api/                         ← Express backend
└── packages/
    ├── db/                          ← Prisma schema
    ├── types/                       ← Shared types
    └── ui/                          ← UI components
```

---

## 📞 Need Help?

1. **Read**: [GETTING_STARTED_PRODUCTION.md](GETTING_STARTED_PRODUCTION.md)
2. **Reference**: [docs/PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)
3. **Check**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
4. **Test**: Run `.\scripts\e2e-test.ps1`
5. **Troubleshoot**: See "Troubleshooting" section above

---

**Version**: 1.0  
**Last Updated**: 2024-01-15  
**Status**: Ready for Production ✓
