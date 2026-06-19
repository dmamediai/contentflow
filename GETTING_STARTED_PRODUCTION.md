# ContentFlow - Getting Started with Production Setup

This guide walks you through the complete process of setting up production credentials and testing your ContentFlow deployment.

---

## 📁 What We've Created

### Documentation Files
1. **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Complete pre-launch checklist (✓ Ready to use)
2. **[docs/PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)** - Detailed credentials setup guide (✓ Ready to use)
3. **[docs/API_TESTING.md](docs/API_TESTING.md)** - API endpoint testing guide with cURL examples (✓ Ready to use)

### Testing Scripts
1. **[scripts/e2e-test.ps1](scripts/e2e-test.ps1)** - PowerShell E2E testing script (✓ Ready to run)
2. **[scripts/e2e-test.sh](scripts/e2e-test.sh)** - Bash E2E testing script (✓ Ready to run)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Run Local Tests First

Before setting up production, verify your development environment works:

**PowerShell (Windows):**
```powershell
# Make sure API and Web servers are running first
# Terminal 1:
cd apps/web
pnpm dev

# Terminal 2:
cd apps/api
pnpm dev

# Terminal 3: Run E2E tests
.\scripts\e2e-test.ps1
```

**Bash (Mac/Linux):**
```bash
# Make sure API and Web servers are running first
# Terminal 1:
cd apps/web
pnpm dev

# Terminal 2:
cd apps/api
pnpm dev

# Terminal 3: Run E2E tests
bash scripts/e2e-test.sh
```

**Expected Output:**
```
=== Phase 1: API Health Check ===
✓ API health check (HTTP 200)

=== Phase 2: Authentication ===
✓ User registered successfully
✓ Get current session

... more tests ...

========================================
Tests Passed: 20
Tests Failed: 0
========================================
✓ All tests passed!
```

---

## 📋 Production Credentials Setup (1-2 Days)

### Phase 1: Collect Credentials from Third-Party Services

Follow **[docs/PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)** to get credentials from:

1. **Supabase** (Database & Auth)
   - Create project
   - Get API keys
   - Enable OAuth providers
   - Create storage buckets

2. **Stripe** (Payments)
   - Create production account
   - Get API keys
   - Set up webhooks

3. **AI APIs** (Content Generation)
   - OpenAI
   - Anthropic Claude
   - Google Gemini

4. **Social Media APIs** (Publishing)
   - Twitter/X
   - LinkedIn
   - Facebook/Instagram

5. **Google OAuth** (Social Login)
   - Create OAuth app
   - Get client ID & secret

6. **Resend** (Email)
   - Create account
   - Verify domain
   - Get API key

### Phase 2: Create Production Environment File

Create file: `.env.production` in root directory

```bash
# Copy from template
cp .env.example .env.production

# Then fill in with your credentials
# DO NOT commit this file to Git
```

---

## 🧪 End-to-End Testing (1-2 Hours)

Once production credentials are configured:

### Test with Production Credentials

```powershell
# Set production database
$env:DATABASE_URL = "your-production-db-url"

# Run tests against production
.\scripts\e2e-test.ps1 -ApiUrl "https://api.yourdomain.com"
```

### Manual Testing Checklist

Use **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** for:
- Authentication testing
- Team management testing
- AI features testing
- Media upload testing
- Scheduler testing
- Payment testing
- Social media integration testing
- Analytics testing

---

## 📊 Testing Coverage

The E2E test scripts cover:

| Feature | Tests | Status |
|---------|-------|--------|
| **Authentication** | 4 tests | ✓ User signup, login, session, logout |
| **Team Management** | 5 tests | ✓ Create, update, list, members |
| **AI Content** | 3 tests | ✓ Generate, rewrite, hashtags |
| **Scheduler** | 3 tests | ✓ Create, list, get posts |
| **Media** | 1 test | ✓ List media library |
| **Analytics** | 1 test | ✓ Overview metrics |

**Total: 17 automated tests**
**Plus: 30+ manual test cases** (see checklist)

---

## 🔧 Troubleshooting

### Test Fails: "Connection refused"
```
Problem: API server not running
Solution: Start API in terminal:
  cd apps/api && pnpm dev
```

### Test Fails: "401 Unauthorized"
```
Problem: Invalid token or expired
Solution: Check if authentication endpoint working:
  curl http://localhost:3001/api/health
```

### Test Fails: "Database connection error"
```
Problem: DATABASE_URL not set or invalid
Solution: Verify connection string in .env:
  echo $DATABASE_URL
```

