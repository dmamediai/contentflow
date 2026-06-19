# ContentFlow Deployment Checklist

Complete pre-launch checklist for deploying ContentFlow to production.

---

## 📋 Quick Start

**Before any deployment, run the E2E test suite:**

```bash
# Windows PowerShell
.\scripts\e2e-test.ps1

# Bash/Linux/Mac
bash scripts/e2e-test.sh
```

---

## Phase 1: Credentials & Accounts Setup (Week 1)

### Third-Party Services

- [ ] **Supabase**
  - [ ] Create production project at https://supabase.com
  - [ ] Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] Copy `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] Copy `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] Copy `JWT Secret` → `SUPABASE_JWT_SECRET`
  - [ ] Enable Google OAuth provider
  - [ ] Create storage buckets: `media`, `uploads`, `avatars`
  - [ ] Enable RLS on storage buckets

- [ ] **Stripe**
  - [ ] Create production account at https://stripe.com
  - [ ] Copy `Publishable Key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - [ ] Copy `Secret Key` → `STRIPE_SECRET_KEY`
  - [ ] Configure webhook endpoint: `/api/webhooks/stripe`
  - [ ] Copy `Webhook Secret` → `STRIPE_WEBHOOK_SECRET`
  - [ ] Create product plans (Pro, Agency)

- [ ] **OpenAI**
  - [ ] Create API key at https://platform.openai.com
  - [ ] Set up payment method (paid plan)
  - [ ] Copy API key → `OPENAI_API_KEY`

- [ ] **Anthropic Claude**
  - [ ] Create API key at https://console.anthropic.com
  - [ ] Set up payment method
  - [ ] Copy API key → `ANTHROPIC_API_KEY`

- [ ] **Google Gemini**
  - [ ] Create API key at https://ai.google.dev
  - [ ] Copy API key → `GOOGLE_GEMINI_API_KEY`

- [ ] **Google OAuth**
  - [ ] Create project at https://console.developers.google.com
  - [ ] Enable Google+ API
  - [ ] Create OAuth 2.0 credentials
  - [ ] Add authorized redirect URIs:
    - `https://yourdomain.com/api/auth/callback/google`
  - [ ] Copy `Client ID` → `GOOGLE_CLIENT_ID`
  - [ ] Copy `Client Secret` → `GOOGLE_CLIENT_SECRET`

- [ ] **Twitter/X API**
  - [ ] Apply for Developer account at https://developer.twitter.com
  - [ ] Create project and app
  - [ ] Copy `API Key` → `TWITTER_API_KEY`
  - [ ] Copy `API Secret` → `TWITTER_API_SECRET`
  - [ ] Copy `Bearer Token` → `TWITTER_BEARER_TOKEN`

- [ ] **LinkedIn API**
  - [ ] Create app at https://www.linkedin.com/developers/apps
  - [ ] Copy `Client ID` → `LINKEDIN_CLIENT_ID`
  - [ ] Copy `Client Secret` → `LINKEDIN_CLIENT_SECRET`

- [ ] **Facebook/Meta API**
  - [ ] Create app at https://developers.facebook.com
  - [ ] Enable Facebook Login & Pages API
  - [ ] Copy `App ID` → `FACEBOOK_APP_ID`
  - [ ] Copy `App Secret` → `FACEBOOK_APP_SECRET`
  - [ ] Do same for Instagram

- [ ] **Resend Email Service**
  - [ ] Sign up at https://resend.com
  - [ ] Verify domain
  - [ ] Copy API key → `RESEND_API_KEY`
  - [ ] Set `SMTP_FROM` to verified domain

---

## Phase 2: Environment Configuration (Week 1)

### Create Production Environment Files

- [ ] **Generate NEXTAUTH_SECRET**
  ```bash
  openssl rand -base64 32  # Linux/Mac
  # or PowerShell: [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
  ```

- [ ] **Create `.env.production` in root**
  - [ ] Copy from `.env.example`
  - [ ] Fill in all production credentials
  - [ ] DO NOT commit to Git
  - [ ] Store securely (password manager)

- [ ] **Vercel Configuration**
  - [ ] Create Vercel account (if not existing)
  - [ ] Link GitHub repository
  - [ ] Import `apps/web` as frontend
  - [ ] Import `apps/api` as backend (separate project)
  - [ ] Add all environment variables from `.env.production`
  - [ ] Set Node.js version to 18+

### Supabase Configuration

- [ ] **Database Setup**
  - [ ] Run `pnpm db:generate` locally
  - [ ] Run `pnpm db:migrate` on production database
  - [ ] Verify schema created successfully

- [ ] **Storage Setup**
  - [ ] Create buckets: `media`, `uploads`, `avatars`
  - [ ] Enable RLS policies
  - [ ] Set CORS headers

