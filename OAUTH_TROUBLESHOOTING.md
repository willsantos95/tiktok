# TikTok OAuth 404 Troubleshooting Guide

## Problem: OAuth 404 Error

When attempting to log in via TikTok, the browser is redirected to:
```
https://www.tiktok.com/404?fromUrl=/v1/oauth/authorize/?client_key=sbawom3osgvtdcjh12&...
```

This indicates TikTok's servers are not recognizing the OAuth authorization request.

---

## Step 1: Verify Backend OAuth URL Generation

### Test the Auth URL Endpoint

Open browser console and run:
```javascript
fetch('/api/tiktok/auth-url')
  .then(r => r.json())
  .then(d => {
    console.log('OAuth URL:', d.authUrl);
    console.log('Copy and paste to verify format');
  });
```

### Check Server Logs

When you test the login, check Docker/EasyPanel logs for:
```
🔐 OAuth Auth URL Generated:
   Client Key: sbawom3osgvtdcjh12
   Redirect URI: https://vid.relampagodeofertas.shop/api/tiktok/callback
   Auth URL: https://www.tiktok.com/v1/oauth/authorize?client_key=sbawom3osgvtdcjh12&response_type=code&scope=user.info.basic%2Cvideo.upload%2Cvideo.publish&redirect_uri=https%3A%2F%2Fvid.relampagodeofertas.shop%2Fapi%2Ftiktok%2Fcallback&state=...
```

**Verify these are correct:**
- ✅ Authorization URL: `https://www.tiktok.com/v1/oauth/authorize` (no trailing slash)
- ✅ `client_key` matches your TikTok app credentials
- ✅ `redirect_uri` matches the authorized redirect URL in TikTok Developer Portal
- ✅ `scope` includes all three scopes: `user.info.basic`, `video.upload`, `video.publish`

---

## Step 2: Verify TikTok Developer Portal Configuration

### Access Your App Settings
1. Go to https://developer.tiktok.com/apps
2. Select your application
3. Verify these settings:

#### ✅ App Status
- [ ] App status is **ACTIVE** (not In Review or Inactive)
- [ ] App type is **Server-side Application** (for OAuth)

#### ✅ Credentials
- [ ] **Client Key**: `sbawom3osgvtdcjh12` (must match exactly)
- [ ] **Client Secret**: `JC19bDo5UrBFpti0xLyIyXCxP5PHkYSM` (must match exactly)
- [ ] Credentials are for **Production** (not Sandbox)

#### ✅ OAuth Settings
1. Click on "Basic Information"
2. Scroll to "OAuth Settings"
3. Verify **Redirect URLs**:
   - [ ] `https://vid.relampagodeofertas.shop/api/tiktok/callback` is in the list
   - [ ] No typos in the domain name
   - [ ] Protocol is `https://` (not `http://`)

#### ✅ Scopes
1. Click on "Permissions"
2. Verify these scopes are **ENABLED**:
   - [ ] `user.info.basic` ✓
   - [ ] `video.upload` ✓
   - [ ] `video.publish` ✓

---

## Step 3: Common Issues & Solutions

### Issue 1: Redirect URI Not Authorized
**Symptom**: 404 error, `fromUrl` parameter in response
**Cause**: The redirect URI in TikTok Portal doesn't match what's being sent
**Solution**:
1. In TikTok Developer Portal, add exact URL: `https://vid.relampagodeofertas.shop/api/tiktok/callback`
2. Check your `.env` file:
   ```
   TIKTOK_REDIRECT_URI=https://vid.relampagodeofertas.shop/api/tiktok/callback
   ```
3. Restart the container

### Issue 2: Client Key Invalid or Not Authorized
**Symptom**: 404 error, app credentials not recognized
**Cause**: Client Key mismatch or app not approved
**Solution**:
1. Copy exact Client Key from TikTok Portal (no spaces)
2. In `.env`:
   ```
   TIKTOK_CLIENT_KEY=sbawom3osgvtdcjh12
   ```
