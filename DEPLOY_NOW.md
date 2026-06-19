# 🚀 Deploy to Vercel - Automated Script

I've created automated deployment scripts for you. Here's how to use them.

---

## 📋 Prerequisites

Before running the deployment scripts, you need:

1. ✅ Vercel Account
   - Go to: https://vercel.com
   - Sign up if you don't have one
   - Sign in with GitHub (recommended)

2. ✅ Vercel CLI installed
   ```bash
   npm install -g vercel
   ```

3. ✅ `.env.production` file
   - Already created at project root
   - Contains all production variables
   - Database connection configured

---

## 🚀 Deploy (Choose Your Platform)

### **For Windows (PowerShell):**

```powershell
# 1. Open PowerShell
# 2. Navigate to project directory
cd "c:\Users\Admin\Desktop\socail Media"

# 3. Run the deployment script
.\deploy-to-vercel.ps1
```

### **For Mac/Linux (Bash):**

```bash
# 1. Open Terminal
# 2. Navigate to project directory
cd ~/contentflow

# 3. Make script executable
chmod +x deploy-to-vercel.sh

# 4. Run the deployment script
./deploy-to-vercel.sh
```

---

## 📝 What the Script Does

```
1. Checks if Vercel CLI is installed
   └─ If not, installs it automatically

2. Verifies Vercel authentication
   └─ If not authenticated, opens login

3. Deploys Frontend (apps/web)
   └─ Next.js app to Vercel
   └─ Gets public URL

4. Deploys Backend (apps/api)
   └─ Express.js API to Vercel
   └─ Gets public URL

5. Shows both URLs when done
   └─ Ready to test!
```

---

## ✅ After Deployment

Once the script completes, you'll have:

```
✅ Frontend URL: https://contentflow-web.vercel.app
✅ Backend URL:  https://contentflow-api.vercel.app
✅ Both apps live and running
✅ Database connected
✅ Ready for testing!
```

---

## 🧪 Test Your Deployment

### Test Backend Health
```bash
curl https://contentflow-api.vercel.app/health

# Expected response:
{"status":"ok","timestamp":"..."}
```

### Test Frontend
Open in browser:
```
https://contentflow-web.vercel.app
```

You should see the login page.

---

## 🆘 Troubleshooting

### Error: "Vercel CLI not found"
```bash
# Install it manually
npm install -g vercel
```

### Error: "Not authenticated"
```bash
# Login to Vercel
vercel login
```

### Error: "Missing environment variables"
Make sure `.env.production` exists in root with all variables filled in.

### Error: "Build failed"
Check the Vercel dashboard logs:
- https://vercel.com/dashboard

---

## 📊 Deployment Status

You can monitor your deployments at:
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Frontend Project:** Search for "contentflow-web"
- **Backend Project:** Search for "contentflow-api"

---

## 🎯 What Happens Next

After deployment:

1. ✅ Both apps are live on Vercel
2. ✅ Connected to your GitHub repo
3. ✅ Auto-deploys on every push to main
4. ✅ SSL/HTTPS configured automatically
5. ✅ CDN globally distributed
6. ✅ Ready for users!

---

## 📞 Need Help?

If the script fails:
1. Check error message
2. Read troubleshooting section above
3. Try manual deployment via Vercel dashboard

---

## 🔄 Manual Alternative (If Script Fails)

If the automated script doesn't work:

1. Go to: https://vercel.com/new
2. Import contentflow repository
3. Set root directory to `apps/web`
4. Add environment variables
5. Deploy
6. Repeat for `apps/api`

---

**Ready to deploy?**

Run the script now! 🚀

```powershell
# Windows
.\deploy-to-vercel.ps1

# Mac/Linux
./deploy-to-vercel.sh
```

---

**Your ContentFlow platform will be LIVE in 5 minutes!** ✨