- [ ] **Auth Setup**
  - [ ] Enable Email provider
  - [ ] Enable Google OAuth with credentials
  - [ ] Configure email templates (optional)

---

## Phase 3: Pre-Launch Testing (Week 2)

### Automated Testing

- [ ] **Run E2E Test Suite**
  ```bash
  # PowerShell
  .\scripts\e2e-test.ps1
  
  # Bash
  bash scripts/e2e-test.sh
  ```

- [ ] All tests pass ✓
- [ ] No critical failures

### Manual Testing - Authentication

- [ ] [ ] Sign up with email/password
- [ ] [ ] Receive confirmation email
- [ ] [ ] Login with credentials
- [ ] [ ] Logout
- [ ] [ ] Google OAuth login
- [ ] [ ] Password reset flow
- [ ] [ ] JWT token refresh

### Manual Testing - Team Management

- [ ] [ ] Create team
- [ ] [ ] Invite team member
- [ ] [ ] Change member role
- [ ] [ ] Remove team member
- [ ] [ ] Delete team

### Manual Testing - AI Features

- [ ] [ ] Generate social post
- [ ] [ ] Rewrite content
- [ ] [ ] Expand content
- [ ] [ ] Summarize content
- [ ] [ ] Generate hashtags
- [ ] [ ] Test multiple AI providers fallback

### Manual Testing - Media

- [ ] [ ] Upload image
- [ ] [ ] Upload video
- [ ] [ ] View media library
- [ ] [ ] Delete media
- [ ] [ ] Download media

### Manual Testing - Scheduler

- [ ] [ ] Create draft
- [ ] [ ] Schedule post
- [ ] [ ] Edit scheduled post
- [ ] [ ] Cancel scheduled post
- [ ] [ ] Publish immediately
- [ ] [ ] View calendar view

### Manual Testing - Payments

- [ ] [ ] View pricing page
- [ ] [ ] Upgrade to Pro
- [ ] [ ] Complete Stripe payment (test card)
- [ ] [ ] Receive subscription confirmation
- [ ] [ ] View subscription details
- [ ] [ ] Cancel subscription

### Manual Testing - Social Integration

- [ ] [ ] Connect Twitter account
- [ ] [ ] Connect LinkedIn account
- [ ] [ ] Connect Facebook account
- [ ] [ ] Publish to multiple platforms
- [ ] [ ] Verify posts appear on social media

### Manual Testing - Analytics

- [ ] [ ] View overview dashboard
- [ ] [ ] View engagement metrics
- [ ] [ ] Filter by date range
- [ ] [ ] View post analytics
- [ ] [ ] View growth tracking

### Performance Testing

- [ ] [ ] Page load time < 3 seconds
- [ ] [ ] API response time < 500ms
- [ ] [ ] Database queries < 100ms
- [ ] [ ] No memory leaks
- [ ] [ ] No N+1 queries

### Security Testing

- [ ] [ ] Test HTTPS enforcement
- [ ] [ ] Test CORS headers
- [ ] [ ] Test authentication bypass attempts
- [ ] [ ] Test SQL injection protection
- [ ] [ ] Test XSS protection
- [ ] [ ] Test CSRF protection
- [ ] [ ] Test rate limiting
- [ ] [ ] Verify no sensitive data in logs

### Browser Testing

- [ ] [ ] Chrome (latest)
- [ ] [ ] Firefox (latest)
- [ ] [ ] Safari (latest)
- [ ] [ ] Edge (latest)
- [ ] [ ] Mobile (iOS Safari)
- [ ] [ ] Mobile (Android Chrome)

---

## Phase 4: Deployment (Week 2-3)

### Frontend Deployment (Vercel)

- [ ] **Pre-Deployment**
  - [ ] Run `pnpm build` locally - no errors
  - [ ] Run `pnpm lint` - no errors
  - [ ] Run `pnpm type-check` - no errors

- [ ] **Deploy**
  - [ ] Push to main branch
  - [ ] Vercel auto-deploys
  - [ ] Monitor build logs for errors
  - [ ] Test deployed frontend

- [ ] **Post-Deployment**
  - [ ] Verify DNS points to Vercel
  - [ ] Test custom domain
  - [ ] Verify SSL certificate
  - [ ] Test all pages load

### Backend Deployment (Vercel/Render)

- [ ] **Pre-Deployment**
  - [ ] Run `pnpm build` locally - no errors
  - [ ] Verify database migrations run
  - [ ] Test API locally with production env vars

- [ ] **Deploy**
  - [ ] Push to main branch
  - [ ] Monitor build logs
  - [ ] Verify API is responding

- [ ] **Post-Deployment**
  - [ ] Test API endpoints with production URL
  - [ ] Verify database connectivity
  - [ ] Check error logs (Sentry)
  - [ ] Verify webhook endpoints configured

