# TikTok OAuth Quick Fix Guide

## 🚀 5-Minute Troubleshooting

If you're getting a **404 error** when trying to login with TikTok, follow these steps:

### Step 1: Verify Environment Variables (30 seconds)

Check your `.env` file contains these exactly:
```env
TIKTOK_CLIENT_KEY=sbawom3osgvtdcjh12
TIKTOK_CLIENT_SECRET=JC19bDo5UrBFpti0xLyIyXCxP5PHkYSM
TIKTOK_REDIRECT_URI=https://vid.relampagodeofertas.shop/api/tiktok/callback
TIKTOK_API_BASE_URL=https://open.tiktokapis.com
```

**No typos or extra spaces!**

### Step 2: Verify TikTok Portal (2 minutes)

1. Go to https://developer.tiktok.com/apps
2. Select your app
3. Check these boxes:
   - [ ] App Status: **ACTIVE**
   - [ ] Redirect URLs contains: `https://vid.relampagodeofertas.shop/api/tiktok/callback`
   - [ ] Permissions > user.info.basic: **ENABLED**
   - [ ] Permissions > video.upload: **ENABLED**
   - [ ] Permissions > video.publish: **ENABLED**

**If Redirect URL is missing:**
- Click "Add Redirect URL"
- Paste: `https://vid.relampagodeofertas.shop/api/tiktok/callback`
- Save
- Wait 1-2 minutes

### Step 3: Restart & Test (1 minute)

1. Redeploy on EasyPanel (or restart container locally)
2. Wait for backend to start (~30 seconds)
3. Visit https://vid.relampagodeofertas.shop/login.html
4. Click "Login with TikTok"
5. You should see TikTok's OAuth authorization page (not 404)

---

## ✅ If It Works

Congratulations! Now test the full flows:

1. **Test Draft Upload**
   - Login successfully
   - Click "Send as Draft"
   - Upload a test video
   - Check your TikTok account for the draft video

2. **Test Direct Publish**
   - Logout and login again
   - Click "Publish Directly"
   - Upload a test video
   - Check your TikTok account for the published video

3. **Record Demonstration**
   - Show the login flow
   - Show draft upload
   - Show direct publish
   - Document all three OAuth scopes in action

---

## ❌ If It Still Doesn't Work

### Quick Diagnostics

Run this to check your configuration:
```bash
bash OAUTH_VALIDATION.sh
```

### Check Backend Logs

On EasyPanel, go to Logs and look for:
```
🔐 OAuth Auth URL Generated
```

If you see this, your backend is working correctly. The issue is likely with TikTok Portal configuration.

### Common Fixes

| Problem | Solution |
|---------|----------|
| Redirect URL not in Portal | Add it: `https://vid.relampagodeofertas.shop/api/tiktok/callback` |
| Still shows 404 | Wait 2-3 minutes for TikTok's cache to update, then retry |
| Scopes not working | Enable all three in Permissions section |
| App is "In Review" | Contact TikTok support - OAuth won't work until approved |
| Different domain name | Update both `.env` AND TikTok Portal to match |

---

## 📖 Full Documentation

For detailed troubleshooting, see:

- **OAUTH_TROUBLESHOOTING.md** - Step-by-step diagnosis
- **OAUTH_VALIDATION.sh** - Automated configuration check
- **OAUTH_ADVANCED_TROUBLESHOOTING.md** - Complex scenarios
- **DOCKER_SETUP.md** - Docker/EasyPanel deployment guide
- **ENVIRONMENT_SETUP.md** - Environment variable documentation

---

## 🆘 Still Stuck?

1. **Check logs** for `🔐 OAuth Auth URL Generated` message
2. **Verify exact values** match between .env and TikTok Portal
3. **Wait 2-3 minutes** after making changes in TikTok Portal
4. **Restart container** after changing .env variables
5. **Clear browser cache** (Ctrl+Shift+Delete) - TikTok portal might be cached
6. **Try incognito mode** - rules out browser extensions/cache issues

---

## 📝 Verification Checklist

Before declaring OAuth "working":

- [ ] Backend logs show: `🔐 OAuth Auth URL Generated`
- [ ] OAuth redirects to TikTok login page (NOT 404)
- [ ] TikTok login page asks for username/password
- [ ] After login, redirects back to dashboard
- [ ] Dashboard shows: "Logged in as: [Your TikTok Name]"
- [ ] Logout button appears and works
- [ ] Can login again successfully

---

## 🎯 Next Phase: Video Upload

Once OAuth is working:

```
OAUTH WORKS ✓
    ↓
TEST DRAFT UPLOAD → Check TikTok account for draft
    ↓
TEST DIRECT PUBLISH → Check TikTok account for published video
    ↓
RECORD DEMO VIDEO → Show all flows working
    ↓
SUBMIT TO TIKTOK → For final review
```

Each upload endpoint logs its status. Check backend logs for:
- `📤 Draft upload started`
- `📤 Direct publish started`
- `✅ Video published successfully`

---

## 💡 Pro Tips

1. **Bookmark these URLs:**
   - TikTok Developer Portal: https://developer.tiktok.com/
   - Your App Settings: https://developer.tiktok.com/apps
   - Login Test: https://vid.relampagodeofertas.shop/login.html

2. **Use browser console for testing:**
   ```javascript
   // Test the OAuth URL generation
   fetch('/api/tiktok/auth-url').then(r => r.json()).then(d => console.log(d.authUrl))
   ```

3. **Monitor logs while testing:**
   ```bash
   docker-compose logs -f app
   ```

4. **Keep .env safe:**
   - Never share client secret
   - Add .env to .gitignore (already done)
   - Use EasyPanel environment variables for production

---

**Success Rate: If you follow steps 1-3 correctly, OAuth should work 95% of the time.**

The remaining 5% are usually sandbox/production configuration issues requiring TikTok support assistance.
