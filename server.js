const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const qs = require('qs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
});

// TikTok API configuration
const TIKTOK_SANDBOX = process.env.TIKTOK_SANDBOX === 'true';
const TIKTOK_CONFIG = {
  clientKey: process.env.TIKTOK_CLIENT_KEY,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET,
  redirectUri: process.env.TIKTOK_REDIRECT_URI,
  apiBaseUrl: process.env.TIKTOK_API_BASE_URL || (TIKTOK_SANDBOX ? 'https://open-sandbox.tiktokapis.com' : 'https://open.tiktokapis.com'),
  authorizationUrl: 'https://www.tiktok.com/v2/auth/authorize/',
  sandbox: TIKTOK_SANDBOX,
};

// OAuth state store (temporary, valid for 10 minutes)
const oauthStateStore = {};
const OAUTH_STATE_TTL = 10 * 60 * 1000; // 10 minutes

function storeOAuthState(state) {
  oauthStateStore[state] = {
    createdAt: Date.now(),
  };
  console.log(`💾 OAuth state stored: ${state}`);
}

function validateOAuthState(state) {
  const stateData = oauthStateStore[state];
  if (!stateData) {
    console.log(`❌ OAuth state not found: ${state}`);
    return false;
  }

  const age = Date.now() - stateData.createdAt;
  if (age > OAUTH_STATE_TTL) {
    console.log(`❌ OAuth state expired: ${state} (age: ${age}ms)`);
    delete oauthStateStore[state];
    return false;
  }

  delete oauthStateStore[state];
  console.log(`✅ OAuth state validated and cleared: ${state}`);
  return true;
}

// ============================================
// OAUTH ENDPOINTS
// ============================================

// 1. Generate authorization URL
app.get('/api/tiktok/auth-url', (req, res) => {
  const scope = ['user.info.basic', 'video.upload', 'video.publish'];
  const state = Math.random().toString(36).substring(7);

  // Store state in memory store (works across instances)
  storeOAuthState(state);

  const authUrl = new URL(TIKTOK_CONFIG.authorizationUrl);
  authUrl.searchParams.append('client_key', TIKTOK_CONFIG.clientKey);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scope.join(','));
  authUrl.searchParams.append('redirect_uri', TIKTOK_CONFIG.redirectUri);
  authUrl.searchParams.append('state', state);

  const authUrlString = authUrl.toString();
  console.log('🔐 OAuth Auth URL Generated:');
  console.log(`   Client Key: ${TIKTOK_CONFIG.clientKey}`);
  console.log(`   Redirect URI: ${TIKTOK_CONFIG.redirectUri}`);
  console.log(`   State: ${state}`);
  console.log(`   Auth URL: ${authUrlString}`);

  res.json({ authUrl: authUrlString });
});

