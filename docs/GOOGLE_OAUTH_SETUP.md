# Google OAuth Setup - Step by Step

Complete guide to get `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for ContentFlow.

---

## Prerequisites

- Google account (personal or business)
- Access to Google Cloud Console
- Your production domain name (or localhost for testing)

---

## Step 1: Create a Google Cloud Project

### 1.1 Go to Google Cloud Console

1. Open browser: https://console.developers.google.com
2. You'll see a page like this:

```
Google Cloud Console
├── Select a project
│   └── NEW PROJECT (button)
└── Recent projects
```

### 1.2 Create New Project

1. Click **"NEW PROJECT"** button (top left)
2. Fill in project details:
   - **Project name:** `ContentFlow` (or your app name)
   - **Organization:** (leave blank or select if you have one)
   - **Location:** (leave as default)

3. Click **CREATE**
4. Wait 1-2 minutes for project creation

### 1.3 Select Your Project

1. Once created, you'll see a notification
2. Click the **project dropdown** (top of page)
3. Select your new **ContentFlow** project
4. The dashboard should now show your project

---

## Step 2: Enable Required APIs

You need to enable 2 APIs for Google OAuth to work.

### 2.1 Go to API Library

1. In left sidebar, click **"APIs & Services"**
2. Click **"Library"**
3. You'll see a search box and list of APIs

### 2.2 Enable Google+ API

1. Search for **"Google+ API"** in the search box
2. Click on **"Google+ API"** in results
3. Click **ENABLE** button
4. Wait for it to enable (few seconds)

### 2.3 Enable People API

1. Go back to **"APIs & Services"** → **"Library"**
2. Search for **"People API"**
3. Click on **"People API"** in results
4. Click **ENABLE** button
5. Wait for it to enable

✓ Both APIs should now show as "Enabled"

---

## Step 3: Create OAuth 2.0 Credentials

### 3.1 Go to Credentials

1. In left sidebar: **"APIs & Services"** → **"Credentials"**
2. You'll see options at the top:
   - "+ CREATE CREDENTIALS" button
   - Tabs: Credentials, API Keys, etc.

### 3.2 Configure OAuth Consent Screen (First Time Only)

If this is your first time, you'll need to configure the consent screen first:

1. You'll see a banner: **"To create an OAuth 2.0 Client ID, you must first set up your OAuth consent screen"**
2. Click **"CONFIGURE CONSENT SCREEN"** button

#### Configure Consent Screen Details:

**User Type Selection:**
- Choose **"External"** (unless you have Google Workspace)
- Click **CREATE**

**App Registration Form:**
Fill in the following:

| Field | Value |
|-------|-------|
| App name | `ContentFlow` |
| User support email | `your-email@gmail.com` |
| Developer contact info | `your-email@gmail.com` |

Click **SAVE AND CONTINUE**

**Scopes Page:**
- Click **ADD OR REMOVE SCOPES**
- Search for and select:
  - `userinfo.email`
  - `userinfo.profile`
  - `openid`
- Click **UPDATE**
- Click **SAVE AND CONTINUE**

**Test Users (Optional):**
- You can skip this or add test email addresses
- Click **SAVE AND CONTINUE**

**Review:**
- Review all settings
- Click **BACK TO DASHBOARD**

### 3.3 Create OAuth 2.0 Client ID

1. Back on **Credentials** page
2. Click **"+ CREATE CREDENTIALS"** button (top)
3. Select **"OAuth 2.0 Client IDs"**
4. Choose application type: **"Web application"**

#### Web Application Settings:

**Name:**
- Name: `ContentFlow Web Client`

**Authorized JavaScript origins:**
Add these URLs:
- `http://localhost:3000` (for local development)
- `http://localhost:3001` (for local API)
- `https://yourdomain.com` (your production domain)
- `https://www.yourdomain.com` (with www if applicable)

**Authorized redirect URIs:**
Add these URLs:
- `http://localhost:3000/api/auth/callback/google` (development)
- `https://yourdomain.com/api/auth/callback/google` (production)

✅ Make sure these redirect URIs match EXACTLY in your code!

Click **CREATE**

---

## Step 4: Copy Your Credentials

### 4.1 View Your Credentials

After clicking CREATE, you'll see a popup with your credentials:

```
OAuth 2.0 Client ID

Client ID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
123456789-abc123def456ghi789jkl012.apps.googleusercontent.com
[Copy button]

Client Secret
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOCSPX-abc123def456ghi789jkl012
[Copy button]
```

### 4.2 Save Your Credentials

**IMPORTANT:** These are sensitive - keep them safe!

1. Click **Copy** for Client ID
2. Paste into a secure location (password manager)
3. Click **Copy** for Client Secret
4. Paste into a secure location

Save as:
```
GOOGLE_CLIENT_ID = 123456789-abc123def456ghi789jkl012.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = GOCSPX-abc123def456ghi789jkl012
```

---

## Step 5: Update Your Environment Files

### 5.1 Development Setup

Create/update `.env.local` in `apps/web/`:

```env
# Google OAuth (Development)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc123def456ghi789jkl012.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456ghi789jkl012
```

### 5.2 Production Setup

Create/update `.env.production` in root:

