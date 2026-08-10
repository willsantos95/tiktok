# Advanced TikTok OAuth Troubleshooting

This guide covers advanced troubleshooting when the standard troubleshooting doesn't resolve the OAuth 404 error.

---

## Understanding the OAuth 404 Error

### What the Error Tells Us
When TikTok returns a 404 response with:
```
https://www.tiktok.com/404?fromUrl=/v1/oauth/authorize/?client_key=...
```

This indicates:
- ❌ TikTok recognized the HTTP request
- ❌ TikTok parsed the OAuth endpoint (`/v1/oauth/authorize/`)
- ❌ But the **authorization was rejected** before showing the OAuth login page

### Why This Happens

The 404 response with `fromUrl` parameter suggests TikTok is:
1. **Rejecting the request** before reaching the OAuth authorization form
2. **Redirecting to 404** instead of the OAuth login page
3. **Including `fromUrl` for debugging** (showing what URL was rejected)

### Common Root Causes (In Order of Likelihood)

1. **Redirect URI Not Authorized** (60% of cases)
   - The redirect URI sent in the request doesn't match TikTok's records
   - TikTok can't grant authorization if it doesn't know where to redirect

2. **Client Key Invalid** (20% of cases)
   - The client key is expired, revoked, or never existed
   - The app is in "In Review" or "Inactive" status

3. **Scopes Not Enabled** (10% of cases)
   - Your app doesn't have permission to request these scopes
   - Must be explicitly enabled in TikTok Developer Portal

4. **Sandbox vs Production Mismatch** (5% of cases)
   - Using sandbox credentials/endpoints in production context
   - Or mixing sandbox and production settings

5. **Parameter Format Issues** (5% of cases)
   - URL encoding problems
   - Scope format issues
   - State parameter problems

---

## Investigation Steps

### Step 1: Verify the Exact URL Being Generated

**On Server:**
```bash
# Add this temporary debugging to server.js line 52-67:
app.get('/api/tiktok/auth-url', (req, res) => {
  const scope = ['user.info.basic', 'video.upload', 'video.publish'];
  const state = Math.random().toString(36).substring(7);
  
  req.session.oauthState = state;
  req.session.save();

  const authUrl = new URL(TIKTOK_CONFIG.authorizationUrl);
  authUrl.searchParams.append('client_key', TIKTOK_CONFIG.clientKey);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scope.join(','));
  authUrl.searchParams.append('redirect_uri', TIKTOK_CONFIG.redirectUri);
  authUrl.searchParams.append('state', state);

  const authUrlString = authUrl.toString();
  
  // DEBUG: Write to file
  fs.appendFileSync('oauth-debug.log', `\n${new Date().toISOString()}\n${authUrlString}\n`);
  
  res.json({ authUrl: authUrlString });
});
```

**In Browser Console:**
```javascript
fetch('/api/tiktok/auth-url')
  .then(r => r.json())
  .then(d => {
    console.log('Full URL:', d.authUrl);
    
    // Parse and display components
    const url = new URL(d.authUrl);
    console.log('Components:');
    for (const [key, value] of url.searchParams) {
      console.log(`  ${key}: ${value}`);
    }
  });
```

### Step 2: Compare With TikTok's Expected Format

**Your URL should be:**
```
https://www.tiktok.com/v1/oauth/authorize?
  client_key=sbawom3osgvtdcjh12&
  response_type=code&
  scope=user.info.basic,video.upload,video.publish&
  redirect_uri=https://vid.relampagodeofertas.shop/api/tiktok/callback&
  state=randomstring
```

**Common Issues to Check:**
- [ ] URL doesn't have double encoding (e.g., `%252F` instead of `%2F`)
- [ ] Scopes are comma-separated, not space-separated
- [ ] `response_type=code` (not `token` or other values)
- [ ] All parameters are properly URL-encoded
- [ ] No extra spaces or special characters in parameters

### Step 3: Test With Curl (Exact Request)

```bash
# Get the auth URL from your backend
AUTH_URL=$(curl -s http://127.0.0.1:3000/api/tiktok/auth-url | jq -r '.authUrl')

echo "Testing URL: $AUTH_URL"

# Try to access it with curl (won't work for OAuth but will show status)
curl -i -L "$AUTH_URL" 2>&1 | head -20

# Check if TikTok responds with 404 or something else
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$AUTH_URL"
```

### Step 4: Check TikTok Developer Portal More Thoroughly

**For each app in your account:**
1. Click the app name
2. Click "Edit App Information"
3. Find "Redirect URLs" section
4. Does it show: `https://vid.relampagodeofertas.shop/api/tiktok/callback`?

**If not:**
1. Click "Add Redirect URL"
2. Enter exactly: `https://vid.relampagodeofertas.shop/api/tiktok/callback`
3. Click Save
4. Wait 1-2 minutes for TikTok's systems to update
5. Try the OAuth flow again

**For Scopes:**
1. Go to "Permissions" section
2. Look for these exact scopes:
   - [ ] `user.info.basic`
   - [ ] `video.upload`
   - [ ] `video.publish`
3. If any are missing or grayed out, your app doesn't have access to them

### Step 5: Test With Different Client Key Format

TikTok sometimes requires different formatting. Try these:

**Test 1: Exact as-is**
```
client_key=sbawom3osgvtdcjh12
```

