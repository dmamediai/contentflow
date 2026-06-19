# Google OAuth Setup - Quick Checklist (10 Minutes)

Follow this checklist to get your Google OAuth credentials in 10 minutes.

---

## ⏱️ Time Estimate: 10 Minutes

```
Step 1: Create Project          2 min
Step 2: Enable APIs             2 min
Step 3: Create Credentials      3 min
Step 4: Copy Credentials        1 min
Step 5: Add to Your App         2 min
────────────────────────────
Total:                          10 min
```

---

## Step-by-Step Checklist

### ✅ Step 1: Create Google Cloud Project (2 min)

- [ ] Go to: https://console.developers.google.com
- [ ] Click **"NEW PROJECT"** button
- [ ] Project name: `ContentFlow`
- [ ] Click **CREATE**
- [ ] Wait for project creation (1-2 min)
- [ ] Select your new project from dropdown

**Current:** You should see "ContentFlow" in the project selector

---

### ✅ Step 2: Enable APIs (2 min)

**Enable Google+ API:**
- [ ] Go to: **APIs & Services** → **Library**
- [ ] Search: `Google+ API`
- [ ] Click on **Google+ API**
- [ ] Click **ENABLE**

**Enable People API:**
- [ ] Go to: **APIs & Services** → **Library**
- [ ] Search: `People API`
- [ ] Click on **People API**
- [ ] Click **ENABLE**

**Current:** Both APIs should show as "Enabled"

---

### ✅ Step 3: Create OAuth Credentials (3 min)

**Go to Credentials:**
- [ ] Click: **APIs & Services** → **Credentials**

**Configure Consent Screen (First Time Only):**
- [ ] Look for banner about OAuth consent screen
- [ ] Click **"CONFIGURE CONSENT SCREEN"** button
- [ ] Choose: **External** (recommended)
- [ ] Click **CREATE**

**Fill Consent Screen:**
- [ ] App name: `ContentFlow`
- [ ] User support email: (your email)
- [ ] Developer contact: (your email)
- [ ] Click **SAVE AND CONTINUE**

**Add Scopes:**
- [ ] Click **ADD OR REMOVE SCOPES**
- [ ] Search and select:
  - [ ] `userinfo.email`
  - [ ] `userinfo.profile`
  - [ ] `openid`
- [ ] Click **UPDATE**
- [ ] Click **SAVE AND CONTINUE** × 2

**Back to Credentials:**
- [ ] Click **CREATE CREDENTIALS** button
- [ ] Select: **OAuth 2.0 Client IDs**
- [ ] Application type: **Web application**
- [ ] Name: `ContentFlow Web Client`

**Add Authorized URLs:**

For **Authorized JavaScript origins**, add:
- [ ] `http://localhost:3000`
- [ ] `http://localhost:3001`
- [ ] `https://yourdomain.com` (replace with your actual domain)
- [ ] `https://www.yourdomain.com` (if applicable)

For **Authorized redirect URIs**, add:
- [ ] `http://localhost:3000/api/auth/callback/google`
- [ ] `https://yourdomain.com/api/auth/callback/google`

- [ ] Click **CREATE**

**Current:** You should see a popup with your credentials

---

### ✅ Step 4: Copy Your Credentials (1 min)

You'll see a popup showing:

```
Client ID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(Your Client ID will appear here)

Client Secret
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(Your Client Secret will appear here)
```

**Copy Client ID:**
- [ ] Click the Client ID copy button
- [ ] Paste it somewhere safe (password manager)
- [ ] Save as: `GOOGLE_CLIENT_ID`

**Copy Client Secret:**
- [ ] Click the Client Secret copy button
- [ ] Paste it somewhere safe (password manager)
- [ ] Save as: `GOOGLE_CLIENT_SECRET`

**Close the popup:**
- [ ] You can now close this popup

**Current:** You have both credentials saved

---

### ✅ Step 5: Add to Your App (2 min)

**For Development (.env.local):**

File: `apps/web/.env.local`

```env
# Add these lines:
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXTAUTH_SECRET=generate-a-random-secret
NEXTAUTH_URL=http://localhost:3000
```