```env
# Google OAuth (Production)
GOOGLE_CLIENT_ID=123456789-abc123def456ghi789jkl012.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456ghi789jkl012
```

### 5.3 NextAuth Configuration

Make sure `apps/web/src/app/api/auth/[...nextauth]/route.ts` has Google provider configured:

```typescript
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // ... rest of config
};
```

---

## Step 6: Verify Setup

### 6.1 Test Locally

1. Start your app:
   ```bash
   cd apps/web
   pnpm dev
   ```

2. Go to: `http://localhost:3000`

3. Click **"Sign in with Google"** button

4. You should be redirected to Google login

5. After login, you should be redirected back to your app

✅ If this works, Google OAuth is set up correctly!

### 6.2 Test Production

After deploying to production:

1. Go to your production domain: `https://yourdomain.com`
2. Click **"Sign in with Google"** button
3. Complete the login flow
4. Should redirect back to your app

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem:** The redirect URL doesn't match what's configured in Google Console

**Solution:**
1. Check the exact error message for the URL it's trying to use
2. Go back to Google Cloud Console
3. Credentials → Click your OAuth app
4. Edit the "Authorized redirect URIs" section
5. Add the exact URL from the error message
6. Save changes
7. Try again (might need to wait 1-2 minutes for changes to propagate)

### Error: "invalid_client"

**Problem:** Client ID or Secret is wrong

**Solution:**
1. Double-check you copied the credentials correctly
2. Make sure there are no extra spaces or special characters
3. Verify you're using the right credentials for the environment
4. Clear browser cookies and try again

### Error: "unauthorized_client"

**Problem:** The app isn't authorized to use these credentials

**Solution:**
1. Go to Google Cloud Console
2. Credentials → Click your OAuth app
3. Verify "Authorized JavaScript origins" includes your current domain
4. Verify "Authorized redirect URIs" includes the callback URL
5. Save any changes
6. Wait 1-2 minutes for changes to take effect
7. Try again

### Error: "access_denied"

**Problem:** User didn't grant permission

**Solution:**
1. This is normal if user clicks "Cancel" on Google login
2. Ask user to try again and click "Allow"

### Error: "CORS" or "blocked by CORS policy"

**Problem:** Browser security blocking the request

**Solution:**
1. Make sure your domain is in "Authorized JavaScript origins"
2. Check browser console for exact error message
3. If localhost, make sure `http://localhost:3000` is included
4. If using a different port, add that too (e.g., `http://localhost:3001`)

---

## Advanced: Using Google OAuth in Your App

### Setup NextAuth Provider

In `apps/web/src/lib/auth-config.ts`:

```typescript
import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Add custom fields to session if needed
      }
      return session;
    },
  },
};
```

### Add Sign-In Button

In your component:

```typescript
import { signIn } from "next-auth/react";

export function GoogleSignInButton() {
  return (
    <button 
      onClick={() => signIn("google")}
      className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50"
    >
      Sign in with Google
    </button>
  );
}
```

### Protect Routes

In `apps/web/src/middleware.ts`:

```typescript
import { withAuth } from "next-auth/middleware";

export const middleware = withAuth({
  pages: {
    signIn: "/auth/signin",
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
```

---

## Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Google+ API
- [ ] Enabled People API
- [ ] Created OAuth 2.0 Client ID
- [ ] Added `http://localhost:3000` to authorized origins
- [ ] Added `http://localhost:3000/api/auth/callback/google` to redirect URIs
- [ ] Added production domain to authorized origins
- [ ] Added production redirect URI
- [ ] Copied `GOOGLE_CLIENT_ID` to `.env.local`
- [ ] Copied `GOOGLE_CLIENT_SECRET` to `.env.local`
- [ ] Updated `.env.production` with production credentials
- [ ] Updated NextAuth configuration
- [ ] Tested locally - Google login works
- [ ] Deployed to production
- [ ] Tested production - Google login works

---

## Quick Reference

| Item | Value |
|------|-------|
| Console URL | https://console.developers.google.com |
| Client ID | `GOOGLE_CLIENT_ID` in `.env` |
| Client Secret | `GOOGLE_CLIENT_SECRET` in `.env` |
| Dev Redirect URI | `http://localhost:3000/api/auth/callback/google` |
| Prod Redirect URI | `https://yourdomain.com/api/auth/callback/google` |
| APIs Needed | Google+ API, People API |
| Env File Location | `.env.local` (dev), `.env.production` (prod) |

---

## Security Notes

🔒 **IMPORTANT:**

1. Never commit `.env` files to Git
2. Never share `GOOGLE_CLIENT_SECRET` publicly
3. Use different OAuth apps for dev/staging/production
4. Rotate secrets regularly in production
5. Use environment variables, not hardcoded values
6. Enable 2FA on your Google account for added security

---

## Next Steps

After setting up Google OAuth:

1. ✅ Test login locally
2. ✅ Verify it works
3. ✅ Set up other OAuth providers (GitHub, etc.) if needed
4. ✅ Deploy to production
5. ✅ Test production login

Then get other credentials:
- [ ] Supabase
- [ ] Stripe
- [ ] OpenAI
- [ ] Social media APIs

---

**Last Updated:** 2024-01-15
**Google OAuth Status:** ✓ Ready to Implement
