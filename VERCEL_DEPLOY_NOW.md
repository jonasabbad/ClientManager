# Deploy to Vercel - Step by Step 🚀

Your application is ready for deployment! Follow these steps carefully.

---

## ⚠️ Before You Start

You need:
1. ✅ GitHub account (you have: jonasabbad/ClientManager)
2. ✅ Firebase project with Firestore enabled
3. ✅ Firebase service account JSON credentials

---

## Step 1: Push to GitHub (If Not Already Done)

Check if your latest code is on GitHub:

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

**If you get the credentials error again:**
- Click the GitHub URL from the error to "Allow this secret"
- Then push again
- We'll rotate the credentials after deployment

---

## Step 2: Get Firebase Credentials

### A. If You Already Have Firebase Set Up:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open your project: `customer-management-34f78`
3. Click the **gear icon ⚙️** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **"Generate new private key"**
6. Click **"Generate key"** - A JSON file downloads
7. **Open the JSON file** and copy ALL the content

### B. If You Need to Create a New Firebase Project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name: `customer-management` (or anything you like)
4. Disable Google Analytics (optional)
5. Click **"Create project"**
6. Click **"Firestore Database"** in left menu
7. Click **"Create database"**
8. Choose **"Start in production mode"**
9. Select location: `us-central` (or closest to you)
10. Then follow steps from section A above

### C. Update Firestore Security Rules:

1. In Firestore, go to **"Rules"** tab
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

---

## Step 3: Deploy to Vercel

### A. Create Vercel Account

1. Go to [vercel.com](https://vercel.com/signup)
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your repositories

### B. Import Your Project

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find `ClientManager` repository
3. Click **"Import"**

### C. Configure Project Settings

**Framework Preset:** Vite (or Other)
**Root Directory:** `./` (default)
**Build Command:** Leave default or use: `npm run build`
**Output Directory:** `dist/public`
**Install Command:** `npm install`

### D. Add Environment Variables (MOST IMPORTANT!)

Click **"Environment Variables"** section:

**Variable 1 (REQUIRED):**
- **Key:** `FIREBASE_SERVICE_ACCOUNT`
- **Value:** Paste the ENTIRE Firebase JSON you copied in Step 2
  
  It should look like:
  ```json
  {"type":"service_account","project_id":"customer-management-34f78","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@customer-management-34f78.iam.gserviceaccount.com",...}
  ```

**Variable 2 (Optional):**
- **Key:** `NODE_ENV`
- **Value:** `production`

**Variable 3 (Optional):**
- **Key:** `SESSION_SECRET`
- **Value:** Any random string like: `my-secret-key-12345-change-this`

### E. Click Deploy!

1. Click **"Deploy"** button
2. Wait 2-4 minutes for build to complete
3. Vercel will show you the URL

---

## Step 4: Test Your Deployment

Once deployment completes, you'll get a URL like:
```
https://client-manager-xxx.vercel.app
```

### Test the API:
Visit: `https://your-url.vercel.app/api`

Should see:
```json
{"message":"API is running on Vercel","status":"ok"}
```

### Test the Frontend:
1. Visit: `https://your-url.vercel.app`
2. Try adding a client
3. Test search functionality
4. Check dashboard statistics

---

## Step 5: If Deployment Fails

### Check Build Logs:
1. In Vercel, go to your deployment
2. Click on the failed deployment
3. View **"Build Logs"**

### Common Issues:

**"Cannot find module 'firebase-admin'"**
- Make sure `api/package.json` exists in your repo
- Verify it's been pushed to GitHub

**"Build exceeded maximum duration"**
- This shouldn't happen with our setup
- Contact Vercel support if it does

**"Firebase error" or "Credential error"**
- Check `FIREBASE_SERVICE_ACCOUNT` environment variable
- Make sure you pasted the ENTIRE JSON
- Verify the JSON is valid (no missing braces)

### Check Function Logs:
1. Go to your Vercel project
2. Click **"Functions"** tab
3. View logs for `/api` endpoints
4. Look for errors

---

## Step 6: After Successful Deployment

### A. Secure Your Firebase Credentials

Since the old credentials were exposed in Git:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Go to **Project Settings** → **Service Accounts**
3. Find the old key and **delete it**
4. The one you used in Vercel is the new one - keep only that

### B. Update Firestore Rules (Production)

For better security, update rules to restrict access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for now (add auth later)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Later, implement proper authentication and rules.

### C. Add Custom Domain (Optional)

1. In Vercel project, go to **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain: `app.yourdomain.com`
4. Follow DNS instructions
5. Wait 5-30 minutes for DNS propagation

---

## 🎉 Success Checklist

- [ ] Code pushed to GitHub
- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] Firestore rules published
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] `FIREBASE_SERVICE_ACCOUNT` environment variable added
- [ ] Deployment completed successfully
- [ ] API endpoint working
- [ ] Frontend loading
- [ ] Can add/edit/delete clients
- [ ] Old Firebase credentials deleted

---

## 📊 Monitor Your App

### Vercel Analytics:
- Go to your project → **Analytics** tab
- See visitor stats, performance metrics

### Firebase Usage:
- Go to [Firebase Console](https://console.firebase.google.com/)
- Check **Usage** tab
- Monitor reads/writes/storage

### Free Tier Limits:
- **Vercel:** 100GB bandwidth/month
- **Firebase:** 50k reads, 20k writes, 20k deletes per day

---

## 🆘 Need Help?

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Firebase Docs:** [firebase.google.com/docs](https://firebase.google.com/docs)
- **Build Issues:** Check Vercel build logs
- **Runtime Issues:** Check Vercel function logs

---

## 🚀 You're Ready!

Follow the steps above, and your app will be live in minutes!

**Your deployment URL will be:**
`https://client-manager-[random].vercel.app`

Share it with anyone - it's live on the internet! 🌍
