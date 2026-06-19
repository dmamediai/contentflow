# Google OAuth - Visual Step-by-Step Guide

Simple visual guide with ASCII diagrams to get your Google OAuth credentials.

---

## 🎯 What You'll Get

```
Google Cloud Console
        ↓
   ┌─────────────────┐
   │ GOOGLE_CLIENT_ID│  ← Copy this
   └─────────────────┘
        ↓
   Your App (.env)
        ↓
   ┌─────────────────┐
   │ GOOGLE_CLIENT_  │  ← Copy this
   │    SECRET       │
   └─────────────────┘
        ↓
   ✓ Google Login Button
   ✓ Users can sign in with Google
```

---

## Step 1️⃣: Go to Google Cloud Console

**Open this URL in your browser:**
```
https://console.developers.google.com
```

**You'll see:**
```
┌────────────────────────────────────────────┐
│  Google Cloud Console                      │
├────────────────────────────────────────────┤
│                                             │
│  [Select a project ▼]     [NEW PROJECT]   │
│                                             │
│  Recent projects                            │
│  • None yet                                 │
│                                             │
└────────────────────────────────────────────┘
```

**Click:** `[NEW PROJECT]` button

---

## Step 2️⃣: Create New Project

**Fill in the form:**

```
┌────────────────────────────────────────────┐
│  New Project                               │
├────────────────────────────────────────────┤
│                                             │
│  Project name:    [ContentFlow         ]  │
│                                             │
│  Organization:    [None (personal)     ]  │
│                                             │
│  Location:        [No organization    ]  │
│                                             │
│                              [CREATE]      │
│                                             │
└────────────────────────────────────────────┘
```

**Type:** `ContentFlow` in Project name
**Click:** `[CREATE]` button
**Wait:** 1-2 minutes for creation

---

## Step 3️⃣: Select Your Project

**You'll see a notification:**
```
┌─────────────────────────────┐
│ ✓ Project ContentFlow       │
│   created successfully      │
└─────────────────────────────┘
```

**Click project dropdown (top of page):**
```
┌────────────────────────────────────────────┐
│  [ContentFlow ▼]   Google Cloud Console   │
└────────────────────────────────────────────┘
```

**Select:** `ContentFlow` from dropdown

---

## Step 4️⃣: Enable APIs

**Go to API Library:**
```
Left Sidebar:
├── Google Cloud
│   ├── APIs & Services
│   │   └── [Library] ← Click here
│   ├── Credentials
│   ├── OAuth consent screen
│   └── ...
```

**Search for "Google+ API":**
```
┌────────────────────────────────────────────┐
│  Search: [Google+ API____________]        │
│                                             │
│  Results:                                   │
│  ┌──────────────────────────────────────┐  │
│  │ Google+ API                          │  │
│  │ Enable your app to use Google+ API  │  │
│  │                     [SELECT] [ENABLE]   │
│  └──────────────────────────────────────┘  │
│                                             │
└────────────────────────────────────────────┘
```

**Click:** `[ENABLE]` button

**Wait:** A few seconds

**Result:**
```
┌────────────────────────────────────────────┐
│  ✓ Google+ API is now enabled              │
└────────────────────────────────────────────┘
```

**Repeat for "People API":**
- Go to Library again
- Search: `People API`
- Click `[ENABLE]`

---

## Step 5️⃣: Create OAuth Credentials

**Go to Credentials:**
```
Left Sidebar:
├── Google Cloud
│   ├── APIs & Services
│   │   ├── Library
│   │   └── [Credentials] ← Click here
```

**You'll see:**
```
┌────────────────────────────────────────────┐
│  Credentials                               │
├────────────────────────────────────────────┤
│                                             │
│  [+ CREATE CREDENTIALS]                    │
│                                             │
│  Before you can use OAuth...                │
│  [Configure OAuth Consent Screen]          │
│                                             │
└────────────────────────────────────────────┘
```