// 2. OAuth callback handler (GET - TikTok redirects here)
app.get('/api/tiktok/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    console.log('🔄 OAuth Callback Received:');
    console.log(`   URL: ${req.originalUrl}`);
    console.log(`   Code: ${code ? 'present' : 'missing'}`);
    console.log(`   State: ${state ? 'present' : 'missing'}`);
    if (error) console.log(`   Error: ${error}`);
    if (error_description) console.log(`   Error Description: ${error_description}`);

    // Check for TikTok error
    if (error) {
      const errorMsg = error_description || error;
      console.log(`❌ OAuth Error from TikTok: ${errorMsg}`);
      return res.redirect('/login.html?error=' + encodeURIComponent(errorMsg));
    }

    // Validate code and state
    if (!code || !state) {
      console.log(`❌ Missing parameters: code=${code ? 'yes' : 'no'}, state=${state ? 'yes' : 'no'}`);
      return res.redirect('/login.html?error=missing_parameters');
    }

    // Validate state (CSRF protection) using memory store
    if (!validateOAuthState(state)) {
      console.log(`❌ State validation failed for: ${state}`);
      return res.redirect('/login.html?error=invalid_state');
    }

    // Exchange code for access token
    console.log('🔑 Exchanging code for access token...');
    console.log(`   API Base URL: ${TIKTOK_CONFIG.apiBaseUrl}`);
    console.log(`   Token endpoint: ${TIKTOK_CONFIG.apiBaseUrl}/v2/oauth/token/`);

    const tokenUrl = `${TIKTOK_CONFIG.apiBaseUrl}/v2/oauth/token/`;
    let tokenResponse;

    try {
      tokenResponse = await axios.post(tokenUrl,
        qs.stringify({
          client_key: TIKTOK_CONFIG.clientKey,
          client_secret: TIKTOK_CONFIG.clientSecret,
          code,
          grant_type: 'authorization_code',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );
    } catch (axiosError) {
      console.error('❌ Axios error details:');
      console.error(`   Code: ${axiosError.code}`);
      console.error(`   Message: ${axiosError.message}`);
      if (axiosError.response) {
        console.error(`   Status: ${axiosError.response.status}`);
        console.error(`   Data: ${JSON.stringify(axiosError.response.data)}`);
      }
      throw axiosError;
    }

    console.log('✅ Access token received');
    console.log(`   Full response: ${JSON.stringify(tokenResponse.data)}`);

    // Handle both nested and flat response formats
    const tokenData = tokenResponse.data.data || tokenResponse.data;
    const { access_token, refresh_token, expires_in, open_id } = tokenData;

    console.log(`   Token length: ${access_token ? access_token.length : 0} chars`);
    console.log(`   Expires in: ${expires_in} seconds`);
    console.log(`   Open ID: ${open_id}`);

    // Get user info
    console.log('👤 Fetching user information...');
    const userInfoUrl = `${TIKTOK_CONFIG.apiBaseUrl}/v2/user/info/?fields=open_id,union_id,avatar_url,display_name`;
    console.log(`   Endpoint: ${userInfoUrl}`);
    console.log(`   Authorization header: Bearer ${access_token ? access_token.substring(0, 20) + '...' : 'MISSING'}`);

    const userResponse = await axios.get(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userData = userResponse.data.data;
    console.log(`✅ User info retrieved: ${userData.display_name}`);

    // Store in session
    req.session.user = {
      openId: open_id,
      displayName: userData.display_name,
      avatarUrl: userData.avatar_url,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };

    console.log('🎉 OAuth flow completed successfully');

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('/login.html?error=session_save_failed');
      }

      // Redirect to dashboard after successful authentication
      res.redirect('/dashboard.html');
    });
  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    res.redirect('/login.html?error=' + encodeURIComponent(error.response?.data?.error_description || error.message));
  }
});

// 3. Get current user info
app.get('/api/tiktok/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({ user: req.session.user });
});

// 4. Logout
app.post('/api/tiktok/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// ============================================
// VIDEO UPLOAD & PUBLISH ENDPOINTS
// ============================================

// 1. Upload video as draft (video.upload)
app.post('/api/tiktok/upload-draft', upload.single('video'), async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { caption } = req.body;
    const videoFile = req.file;

    if (!videoFile) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Check token expiration and refresh if needed
    await refreshTokenIfNeeded(req.session);

    // Initialize video upload
    const initUploadResponse = await axios.post(
      `${TIKTOK_CONFIG.apiBaseUrl}/v1/video/upload/init/`,
      {
        source_info: {
          source: 'FILE_UPLOAD',
          chunk_size: fs.statSync(videoFile.path).size,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${req.session.user.accessToken}`,
        },
      }
    );

    const uploadToken = initUploadResponse.data.data.upload_token;

    // Upload video chunks
    const videoBuffer = fs.readFileSync(videoFile.path);
    const chunkUploadResponse = await axios.post(
      `${TIKTOK_CONFIG.apiBaseUrl}/v1/video/upload/parts/`,
      videoBuffer,
      {
        headers: {
          Authorization: `Bearer ${req.session.user.accessToken}`,
          'Content-Type': 'video/mp4',
        },
        params: {
          upload_token: uploadToken,
          part_number: 1,
        },
      }
    );

    // Finalize upload
    const finalizeResponse = await axios.post(
      `${TIKTOK_CONFIG.apiBaseUrl}/v1/video/upload/finish/`,
      {
        upload_token: uploadToken,
        publish_type: 'DRAFT', // Upload as draft
        description: caption || '',
      },
      {
        headers: {
          Authorization: `Bearer ${req.session.user.accessToken}`,
        },
      }
    );

    // Clean up uploaded file
    fs.unlinkSync(videoFile.path);

    res.json({
      success: true,
      message: 'Video uploaded as draft',
      data: finalizeResponse.data.data,
    });
  } catch (error) {
    console.error('Upload draft error:', error.response?.data || error.message);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      error: 'Upload failed',
      details: error.response?.data || error.message,
    });
  }
});

// 2. Publish video directly (video.publish)
app.post('/api/tiktok/publish', upload.single('video'), async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { caption, hashtags } = req.body;
    const videoFile = req.file;

    if (!videoFile) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Check token expiration and refresh if needed
    await refreshTokenIfNeeded(req.session);

    // Initialize video upload
    const initUploadResponse = await axios.post(
      `${TIKTOK_CONFIG.apiBaseUrl}/v1/video/upload/init/`,
      {
        source_info: {
          source: 'FILE_UPLOAD',
          chunk_size: fs.statSync(videoFile.path).size,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${req.session.user.accessToken}`,
        },
      }
    );

    const uploadToken = initUploadResponse.data.data.upload_token;

    // Upload video chunks
    const videoBuffer = fs.readFileSync(videoFile.path);
    await axios.post(
      `${TIKTOK_CONFIG.apiBaseUrl}/v1/video/upload/parts/`,
      videoBuffer,
      {
        headers: {
          Authorization: `Bearer ${req.session.user.accessToken}`,
          'Content-Type': 'video/mp4',
        },
        params: {
          upload_token: uploadToken,
          part_number: 1,
        },
      }
    );

    // Finalize upload and publish
    const description = caption + (hashtags ? ' ' + hashtags : '');
    const publishResponse = await axios.post(
      `${TIKTOK_CONFIG.apiBaseUrl}/v1/video/upload/finish/`,
      {
        upload_token: uploadToken,
        publish_type: 'PUBLISH_IMMEDIATELY', // Publish directly
        description: description || '',
      },
      {
        headers: {
          Authorization: `Bearer ${req.session.user.accessToken}`,
        },
      }
    );

    // Clean up uploaded file
    fs.unlinkSync(videoFile.path);

    res.json({
      success: true,
      message: 'Video published successfully',
      data: publishResponse.data.data,
    });
  } catch (error) {
    console.error('Publish error:', error.response?.data || error.message);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      error: 'Publication failed',
      details: error.response?.data || error.message,
    });
  }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

