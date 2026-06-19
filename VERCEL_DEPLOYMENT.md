# Deploy to Vercel - Complete Guide

**Status:** Ready to Deploy  
**Frontend App:** Next.js (apps/web)  
**Backend App:** Express.js (apps/api)  

---

## 🚀 Quick Start (15 minutes)

You'll deploy 2 separate apps on Vercel:
1. **Frontend** - `apps/web` (Next.js)
2. **Backend** - `apps/api` (Express.js)

---

## Step 1️⃣: Create Vercel Account

If you don't have one:

1. Go to: https://vercel.com
2. Click **"Sign Up"**
3. Sign in with GitHub (recommended)
4. Authorize Vercel to access your GitHub account

---

## Step 2️⃣: Deploy Frontend (Next.js)

### 2.1 Create New Project

1. Go to: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub repo: `contentflow`
4. Click **"Import"**

### 2.2 Configure Frontend

**Project Settings:**
- **Project Name:** `contentflow-web` (or your choice)
- **Framework Preset:** Next.js
- **Root Directory:** `apps/web`
- **Build Command:** `npm run build` (pre-filled)
- **Output Directory:** `.next` (pre-filled)

### 2.3 Add Environment Variables

Click **"Environment Variables"** and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://khdqesmehmpfjoaxksou.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=https://contentflow-web.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=generate-a-random-secret
NEXTAUTH_URL=https://contentflow-web.vercel.app
```

**To get these values:**
- **Supabase keys:** Dashboard → Settings → API
- **Google OAuth:** Follow docs/GOOGLE_OAUTH_SETUP.md
- **Stripe:** Not needed for initial deployment

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. You'll see: ✅ **Deployment Complete!**
4. Your frontend is live at: `https://contentflow-web.vercel.app`

---

## Step 3️⃣: Deploy Backend (Express.js)

### 3.1 Create New Project

1. Go to: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub repo: `contentflow`
4. Click **"Import"**

### 3.2 Configure Backend

**Project Settings:**
- **Project Name:** `contentflow-api` (or your choice)
- **Framework:** None (Node.js)
- **Root Directory:** `apps/api`
- **Build Command:** `npm run build` (pre-filled)
- **Output Directory:** `dist` (pre-filled)

### 3.3 Add Environment Variables

Click **"Environment Variables"** and add:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.khdqesmehmpfjoaxksou.supabase.co:5432/postgres
NODE_ENV=production
LOG_LEVEL=info
OPENAI_API_KEY=your-openai-key
NEXTAUTH_SECRET=same-secret-as-frontend
NEXTAUTH_URL=https://contentflow-web.vercel.app
```

**Important:**
- Use your actual Supabase connection string
- Use the SAME `NEXTAUTH_SECRET` as frontend
- NEXTAUTH_URL points to your frontend domain

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. Your backend is live at: `https://contentflow-api.vercel.app`

---

## Step 4️⃣: Update Frontend Configuration

After backend is deployed, update frontend environment variables:

**Go to:**
- Frontend Project → Settings → Environment Variables

**Update:**
```
NEXT_PUBLIC_API_URL=https://contentflow-api.vercel.app
```

**Re-deploy frontend:**
- Go to Deployments
- Click "..." on latest deployment
- Select "Redeploy"

---

## Step 5️⃣: Test Deployment

### Test Frontend
```bash
# Open in browser
https://contentflow-web.vercel.app

# You should see:
✅ Login page
✅ Signup form
✅ Dashboard (after login)
```

### Test Backend
```bash
# In terminal
curl https://contentflow-api.vercel.app/health

# You should see:
{"status":"ok","timestamp":"..."}
```

### Test API Connection
```bash
# Try signup through frontend
# Should work end-to-end
```

---

## Environment Variables Reference

### Frontend (.env for apps/web)
```env
# Required for Production
NEXT_PUBLIC_SUPABASE_URL=https://khdqesmehmpfjoaxksou.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
NEXT_PUBLIC_APP_URL=https://contentflow-web.vercel.app
NEXTAUTH_URL=https://contentflow-web.vercel.app
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret

# Optional
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_SENTRY_DSN=your-dsn
```

### Backend (.env for apps/api)
```env
# Required for Production
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
NODE_ENV=production
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://contentflow-web.vercel.app

# AI APIs
OPENAI_API_KEY=sk-proj-...

# Logging
LOG_LEVEL=info
```

---

## 🔍 Troubleshooting

### ❌ Deployment Fails

**Check:**
1. Build command is correct
2. All environment variables are set
3. Database connection is valid

**Solution:**
```bash
# Check logs in Vercel:
Deployments → Latest → Logs

# Look for errors related to:
- Database connection
- Environment variables
- Build process
```

### ❌ Frontend Can't Connect to Backend

**Check:**
1. Backend API URL is correct
2. CORS is configured
3. API is responding to requests

**Solution:**
```bash
# Test API health
curl https://contentflow-api.vercel.app/health

# Should return: {"status":"ok"...}
```

### ❌ Authentication Not Working

**Check:**
1. NEXTAUTH_SECRET matches on both apps
2. NEXTAUTH_URL is correct
3. Google OAuth credentials are set

**Solution:**
```bash
# Clear browser cookies
# Try signup again
# Check Vercel logs for errors
```

### ❌ Database Connection Failed

**Check:**
1. DATABASE_URL is correct
2. Supabase project is active
3. Network allows connections

**Solution:**
```bash
# Verify connection string format:
postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres

# Test locally first:
pnpm db:migrate
```

---

## ✅ Deployment Checklist

### Before Deploying
- [ ] GitHub repo is up to date
- [ ] All changes committed and pushed
- [ ] Vercel account created
- [ ] Supabase project active
- [ ] Database tables created

### Frontend Deployment
- [ ] Project imported from GitHub
- [ ] Root directory set to `apps/web`
- [ ] Environment variables added
- [ ] Build succeeds
- [ ] Deployment complete
- [ ] Frontend URL works

### Backend Deployment
- [ ] Project imported from GitHub
- [ ] Root directory set to `apps/api`
- [ ] Environment variables added
- [ ] Build succeeds
- [ ] Deployment complete
- [ ] API health check works

### Post-Deployment
- [ ] Update frontend env vars with API URL
- [ ] Redeploy frontend
- [ ] Test full user flow
- [ ] Monitor error logs
- [ ] Set up monitoring alerts

---

## 📊 Deployment URLs

Once deployed, you'll have:

```
Frontend:  https://contentflow-web.vercel.app
API:       https://contentflow-api.vercel.app
Database:  Supabase (existing)
```

---

## 🎯 Next Steps After Deployment

1. ✅ Test user signup/login
2. ✅ Test content creation
3. ✅ Monitor error logs
4. ✅ Set up monitoring (Sentry)
5. ✅ Get remaining credentials (Google OAuth, Stripe, etc.)
6. ✅ Enable social media integration
7. ✅ Launch to users!

---

## 📞 Support

**Vercel Docs:** https://vercel.com/docs  
**Next.js Deployment:** https://nextjs.org/docs/deployment  
**Express on Vercel:** https://vercel.com/docs/runtimes/nodejs

---

**You're ready to deploy!** 🚀

Next: Follow the steps above to deploy both apps to Vercel.