**Click:** `[Configure OAuth Consent Screen]`

---

## Step 6️⃣: Configure Consent Screen

**Choose User Type:**
```
┌────────────────────────────────────────────┐
│  OAuth Consent Screen Configuration        │
├────────────────────────────────────────────┤
│                                             │
│  User Type:                                 │
│  ○ Internal (requires Google Workspace)    │
│  ◉ External (recommended)                  │
│                                             │
│                              [CREATE]      │
│                                             │
└────────────────────────────────────────────┘
```

**Select:** `External` (already selected)
**Click:** `[CREATE]`

**Fill in App Details:**
```
┌────────────────────────────────────────────┐
│  App Registration                          │
├────────────────────────────────────────────┤
│                                             │
│  App name:          [ContentFlow       ]   │
│                                             │
│  User support email:[your@email.com   ]   │
│                                             │
│  Developer contact: [your@email.com   ]   │
│                                             │
│         [SAVE AND CONTINUE]                │
│                                             │
└────────────────────────────────────────────┘
```

**Fill in:**
- App name: `ContentFlow`
- User support email: your email
- Developer contact: your email

**Click:** `[SAVE AND CONTINUE]`

**Next Page - Add Scopes:**
```
┌────────────────────────────────────────────┐
│  Scopes                                    │
├────────────────────────────────────────────┤
│                                             │
│  [ADD OR REMOVE SCOPES]                    │
│                                             │
│  Selected scopes:                           │
│  (none yet)                                 │
│                                             │
│         [SAVE AND CONTINUE]                │
│                                             │
└────────────────────────────────────────────┘
```

**Click:** `[ADD OR REMOVE SCOPES]`

**In the popup, select:**
- ✓ `userinfo.email`
- ✓ `userinfo.profile`
- ✓ `openid`

**Click:** `[UPDATE]`

**Back on Scopes page:**
**Click:** `[SAVE AND CONTINUE]`

**Test Users (Optional):**
**Click:** `[SAVE AND CONTINUE]`

**Review:**
**Click:** `[BACK TO DASHBOARD]`

---

## Step 7️⃣: Create OAuth 2.0 Client ID

**Back on Credentials page:**
```
┌────────────────────────────────────────────┐
│  Credentials                               │
├────────────────────────────────────────────┤
│                                             │
│  [+ CREATE CREDENTIALS]                    │
│                                             │
│  OAuth 2.0 is now configured                │
│                                             │
└────────────────────────────────────────────┘
```

**Click:** `[+ CREATE CREDENTIALS]`

**Choose type:**
```
┌────────────────────────────────────────────┐
│  Create Credentials                        │
├────────────────────────────────────────────┤
│                                             │
│  What type of credentials do you need?     │
│                                             │
│  ○ API Key                                  │
│  ○ OAuth 2.0 Client IDs ◉ (select this)   │
│  ○ Service Account                         │
│                                             │
│         [CREATE]                           │
│                                             │
└────────────────────────────────────────────┘
```

**Select:** `OAuth 2.0 Client IDs` (already selected)
**Click:** `[CREATE]`

**Choose application type:**
```
┌────────────────────────────────────────────┐
│  Application Type                          │
├────────────────────────────────────────────┤
│                                             │
│  ○ Desktop application                     │
│  ○ TV and limited input devices            │
│  ◉ Web application (select this)           │
│  ○ Android                                  │
│  ○ iOS                                      │
│                                             │
│         [CREATE]                           │
│                                             │
└────────────────────────────────────────────┘
```

**Select:** `Web application` (already selected)
**Click:** `[CREATE]`

---

## Step 8️⃣: Configure Web Application

**Fill in the form:**