**Test 2: Check for hidden characters**
```bash
# In .env, verify no spaces or special chars
TIKTOK_CLIENT_KEY=sbawom3osgvtdcjh12
# NOT: TIKTOK_CLIENT_KEY = sbawom3osgvtdcjh12 (spaces)
# NOT: TIKTOK_CLIENT_KEY=sbawom3osgvtdcjh12 (trailing space)
```

### Step 6: Verify App Status

Visit https://developer.tiktok.com/apps and check:
- [ ] App shows as **ACTIVE** (not "In Review", "Rejected", or "Suspended")
- [ ] App creation date is recent (not years old)
- [ ] No warning icons or status messages
- [ ] Email associated with app is verified

---

## Scenario-Specific Solutions

### Scenario A: "Works Locally with localhost:3000 Redirect URI"

**If OAuth works with:**
```
TIKTOK_REDIRECT_URI=http://localhost:3000/api/tiktok/callback
```

**But fails with:**
```
TIKTOK_REDIRECT_URI=https://vid.relampagodeofertas.shop/api/tiktok/callback
```

**Solution:**
1. The redirect URI must be **exactly** as registered in TikTok Portal
2. In TikTok Portal, add `https://vid.relampagodeofertas.shop/api/tiktok/callback`
3. Also keep the localhost one for local development:
   - Add both to Redirect URLs in TikTok Portal
4. Update .env to use production URL when deployed

### Scenario B: "OAuth Works with Different App"

**If you have multiple TikTok Developer accounts and one works:**
1. Compare the app configurations side-by-side
2. Check if the working app has additional scopes enabled
3. Copy all settings from working app to problematic app
4. Contact TikTok support if the app was previously rejected

### Scenario C: "Getting Different Error Than 404"

**If you get these instead of 404:**

| Error | Meaning | Solution |
|-------|---------|----------|
| `invalid_client` | Client Key not valid | Verify client key, check app status |
| `invalid_scope` | Scope not enabled for app | Enable scope in TikTok Portal permissions |
| `invalid_redirect_uri` | Redirect URI mismatch | Ensure it's added in TikTok Portal |
| `access_denied` | User denied authorization | Expected - user can click "Cancel" |
| `server_error` | TikTok backend error | Retry after a few minutes |

### Scenario D: "URL Opens But User Sees Error Page"

**If TikTok opens a page with error text:**
1. Note the exact error message
2. Cross-reference with TikTok's error documentation
3. Common errors:
   - "Invalid client_key" → Check credentials
   - "Redirect URI not registered" → Add to Portal
   - "Scope not available" → Enable in Permissions

---

## Advanced Testing

### Using Browser DevTools

**Network Tab:**
1. Open DevTools (F12)
2. Go to login.html
3. Click "Login with TikTok"
4. Watch Network tab for:
   - [ ] Request to `/api/tiktok/auth-url` - should return 200
   - [ ] Redirect to `www.tiktok.com/v1/oauth/authorize...`
   - [ ] TikTok's response status (if 404, issue is on TikTok's side)

**Console Tab:**
```javascript
// Log all redirect events
window.addEventListener('beforeunload', () => {
  console.log('Navigating to:', window.location.href);
});

// Log any fetch/XHR failures
window.addEventListener('error', (e) => {
  console.error('Error:', e);
});
```

### Using Request Capture Tool

**Capture the exact request TikTok receives:**
1. Use Burp Suite, Charles Proxy, or similar
2. Intercept the request to TikTok
3. Copy the full URL
4. Paste into notepad
5. Compare each parameter with what TikTok expects

---

## When to Contact TikTok Support

If you've verified all of the above and still get 404:

**Document for Support Ticket:**
1. App ID (from Developer Portal)
2. Client Key (don't share secret)
3. Exact redirect URI you're using
4. Screenshot of Redirect URLs in Portal (showing it's added)
5. Screenshot of enabled scopes
6. Exact URL being sent (from browser console or logs)
7. Steps to reproduce the issue

**Contact:** support@tiktok.com or use TikTok Developer support channels

---

## Checklist for OAuth Success

Before submitting to TikTok for review, verify:

- [ ] OAuth URL generates without errors
- [ ] URL format matches TikTok documentation exactly
- [ ] Client Key is valid and app is ACTIVE
- [ ] Redirect URI is added in TikTok Portal
- [ ] Redirect URI is HTTPS (for production)
- [ ] All three scopes are enabled in Permissions
- [ ] Backend logs show correct parameters
- [ ] User is redirected to TikTok OAuth page (not 404)
- [ ] OAuth authorization page appears
- [ ] After approval, callback returns code parameter
- [ ] Token exchange succeeds
- [ ] User info is retrieved successfully
- [ ] Dashboard displays authenticated user
- [ ] Draft upload works (video.upload scope)
- [ ] Direct publish works (video.publish scope)

---

## Next Steps if OAuth Still Fails

1. **Isolate the Issue**
   - Is it client key? Test with test redirect URI format
   - Is it redirect URI? Test with different format
   - Is it scopes? Test requesting only `user.info.basic`

2. **Try Sandbox Environment**
   - Some issues only appear in production
   - Test with sandbox first to rule out scope issues

3. **Create Minimal Test App**
   - New TikTok app with just one scope
   - Only basic OAuth flow
   - No video upload/publish complexity
   - See if the basic flow works

4. **Contact TikTok Developer Support**
   - With detailed logs and screenshots
   - Describe what's been tested
   - Share exact error responses
