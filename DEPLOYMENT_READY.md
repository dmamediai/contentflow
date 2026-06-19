# 🚀 DEPLOYMENT READY - VERCEL + SUPABASE + GITHUB

**Status:** ✅ Ready to Deploy

---

## 📋 LAUNCH CHECKLIST

### **Step 1: Create GitHub Repository**

```bash
# 1. Go to https://github.com/new
# 2. Create repository: "contentflow"
# 3. Choose Public (free plan)
# 4. DO NOT initialize with README (we have one)
```

Then add remote and push:

```bash
git remote add origin https://github.com/YOUR-USERNAME/contentflow.git
git branch -M main
git push -u origin main
```

---

### **Step 2: Set up Supabase**

**Create Supabase Project:**
1. Go to https://supabase.com
2. Sign up or log in
3. Create new project: "contentflow"
4. Select region closest to you
5. Create strong database password
6. Wait for project to initialize

**Get Connection String:**
```
Settings → Database → Connection Pooling (Preferred)
Copy the connection string
Format: postgresql://postgres:PASSWORD@PROJECT-ID.pooling.supabase.co:6543/postgres
```

---

### **Step 3: Deploy Database to Supabase**

```bash
# Set database URL
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT.pooling.supabase.co:6543/postgres"

# Run migrations
cd packages/db
npm install
npm run migrate:deploy

# Seed initial data (optional)
npm run seed
```

---

### **Step 4: Deploy Frontend to Vercel**

**Option A: Connect from GitHub (Recommended)**

1. Go to https://vercel.com
2. Sign in or create account
3. Click "Add New..." → "Project"
4. Select your "contentflow" GitHub repo
5. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./apps/web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

6. Add Environment Variables:
   ```
   NEXTAUTH_SECRET=<generate-random-string>
   NEXTAUTH_URL=https://contentflow.vercel.app
   NEXT_PUBLIC_APP_URL=https://contentflow.vercel.app
   NEXT_PUBLIC_API_URL=https://api.contentflow.vercel.app
   DATABASE_URL=<your-supabase-connection-string>
   ```

7. Click "Deploy"
8. Wait for build to complete ✅

---

### **Step 5: Deploy Backend to Vercel (or Cloud Run)**

**Option A: Vercel (Recommended)**

1. Go to Vercel, click "Add New..." → "Project"
2. Select contentflow repo again
3. Configure:
   - **Framework:** Other
   - **Root Directory:** `./apps/api`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. Add Environment Variables:
   ```
   NODE_ENV=production
   DATABASE_URL=<your-supabase-connection-string>
   JWT_SECRET=<generate-random-string>
   NEXTAUTH_SECRET=<same-as-frontend>
   API_URL=https://api.contentflow.vercel.app
   
   TWITTER_CLIENT_ID=<from-twitter-dev>
   TWITTER_CLIENT_SECRET=<from-twitter-dev>
   LINKEDIN_CLIENT_ID=<from-linkedin>
   LINKEDIN_CLIENT_SECRET=<from-linkedin>
   FACEBOOK_APP_ID=<from-facebook>
   FACEBOOK_APP_SECRET=<from-facebook>
   
   ADMIN_EMAILS=your-email@example.com
   ```

5. Click "Deploy"

**Option B: Cloud Run (Google Cloud)**

```bash
# Build
docker build -t gcr.io/PROJECT_ID/contentflow-api apps/api/

# Push
docker push gcr.io/PROJECT_ID/contentflow-api

# Deploy
gcloud run deploy contentflow-api \
  --image gcr.io/PROJECT_ID/contentflow-api \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=$DATABASE_URL
```

---

### **Step 6: Configure OAuth Providers**

**Twitter/X:**
1. Go to https://developer.twitter.com/
2. Create or select app
3. Go to "Keys and tokens"
4. Get Client ID and Client Secret
5. Set callback URL: `https://api.contentflow.vercel.app/api/oauth/callback/twitter`

**LinkedIn:**
1. Go to https://linkedin.com/developers
2. Create app
3. Get Client ID and Secret
4. Add redirect URI: `https://api.contentflow.vercel.app/api/oauth/callback/linkedin`

**Facebook:**
1. Go to https://developers.facebook.com/
2. Create app
3. Get App ID and Secret
4. Add platform: Web
5. Set Site URL: `https://contentflow.vercel.app`

---

### **Step 7: Configure DNS**

```
If using custom domain:

1. Purchase domain (Namecheap, GoDaddy, etc.)
2. Go to Vercel → contentflow-web → Settings → Domains
3. Add your domain
4. Update DNS records:
   - A record: 76.76.19.51
   - CNAME: cname.vercel-dns.com
5. Wait for DNS propagation (up to 48 hours)
```

---

### **Step 8: Verify Deployment**

Check all services are running:

```bash
# Check frontend
curl https://contentflow.vercel.app

# Check backend
curl https://api.contentflow.vercel.app/health

# Check database
psql $DATABASE_URL -c "SELECT version();"
```

---

## 🎉 LIVE CHECKS

Once deployed, verify:

- [ ] Frontend loads at https://contentflow.vercel.app
- [ ] Can sign up with email
- [ ] Can login with credentials
- [ ] Dashboard loads
- [ ] API responds to requests
- [ ] Database is connected
- [ ] OAuth flows work
- [ ] Analytics page loads
- [ ] Admin panel loads (with admin email)

---

## 🚨 Production Checklist

Before going fully live:

- [ ] Enable HTTPS redirect
- [ ] Set up uptime monitoring
- [ ] Enable error tracking (Sentry)
- [ ] Configure email notifications
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Test OAuth flow end-to-end
- [ ] Verify all environment variables
- [ ] Test user signup flow
- [ ] Test social publishing
- [ ] Monitor error logs

---

## 📊 Monitoring

**Vercel Analytics:**
- https://vercel.com/dashboard → contentflow-web → Analytics
- Monitor: Response time, Build time, Errors

**Supabase:**
- https://app.supabase.com → contentflow → Logs
- Monitor: Query performance, Slow queries, Errors

---

## 🔄 Deployment Updates

To update after launch:

```bash
# Make changes locally
git add .
git commit -m "Update: description"

# Push to GitHub
git push origin main

# Vercel auto-deploys when you push to main ✅
```

---

## 🆘 Troubleshooting

**Frontend not loading:**
- Check Vercel build logs
- Verify environment variables
- Check if API URL is correct

**Backend not responding:**
- Check Vercel backend deployment
- Verify DATABASE_URL
- Check logs for connection errors

**Database connection failing:**
- Verify connection string
- Check Supabase password
- Ensure IP whitelist (if needed)

**OAuth not working:**
- Verify redirect URIs match exactly
- Check Client ID/Secret
- Clear browser cookies

---

## 🎊 LAUNCH COMPLETE!

Your ContentFlow MVP is now live on:
- **Frontend:** https://contentflow.vercel.app
- **API:** https://api.contentflow.vercel.app
- **Database:** Supabase PostgreSQL

**Go get users!** 🚀

---

## Quick Reference

**Useful Links:**
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com
- GitHub Repo: https://github.com/YOUR-USERNAME/contentflow

**Useful Commands:**
```bash
# View API logs
vercel logs

# View database logs
supabase logs

# Redeploy (no code changes)
vercel redeploy
```

---

**Total deployment time:** ~15-30 minutes
**Total cost (first month):** FREE (Vercel + Supabase free tiers)

**Ready to launch!** 🎉
