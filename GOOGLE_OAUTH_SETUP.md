# Google OAuth Setup Guide - FIXED 403 ERROR

## 🔴 Current Issue: 403 Error When Signing Up with Google

The Google OAuth 403 error occurs because **the redirect URI in your Google Cloud Console doesn't match the callback URL**.

---

## ✅ SOLUTION: Add Correct Redirect URIs

### Step 1: Access Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**

### Step 2: Edit Your OAuth 2.0 Client
1. Find your OAuth 2.0 Client ID: `842802010074-5efijs7rfsjumeq7u40l3acg1orkec8e.apps.googleusercontent.com`
2. Click on it to edit
3. Scroll to **Authorized redirect URIs** section

### Step 3: Add ALL These Redirect URIs

**⚠️ IMPORTANT: Add EVERY URL below to fix the error**

```
http://localhost:3000/api/auth/callback/google
https://www.orchids.app/api/auth/callback/google
https://3000-65cb3727-1b5a-4683-bca2-892089d9818f.proxy.daytona.works/api/auth/callback/google
```

**How to Add:**
1. In the **Authorized redirect URIs** section, click **+ ADD URI**
2. Paste each URL one at a time
3. Click **+ ADD URI** again for the next URL
4. Repeat until all 3 URLs are added

### Step 4: Save and Wait
1. Click **SAVE** at the bottom of the page
2. **Wait 5-10 minutes** for Google to propagate the changes
3. Clear your browser cache
4. Try signing up with Google again

---

## 🧪 Testing After Setup

1. Go to `/register` page
2. Click **"Sign up with Google"** button
3. You should see Google's account selection screen
4. Select an account
5. You'll be redirected back to CareerHub at `/profile`

**Success!** Your account is now created with Google OAuth.

---

## 🔧 Current Configuration Status

Your environment variables are **already configured correctly**:

```
✅ GOOGLE_CLIENT_ID = 842802010074-5efijs7rfsjumeq7u40l3acg1orkec8e.apps.googleusercontent.com
✅ GOOGLE_CLIENT_SECRET = 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  
✅ BETTER_AUTH_URL = http://localhost:3000
✅ BETTER_AUTH_SECRET = [Configured]
```

**The backend is working.** Only Google Cloud Console needs the redirect URIs added.

---

## 🌐 Why Multiple Redirect URIs?

CareerHub is accessible through different URLs:
- `localhost:3000` - Local development
- `www.orchids.app` - Production domain
- `*.daytona.works` - Cloud development proxy

Google OAuth needs to know ALL possible callback URLs where users might return after authentication.

---

## 🆘 Still Getting 403 Error?

Try these steps:

**1. Verify Redirect URIs**
- Go back to Google Cloud Console
- Check that all 3 URIs are saved correctly
- Make sure they end with `/api/auth/callback/google`

**2. Wait for Propagation**
- Google needs 5-10 minutes to update
- Be patient after saving changes

**3. Clear Browser Data**
- Clear cookies and cache
- Try in incognito/private browsing mode
- Or use a different browser

**4. Check Current Proxy URL**
- Your proxy URL might have changed
- Check the current URL in your browser
- Add the new proxy URL if different

**5. Use Email Registration (Temporary)**
- Click "Or continue with email"
- All features work with email sign-up
- Google OAuth is optional

---

## 📧 Email Registration Works Now

While waiting for Google OAuth setup, users can:
- ✅ Create account with email/password
- ✅ Access all platform features
- ✅ Browse jobs and courses
- ✅ Use AI Career Advisor chatbot
- ✅ Build profiles and apply to jobs

**Google OAuth is just a convenience feature.** The platform is fully functional with email authentication.

---

## 🎯 Quick Reference

**What's Broken:** Google OAuth redirect URI mismatch  
**Where to Fix:** Google Cloud Console → APIs & Services → Credentials  
**What to Add:** 3 redirect URIs (listed above)  
**How Long:** 5-10 minutes after saving  
**Workaround:** Use email registration

---

## 📚 Additional Resources

- [Google OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Common OAuth Errors](https://developers.google.com/identity/protocols/oauth2/web-server#errors)

---

**Last Updated:** November 24, 2024  
**Status:** Configuration instructions provided, awaiting Google Cloud Console update