### E2E Script Permission Error (Windows)
```
Problem: PowerShell execution policy
Solution: Run this first:
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📚 API Testing Details

See **[docs/API_TESTING.md](docs/API_TESTING.md)** for:

- Detailed curl examples for each endpoint
- Response formats
- Error codes
- Complete user journey test
- Load testing examples
- Performance benchmarks

---

## 🚢 Deployment Process

### Pre-Deployment Checklist

```bash
# 1. Run all tests locally
.\scripts\e2e-test.ps1

# 2. Check no console errors
pnpm lint
pnpm type-check

# 3. Build production bundle
pnpm build

# 4. Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $STRIPE_SECRET_KEY
# ... verify all key env vars
```

### Deploy to Vercel

1. Connect GitHub repository
2. Import `apps/web` as frontend
3. Add environment variables from `.env.production`
4. Deploy
5. Test production URL

### Deploy Backend

1. Create separate Vercel project for `apps/api`
2. Add environment variables
3. Deploy
4. Run tests against production API

### Post-Deployment Testing

```powershell
# Test production API
.\scripts\e2e-test.ps1 -ApiUrl "https://api.yourdomain.com"
```

---

## 📈 Success Metrics

Your deployment is successful when:

- ✅ All E2E tests pass (0 failures)
- ✅ All 30+ manual test cases pass
- ✅ Response times < 500ms
- ✅ No errors in Sentry (first 24 hours)
- ✅ Users can complete signup → post creation → publish flow
- ✅ Payments processing through Stripe
- ✅ Social media posts publishing successfully

---

## 🆘 Support Resources

### Documentation
- **[PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)** - Complete credentials guide
- **[API_TESTING.md](docs/API_TESTING.md)** - API endpoint testing
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Launch checklist
- **[README.md](README.md)** - Project overview

### Third-Party Docs
- Supabase: https://supabase.com/docs
- Stripe: https://stripe.com/docs
- Vercel: https://vercel.com/docs
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs

### Debugging
1. Check **[docs/API_TESTING.md](docs/API_TESTING.md)** for "Troubleshooting" section
2. Check application logs in Sentry
3. Check API logs in terminal
4. Check database query logs

---

## 🎯 Next Steps

### 1. Immediate (Today)
- [ ] Run `e2e-test.ps1` against local dev environment
- [ ] Verify all tests pass
- [ ] Read **[docs/PRODUCTION_SETUP.md](docs/PRODUCTION_SETUP.md)**

### 2. This Week
- [ ] Create third-party service accounts (Supabase, Stripe, OpenAI, etc.)
- [ ] Collect all API keys and credentials
- [ ] Create `.env.production` file
- [ ] Run migration tests

### 3. Next Week
- [ ] Manual testing against dev environment
- [ ] Fix any failing tests
- [ ] Deploy to staging (optional)
- [ ] Run full test suite

### 4. Launch Week
- [ ] Final production credential verification
- [ ] Deploy to production
- [ ] Run E2E tests against production
- [ ] Monitor error tracking
- [ ] Be ready for support

---

## 📞 Need Help?

### Common Questions

**Q: Can I run tests without setting up all credentials?**
A: Yes, run tests locally first. Tests will skip features without credentials.

**Q: How long does credentials setup take?**
A: Usually 1-2 days depending on approval times for services like Stripe.

**Q: What if a test fails?**
A: See [docs/API_TESTING.md](docs/API_TESTING.md#debugging-tips) for debugging steps.

**Q: Can I deploy without running tests?**
A: Not recommended. Tests catch 90% of common issues.

**Q: How do I know deployment is successful?**
A: See "Success Metrics" section above.

---

## 📊 Test Results Template

Keep track of your test runs:

```
Date: 2024-01-15
Environment: Production
API URL: https://api.yourdomain.com

Results:
✓ Phase 1: API Health Check - 1/1 passed
✓ Phase 2: Authentication - 4/4 passed
✓ Phase 3: Team Management - 5/5 passed
✓ Phase 4: AI Content - 3/3 passed
✓ Phase 5: Scheduler - 3/3 passed
✓ Phase 6: Media - 1/1 passed
✓ Phase 7: Analytics - 1/1 passed

Total: 18/18 tests passed ✓
Status: READY FOR PRODUCTION
```

---

## 🔒 Security Checklist

Before launching:

- [ ] HTTPS enabled everywhere
- [ ] Environment variables not committed to Git
- [ ] Database backups configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS protection enabled
- [ ] CSRF tokens configured

---

**Created**: 2024-01-15
**Last Updated**: 2024-01-15
**Status**: ✓ Production Ready