async function refreshTokenIfNeeded(session) {
  if (!session.user) return;

  const now = new Date();
  const expiresAt = new Date(session.user.expiresAt);

  // Refresh if token expires in less than 5 minutes
  if (now.getTime() > expiresAt.getTime() - 5 * 60 * 1000) {
    try {
      const refreshResponse = await axios.post(
        `${TIKTOK_CONFIG.apiBaseUrl}/v2/oauth/token/`,
        qs.stringify({
          client_key: TIKTOK_CONFIG.clientKey,
          client_secret: TIKTOK_CONFIG.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: session.user.refreshToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in } = refreshResponse.data;

      session.user.accessToken = access_token;
      session.user.refreshToken = refresh_token;
      session.user.expiresAt = new Date(Date.now() + expires_in * 1000);
      session.save();
    } catch (error) {
      console.error('Token refresh failed:', error.message);
      throw new Error('Token refresh failed');
    }
  }
}

// ============================================
// HEALTH CHECK & DIAGNOSTICS
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Network connectivity test
app.get('/api/test-tiktok-connection', async (req, res) => {
  try {
    console.log(`🔍 Testing connection to: ${TIKTOK_CONFIG.apiBaseUrl}`);

    const testUrl = `${TIKTOK_CONFIG.apiBaseUrl}/v2/oauth/token/`;
    const response = await axios.post(testUrl, {
      client_key: 'test',
      client_secret: 'test',
      grant_type: 'authorization_code',
    }, {
      timeout: 5000,
    });

    res.json({
      status: 'connected',
      endpoint: testUrl,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    res.status(500).json({
      status: 'disconnected',
      error: error.message,
      endpoint: `${TIKTOK_CONFIG.apiBaseUrl}/v2/oauth/token/`,
      code: error.code,
      timestamp: new Date()
    });
  }
});

// Serve static files
app.use(express.static('./'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TikTok Video Publishing Backend`);
  console.log(`📍 Running on ${APP_URL}`);
  console.log(`🔐 TikTok OAuth configured`);
  console.log(`${TIKTOK_SANDBOX ? '🧪 MODE: SANDBOX' : '🌐 MODE: PRODUCTION'}`);
  console.log(`🌐 API Base URL: ${TIKTOK_CONFIG.apiBaseUrl}`);
  console.log(`📤 Upload endpoint: POST /api/tiktok/upload-draft`);
  console.log(`🚀 Publish endpoint: POST /api/tiktok/publish`);
});

module.exports = app;