### Database Deployment

- [ ] [ ] Supabase project provisioned
- [ ] [ ] Database migrations run successfully
- [ ] [ ] Data backed up
- [ ] [ ] Automated backups enabled

### SSL/Security

- [ ] [ ] HTTPS enabled on all domains
- [ ] [ ] SSL certificate valid
- [ ] [ ] Security headers configured:
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] Strict-Transport-Security

---

## Phase 5: Post-Launch Monitoring (Week 3+)

### Monitoring & Alerts

- [ ] [ ] Set up Sentry error tracking
- [ ] [ ] Set up email alerts for critical errors
- [ ] [ ] Set up database performance monitoring
- [ ] [ ] Set up uptime monitoring
- [ ] [ ] Configure incident response (PagerDuty, etc.)

### Logging

- [ ] [ ] Verify application logs are being collected
- [ ] [ ] Verify error logs are captured
- [ ] [ ] Set log retention policy
- [ ] [ ] Create log queries for debugging

### Performance Monitoring

- [ ] [ ] Set up analytics (Vercel Analytics)
- [ ] [ ] Monitor Core Web Vitals
- [ ] [ ] Set performance budget
- [ ] [ ] Create performance dashboards

### User Monitoring

- [ ] [ ] Set up usage analytics
- [ ] [ ] Track signup/conversion metrics
- [ ] [ ] Monitor user retention
- [ ] [ ] Track feature adoption

### Security

- [ ] [ ] Enable audit logging
- [ ] [ ] Monitor failed login attempts
- [ ] [ ] Set up DDoS protection (Cloudflare)
- [ ] [ ] Regular security audits scheduled

### Operations

- [ ] [ ] Backup strategy in place
- [ ] [ ] Disaster recovery plan
- [ ] [ ] On-call rotation established
- [ ] [ ] Runbooks created

---

## Phase 6: Launch & Marketing

### Pre-Launch

- [ ] [ ] Create landing page
- [ ] [ ] Set up email newsletter
- [ ] [ ] Create social media accounts
- [ ] [ ] Draft launch announcement
- [ ] [ ] Prepare support documentation

### Launch Day

- [ ] [ ] Send launch announcement
- [ ] [ ] Post on social media
- [ ] [ ] Notify existing beta users
- [ ] [ ] Monitor error tracking closely
- [ ] [ ] Be available for support

### Post-Launch (First Week)

- [ ] [ ] Monitor metrics closely
- [ ] [ ] Respond to user feedback
- [ ] [ ] Fix critical bugs ASAP
- [ ] [ ] Publish blog post about launch
- [ ] [ ] Engage with community

---

## Troubleshooting Guide

### Deployment Issues

| Issue | Solution |
|-------|----------|
| Build fails on Vercel | Check build logs, run `pnpm build` locally first |
| API not responding | Check environment variables, database connection |
| Database connection failed | Verify DATABASE_URL, firewall rules |
| 502 Bad Gateway | Check API logs, restart service |

### Common Errors

| Error | Solution |
|-------|----------|
| CORS error | Check CORS headers in API, verify origin whitelisted |
| 401 Unauthorized | Verify JWT secret matches, token not expired |
| 403 Forbidden | Check user permissions/role |
| 404 Not Found | Verify resource exists, check ID |
| 500 Server Error | Check error logs in Sentry |

### Performance Issues

| Issue | Solution |
|-------|----------|
| Slow page loads | Check database queries, enable CDN caching |
| High CPU usage | Check for infinite loops, optimize algorithms |
| High memory usage | Check for memory leaks, increase server size |
| Slow API response | Add database indexes, enable caching |

---

## Rollback Plan

If critical issues occur after launch:

```bash
# Revert to previous version
git checkout previous-commit
git push

# Or use Vercel rollback
# Dashboard → Deployments → Previous → Rollback
```

---

## Success Criteria

Launch is considered successful when:

- ✓ All E2E tests pass
- ✓ All manual tests pass
- ✓ No critical errors in first 24 hours
- ✓ Users can sign up and use platform
- ✓ Payments processing successfully
- ✓ Social media posting works
- ✓ Analytics data being collected
- ✓ Support team can help users

---

## Documentation Links

- **Production Setup**: [docs/PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)
- **API Testing**: [docs/API_TESTING.md](docs/API_TESTING.md)
- **README**: [README.md](README.md)

---

## Contact & Support

- **Technical Issues**: Check Sentry dashboard
- **Deployment Help**: See Vercel/Render documentation
- **Database Help**: See Supabase documentation
- **Payment Issues**: See Stripe documentation

---

**Last Updated**: 2024-01-15
**Version**: 1.0
**Status**: Ready for Production
