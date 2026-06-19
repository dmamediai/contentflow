# 🔧 Vercel Environment Variables Setup Guide

**Status:** Backend requires environment variables to run on Vercel  
**Date:** 2026-06-19

---

## ⚠️ Current Issue

The backend API is crashing with `500: INTERNAL_SERVER_ERROR` because required environment variables are not set in the Vercel production environment.

---

## ✅ Solution: Set Environment Variables via Vercel Dashboard

### For Backend API (apps/api)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dmamediais-projects/api/settings

2. **Navigate to Environment Variables**
   - Click "Settings" → "Environment Variables"

3. **Add the following variables:**

#### Required Variables

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.khdqesmehmpfjoaxksou.supabase.co:5432/postgres
```
- Replace `[PASSWORD]` with your Supabase database password
- Find this in Supabase Dashboard → Project Settings → Database

```
NEXTAUTH_SECRET=[GENERATE_NEW_SECRET]
```
- Generate a random secret: `openssl rand -hex 32`
- Or use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

#### Optional Variables (for features)

```
OPENAI_API_KEY=sk-proj-[YOUR_KEY]
NODE_ENV=production
LOG_LEVEL=info
NEXT_PUBLIC_APP_URL=https://web-507i2v7ef-dmamediais-projects.vercel.app
```

### For Frontend (apps/web)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dmamediais-projects/web/settings

2. **Navigate to Environment Variables**
   - Click "Settings" → "Environment Variables"

3. **Add the following variables:**

```
NEXT_PUBLIC_API_URL=https://api-c4miilp9y-dmamediais-projects.vercel.app
NEXTAUTH_SECRET=[SAME_SECRET_AS_BACKEND]
NEXTAUTH_URL=https://web-507i2v7ef-dmamediais-projects.vercel.app
```

---

## 📋 Step-by-Step Instructions (with Screenshots)

### Step 1: Access Backend Settings
```
1. Go to https://vercel.com
2. Select project "api" (dmamediais-projects/api)
3. Click "Settings" in top menu
4. Select "Environment Variables" from left sidebar
```

### Step 2: Add DATABASE_URL
```
1. Click "Add New" button
2. Name: DATABASE_URL
3. Value: postgresql://postgres:YOUR_PASSWORD@db.khdqesmehmpfjoaxksou.supabase.co:5432/postgres
4. Select: Production (default checked)
5. Click "Save"
```

### Step 3: Add NEXTAUTH_SECRET
```
1. Click "Add New" button
2. Name: NEXTAUTH_SECRET
3. Value: [Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
4. Select: Production
5. Click "Save"
```

### Step 4: Redeploy Backend
```
1. Go to "Deployments" tab
2. Click three dots (•••) on latest deployment
3. Click "Redeploy"
4. Wait for build to complete
```

### Step 5: Repeat for Frontend
```
1. Go to https://vercel.com/dmamediais-projects/web/settings
2. Add NEXT_PUBLIC_API_URL = https://api-c4miilp9y-dmamediais-projects.vercel.app
3. Add NEXTAUTH_SECRET = (same value as backend)
4. Add NEXTAUTH_URL = https://web-507i2v7ef-dmamediais-projects.vercel.app
5. Go to "Deployments" → redeploy latest
```

---

## 🔐 Finding Your Credentials

### Supabase Database Password
1. Go to: https://app.supabase.com
2. Select your project
3. Click "Settings" → "Database"
4. Find "Database Password" (or reset it)
5. Copy the connection string

### Generate NEXTAUTH_SECRET
```bash
# Option 1: OpenSSL
openssl rand -hex 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Online generator
# https://www.random.org/cgi-bin/randbytes?nbytes=32&format=h
```

---

## ✅ Verify Setup

### After Setting Variables & Redeploying

1. **Test Health Endpoint**
   ```bash
   curl https://api-c4miilp9y-dmamediais-projects.vercel.app/health
   ```
   
   Expected response:
   ```json
   {"status":"ok"}
   ```

2. **Check Vercel Logs**
   - Go to Deployment
   - Click "Logs" tab
   - Should show successful startup

3. **Test Frontend**
   - Visit: https://web-507i2v7ef-dmamediais-projects.vercel.app
   - Should load without errors
   - Can sign up/login

---

## 🚨 Troubleshooting

### Backend Still Crashing
1. Check that DATABASE_URL is set correctly
   ```
   Should be: postgresql://postgres:PASSWORD@db.PROJECTID.supabase.co:5432/postgres
   ```

2. Verify NEXTAUTH_SECRET is a long hex string
   ```
   Should be: 64-character hex string (32 bytes)
   ```

3. Check Vercel build logs:
   - Go to "Deployments" → click deployment → "Logs"
   - Look for error messages

4. Try redeploying again:
   - Go to "Deployments"
   - Click three dots on latest
   - Click "Redeploy"

### Frontend Still Shows Error
1. Make sure NEXT_PUBLIC_API_URL is set
2. Make sure it points to correct backend URL
3. Clear browser cache: Ctrl+Shift+Delete
4. Hard refresh: Ctrl+Shift+R
5. Redeploy frontend

### Database Connection Fails
1. Verify Supabase project is active
2. Check password is correct
3. Verify connection string format
4. Test locally first:
   ```bash
   psql "postgresql://postgres:PASSWORD@db.PROJECTID.supabase.co:5432/postgres"
   ```

---

## 📚 Complete Environment Variables Reference

### Backend (apps/api)

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | ✅ Yes | `postgresql://...` | Supabase connection string |
| `NEXTAUTH_SECRET` | ✅ Yes | `abc123def456...` | 64-char hex string |
| `OPENAI_API_KEY` | ❌ No | `sk-proj-...` | For AI features |
| `NODE_ENV` | ❌ No | `production` | Default: development |
| `PORT` | ❌ No | `3001` | Default: 3001 |
| `NEXT_PUBLIC_APP_URL` | ❌ No | `https://...` | Frontend URL |

### Frontend (apps/web)

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | `https://api-...` | Backend API URL |
| `NEXTAUTH_SECRET` | ✅ Yes | `abc123def456...` | Must match backend |
| `NEXTAUTH_URL` | ✅ Yes | `https://web-...` | Frontend URL |
| `NEXT_PUBLIC_SUPABASE_URL` | ❌ No | `https://...` | For direct DB access |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌ No | `eyJ...` | For direct DB access |

---

## ✨ After Environment Setup

Once variables are configured and apps are redeployed:

1. ✅ Backend will start successfully
2. ✅ Frontend will connect to backend
3. ✅ User authentication will work
4. ✅ Database operations will function
5. ✅ AI features will be available

---

## 🎯 Quick Checklist

- [ ] Supabase project is active and contains 25 tables
- [ ] DATABASE_URL is set on backend (Vercel Settings)
- [ ] NEXTAUTH_SECRET is set on both apps (same value)
- [ ] NEXTAUTH_URL is set on frontend
- [ ] NEXT_PUBLIC_API_URL points to backend
- [ ] Backend is redeployed
- [ ] Frontend is redeployed
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Frontend loads without errors
- [ ] Can access login page

---

## 📞 Getting Help

If environment variables aren't working:

1. Double-check variable names (case-sensitive)
2. Verify values don't have extra spaces
3. Ensure production environment is selected
4. Redeploy after adding variables
5. Wait 2-3 minutes for Vercel to propagate changes
6. Check deployment logs for errors

---

**Once these environment variables are set, your ContentFlow platform will be fully operational!** 🚀