3. Verify app status is ACTIVE
4. Verify scopes are enabled for your app

### Issue 3: App in Sandbox Mode
**Symptom**: Works locally but fails in production
**Cause**: Using sandbox credentials without enabling sandbox mode
**Solution**:
```env
# For Sandbox (testing)
TIKTOK_SANDBOX=true
TIKTOK_API_BASE_URL=https://open-sandbox.tiktokapis.com

# For Production (live)
TIKTOK_SANDBOX=false
TIKTOK_API_BASE_URL=https://open.tiktokapis.com
```

### Issue 4: HTTPS Required
**Symptom**: OAuth works locally but fails in production
**Cause**: Redirect URI requires HTTPS, not HTTP
**Solution**:
- Redirect URI must use: `https://vid.relampagodeofertas.shop/...`
- Not: `http://vid.relampagodeofertas.shop/...`

---

## Step 4: Test the OAuth Flow

### Option A: Test via Console
```javascript
// 1. Get the OAuth URL
fetch('/api/tiktok/auth-url')
  .then(r => r.json())
  .then(d => {
    console.log('Full OAuth URL:', d.authUrl);
    // Copy and open in browser
    window.location.href = d.authUrl;
  });
```

### Option B: Monitor Logs During Login
1. Start tailing logs: `docker-compose logs -f`
2. Click "Login with TikTok" on login.html
3. Watch for logs:
   ```
   🔐 OAuth Auth URL Generated:
      Client Key: sbawom3osgvtdcjh12
      Redirect URI: https://vid.relampagodeofertas.shop/api/tiktok/callback
      Auth URL: https://www.tiktok.com/v1/oauth/authorize?...
   ```
4. If TikTok denies, check browser URL for error parameter
5. If you get redirected back to /api/tiktok/callback, check logs for:
   ```
   🔄 OAuth Callback Received
   🔑 Exchanging code for access token...
   ✅ Access token received
   👤 Fetching user information...
   🎉 OAuth flow completed successfully
   ```

---

## Step 5: Debugging Checklist

- [ ] **Backend logs** show `OAuth Auth URL Generated` with correct client_key
- [ ] **Redirect URI** in TikTok Portal matches exactly: `https://vid.relampagodeofertas.shop/api/tiktok/callback`
- [ ] **App Status** in TikTok Portal is **ACTIVE**
- [ ] **All three scopes** are enabled: `user.info.basic`, `video.upload`, `video.publish`
- [ ] **Client Key** matches exactly in both TikTok Portal and `.env`
- [ ] **HTTPS** is being used, not HTTP
- [ ] **Environment variables** are loaded (restart container after changes)

---

## Step 6: If Still Not Working

### Collect Debug Information

Run this and share the output:
```bash
# Check backend is running and responding
curl http://127.0.0.1:3000/health

# Check OAuth URL generation
curl http://127.0.0.1:3000/api/tiktok/auth-url

# Check environment variables (from inside container)
# docker-compose exec app env | grep TIKTOK
```

### Verify Credentials Are Set
```bash
# Check if variables are in environment
echo "Client Key: $TIKTOK_CLIENT_KEY"
echo "Redirect URI: $TIKTOK_REDIRECT_URI"
echo "API Base URL: $TIKTOK_API_BASE_URL"
```

---

## Next Steps After OAuth Works

Once OAuth is working:

1. **Test Draft Upload** (video.upload scope)
   - Click "Send as Draft" on dashboard
   - Upload a video
   - Check TikTok account for video as draft

2. **Test Direct Publish** (video.publish scope)
   - Click "Publish Directly" on dashboard
   - Upload a video
   - Check TikTok account for published video

3. **Record Demonstration**
   - Show all three OAuth scopes in action
   - Document the complete flow
   - Submit to TikTok for review

---

## Support Resources

- TikTok OAuth Documentation: https://developers.tiktok.com/doc/web-api-intro/
- TikTok Developer Portal: https://developer.tiktok.com/
- Common OAuth Errors: Check TikTok docs for `error` parameter in callback
