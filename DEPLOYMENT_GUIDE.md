# Hybrid Deployment Guide: Vercel + Replit + Firebase

Your app is now configured for a **hybrid deployment**:
- **Frontend (React)** → Vercel (fast CDN)
- **Backend (Express API)** → Replit (always running)
- **Database** → Firebase Firestore (cloud)

---

## Step 1: Deploy Backend to Replit

### 1.1 Add Firebase Credentials to Replit

1. In Replit, click **"Tools"** → **"Secrets"** (lock icon in sidebar)
2. Click **"New Secret"**
3. Add:
   - **Key:** `FIREBASE_SERVICE_ACCOUNT`
   - **Value:** Paste your complete Firebase JSON (all 50-60 lines)
4. Click **"Add Secret"**

### 1.2 Publish Your Replit App

1. Click the **"Deploy"** button (top right corner)
2. Wait 1-2 minutes for deployment
3. Copy your deployment URL - it looks like:
   - `https://your-app-name.replit.app`
4. **Save this URL** - you'll need it for Vercel!

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Update vercel.json with Your Replit URL

1. Open `vercel.json` in Replit
2. Replace `YOUR_REPLIT_URL.replit.dev` with your actual Replit URL:

```json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist/public",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-ACTUAL-REPLIT-URL.replit.app/api/:path*"
    }
  ]
}
```

3. Save the file
4. Push to GitHub:

```bash
git add .
git commit -m "Configure hybrid Vercel + Replit deployment"
git push
```

### 2.2 Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Vite
   - **Build Command:** `vite build`
   - **Output Directory:** `dist/public`
   - **Root Directory:** `./`
5. **Important:** You DON'T need Firebase credentials in Vercel
   (Backend handles all Firebase calls)
6. Click **"Deploy"**
7. Wait 2-3 minutes

---

## Step 3: Test Everything

### 3.1 Test Backend (Replit)

Visit: `https://your-replit-url.replit.app/api/clients`

You should see: `[]` or list of clients (JSON)

### 3.2 Test Frontend (Vercel)

Visit your Vercel URL (shown after deployment)

Try:
- ✅ Adding a new client
- ✅ Searching clients
- ✅ Viewing dashboard
- ✅ All features should work!

---

## How It Works

```
User Browser
    ↓
Vercel (Frontend - HTML/CSS/JS)
    ↓ API calls to /api/*
Replit (Backend - Express API)
    ↓ Database queries
Firebase Firestore
```

**Benefits:**
- ✅ Fast frontend (Vercel CDN)
- ✅ Reliable backend (Replit always-on)
- ✅ Scalable database (Firebase)
- ✅ Free tiers available for all!

---

## Costs

- **Replit:** Free tier available, or ~$7/month for always-on
- **Vercel:** Free tier (100GB bandwidth/month)
- **Firebase:** Free tier (50k reads, 20k writes per day)

**Total:** Can be $0/month on free tiers!

---

## Troubleshooting

### Frontend loads but shows "Failed to fetch"
- Check that Replit backend is running
- Verify the Replit URL in `vercel.json` is correct
- Make sure Firebase credentials are in Replit Secrets

### CORS errors
- Already configured! Should work automatically
- If issues persist, check browser console

### Backend not responding
- Make sure Replit app is deployed (not just running)
- Check Replit logs for errors
- Verify Firebase credentials are set

---

## Next Steps

1. ✅ Deploy backend to Replit (get URL)
2. ✅ Update `vercel.json` with Replit URL
3. ✅ Push to GitHub
4. ✅ Deploy to Vercel
5. 🎉 Your app is live!