- [ ] Open file: `apps/web/.env.local`
- [ ] Paste your `GOOGLE_CLIENT_ID`
- [ ] Paste your `GOOGLE_CLIENT_SECRET`
- [ ] Save the file

**For Production (.env.production):**

File: `root/.env.production`

```env
# Add these lines:
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXTAUTH_SECRET=different-secret-here
NEXTAUTH_URL=https://yourdomain.com
```

- [ ] Open file: `.env.production` (create if doesn't exist)
- [ ] Paste same `GOOGLE_CLIENT_ID`
- [ ] Paste same `GOOGLE_CLIENT_SECRET`
- [ ] Generate new `NEXTAUTH_SECRET` for production
- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Save the file
- [ ] **DO NOT commit** `.env.production` to Git

**Current:** Your app now has Google OAuth credentials

---

## 🧪 Test It (5 min)

### Test Locally

```bash
# Terminal 1: Start your app
cd apps/web
pnpm dev

# Open browser
http://localhost:3000
```

- [ ] Look for **"Sign in with Google"** button
- [ ] Click it
- [ ] You should be redirected to Google login
- [ ] Sign in with your Google account
- [ ] You should be redirected back to your app
- [ ] You should be logged in

**✓ If this works, Google OAuth is set up correctly!**

### Test Production (After Deployment)

- [ ] Deploy your app to production
- [ ] Go to: `https://yourdomain.com`
- [ ] Click **"Sign in with Google"** button
- [ ] Complete login
- [ ] Should redirect back and be logged in

---

## 🚨 Troubleshooting Quick Fixes

### ❌ Error: "redirect_uri_mismatch"

**Fix:**
1. Go to Google Cloud Console
2. Credentials → Your OAuth app
3. Edit the app
4. Check "Authorized redirect URIs"
5. Make sure `https://yourdomain.com/api/auth/callback/google` is listed
6. Click SAVE
7. Wait 1-2 minutes
8. Try again

### ❌ Error: "invalid_client"

**Fix:**
1. Double-check you copied credentials correctly
2. Make sure no extra spaces in `.env` file
3. Check you're using right credentials for environment
4. Clear browser cookies
5. Try again

### ❌ Error: "unauthorized_client"

**Fix:**
1. Go to Google Cloud Console
2. Credentials → Your OAuth app
3. Edit the app
4. Verify "Authorized JavaScript origins" has your domain
5. Verify "Authorized redirect URIs" is correct
6. Click SAVE
7. Wait 1-2 minutes
8. Try again

### ❌ Button doesn't appear

**Fix:**
1. Check `.env.local` has `GOOGLE_CLIENT_ID` set
2. Restart your app: `pnpm dev`
3. Check browser console (F12) for errors
4. Make sure you're using NextAuth correctly

---

## 📋 Final Checklist

- [ ] Created Google Cloud project named "ContentFlow"
- [ ] Enabled Google+ API
- [ ] Enabled People API
- [ ] Created OAuth 2.0 Client ID
- [ ] Added `http://localhost:3000` to authorized origins
- [ ] Added `http://localhost:3000/api/auth/callback/google` to redirect URIs
- [ ] Added production domain to authorized origins
- [ ] Added production redirect URI
- [ ] Copied `GOOGLE_CLIENT_ID` to `.env.local`
- [ ] Copied `GOOGLE_CLIENT_SECRET` to `.env.local`
- [ ] Created `.env.production` with production credentials
- [ ] Tested locally - Google login works ✓
- [ ] Ready to test in production

---

## 🎉 You're Done!

Google OAuth is now set up. Next, get credentials for:

- [ ] Supabase (Database)
- [ ] Stripe (Payments)
- [ ] OpenAI (AI Content)
- [ ] Anthropic Claude (AI Alternative)
- [ ] Google Gemini (AI Alternative)
- [ ] Twitter API (Social Publishing)
- [ ] LinkedIn API (Social Publishing)
- [ ] Facebook API (Social Publishing)
- [ ] Resend (Email Service)

---

## 📚 Need More Help?

Read the full guide: [docs/GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)

---

**Time to Complete:** 10 minutes ⏱️
**Difficulty:** Easy 🟢
**Next:** Set up Supabase credentials