```
┌─────────────────────────────────────────────┐
│  Create OAuth 2.0 Client ID                 │
├─────────────────────────────────────────────┤
│                                              │
│  Name: [ContentFlow Web Client          ]  │
│                                              │
│  Authorized JavaScript origins:             │
│  [+ Add URI]                                │
│    • http://localhost:3000                  │
│    • http://localhost:3001                  │
│    • https://yourdomain.com                 │
│    • https://www.yourdomain.com             │
│                                              │
│  Authorized redirect URIs:                  │
│  [+ Add URI]                                │
│    • http://localhost:3000/api/auth/...    │
│    • https://yourdomain.com/api/auth/...   │
│                                              │
│                              [CREATE]       │
│                                              │
└─────────────────────────────────────────────┘
```

**Fill in:**
1. Name: `ContentFlow Web Client`

2. **Authorized JavaScript origins:**
   - `http://localhost:3000`
   - `http://localhost:3001`
   - `https://yourdomain.com` (replace with your domain)
   - `https://www.yourdomain.com`

3. **Authorized redirect URIs:**
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`

**Click:** `[CREATE]`

---

## Step 9️⃣: Copy Your Credentials

**You'll see a popup:**

```
┌─────────────────────────────────────────────┐
│  OAuth 2.0 Client ID                        │
├─────────────────────────────────────────────┤
│                                              │
│  Client ID                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  123456789-abc123def456.apps.googleusercontent.com
│  [Copy]                                     │
│                                              │
│  Client Secret                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  GOCSPX-abc123def456                        │
│  [Copy]                                     │
│                                              │
│                              [Close]        │
│                                              │
└─────────────────────────────────────────────┘
```

**IMPORTANT:**

1. Click **[Copy]** for Client ID
2. Open a text editor or password manager
3. Paste: `GOOGLE_CLIENT_ID = (pasted value)`
4. Click **[Copy]** for Client Secret
5. Paste: `GOOGLE_CLIENT_SECRET = (pasted value)`
6. Save in a secure location (password manager)

---

## Step 🔟: Add to Your App

**Open file:** `apps/web/.env.local`

```env
# Add these lines:
GOOGLE_CLIENT_ID=123456789-abc123def456ghi789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456ghi789jkl
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

**Save the file.**

---

## Step 1️⃣1️⃣: Test It!

**Start your app:**

```bash
cd apps/web
pnpm dev
```

**Open browser:**
```
http://localhost:3000
```

**You should see:**
```
┌──────────────────────────────┐
│    ContentFlow Login         │
├──────────────────────────────┤
│                              │
│  [Sign in with Email/Password]
│                              │
│        OR                    │
│                              │
│  [Sign in with Google]       │
│                              │
└──────────────────────────────┘
```

**Click:** `[Sign in with Google]`

**You'll be redirected to Google:**
```
┌──────────────────────────────┐
│    Google Login              │
├──────────────────────────────┤
│                              │
│  Email: [_____________]      │
│  Password: [_____________]   │
│                              │
│  [Sign in]                   │
│                              │
└──────────────────────────────┘
```

**Sign in with your Google account**

**After login, you should be redirected back:**
```
┌──────────────────────────────┐
│    ContentFlow Dashboard     │
├──────────────────────────────┤
│                              │
│  Welcome, [Your Name]!       │
│                              │
│  ✓ Logged in successfully   │
│                              │
└──────────────────────────────┘
```

✅ **SUCCESS!** Google OAuth is working!

---

## 🎯 Summary

```
Step 1: Go to Google Cloud Console
        ↓
Step 2: Create "ContentFlow" project
        ↓
Step 3: Select the project
        ↓
Step 4: Enable Google+ API
        ↓
Step 5: Enable People API
        ↓
Step 6: Configure OAuth Consent Screen
        ↓
Step 7: Create OAuth 2.0 Client ID
        ↓
Step 8: Configure Web Application URLs
        ↓
Step 9: Copy Client ID & Secret
        ↓
Step 10: Add to .env.local
        ↓
Step 11: Test in your app
        ↓
✓ DONE! Users can now sign in with Google
```

---

## ⏱️ Time: 10 minutes total

---

**Need help?** See [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md) for detailed explanations
