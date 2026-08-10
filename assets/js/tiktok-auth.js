// TikTok Authentication Handler

// Configuration - Replace with your actual TikTok API credentials
const TIKTOK_CONFIG = {
  CLIENT_ID: 'YOUR_CLIENT_ID',
  REDIRECT_URI: window.location.origin + '/dashboard.html',
  SCOPES: ['user.info.basic', 'video.upload', 'video.publish'],
  AUTHORIZE_URL: 'https://www.tiktok.com/v1/oauth/authorize/',
  TOKEN_URL: 'https://open.tiktokapis.com/v1/oauth/token/',
};

// Session Management
const TikTokAuth = {
  // Initialize authentication
  init() {
    this.checkAuthStatus();
    this.setupEventListeners();
  },

  // Setup event listeners
  setupEventListeners() {
    const loginBtn = document.getElementById('tiktok-login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');

    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.initiateLogin());
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.disconnect();
      });
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('tiktok_access_token');
  },

  // Get stored access token
  getAccessToken() {
    return localStorage.getItem('tiktok_access_token');
  },

  // Get stored user info
  getUserInfo() {
    const userInfo = localStorage.getItem('tiktok_user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  // Check authentication status and redirect if needed
  checkAuthStatus() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isOnDashboard = currentPage === 'dashboard.html';
    const isOnLogin = currentPage === 'login.html';

    if (this.isAuthenticated()) {
      // User is authenticated
      this.updateUIForAuthenticated();

      // If on login page, redirect to dashboard
      if (isOnLogin) {
        setTimeout(() => {
          window.location.href = './dashboard.html';
        }, 500);
      }

      // Handle OAuth callback
      this.handleOAuthCallback();
    } else {
      // User is not authenticated
      this.updateUIForUnauthenticated();

      // If on dashboard, redirect to login
      if (isOnDashboard) {
        setTimeout(() => {
          window.location.href = './login.html';
        }, 500);
      }
    }
  },

  // Update UI for authenticated user
  updateUIForAuthenticated() {
    const userInfo = this.getUserInfo();
    if (!userInfo) return;

    // Update username displays
    const usernameElements = document.querySelectorAll('#user-name, #tiktok-username');
    usernameElements.forEach(el => {
      el.textContent = '@' + userInfo.username;
    });

    // Show logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.style.display = 'block';
    }
  },

  // Update UI for unauthenticated user
  updateUIForUnauthenticated() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.style.display = 'none';
    }
  },

  // Initiate TikTok login
  initiateLogin() {
    // For demo purposes, we'll simulate OAuth flow
    // In production, redirect to TikTok OAuth endpoint:
    // const authUrl = `${TIKTOK_CONFIG.AUTHORIZE_URL}?client_key=${TIKTOK_CONFIG.CLIENT_ID}&response_type=code&scope=${TIKTOK_CONFIG.SCOPES.join(',')}&redirect_uri=${encodeURIComponent(TIKTOK_CONFIG.REDIRECT_URI)}`;
    // window.location.href = authUrl;

    // Demo flow - simulate OAuth callback
    this.simulateOAuthFlow();
  },

  // Simulate OAuth flow for demo (remove in production)
  simulateOAuthFlow() {
    const loginBtn = document.getElementById('tiktok-login-btn');
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = 'Connecting to TikTok...';
    }

    // Simulate API call delay
    setTimeout(() => {
      // Demo user data
      const demoUserData = {
        open_id: 'demo_user_' + Math.random().toString(36).substr(2, 9),
        username: 'demo_creator_' + Math.floor(Math.random() * 10000),
        display_name: 'Demo Creator Account',
      };

      // Simulate access token
      const demoToken = 'demo_token_' + Math.random().toString(36).substr(2, 9);

      // Store in localStorage
      localStorage.setItem('tiktok_access_token', demoToken);
      localStorage.setItem('tiktok_user_info', JSON.stringify(demoUserData));
      localStorage.setItem('tiktok_token_expires_at', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString());

      // Redirect to dashboard
      window.location.href = './dashboard.html';
    }, 1500);
  },

  // Handle OAuth callback from TikTok
  handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code && !localStorage.getItem('tiktok_access_token')) {
      // Exchange code for access token (production)
      this.exchangeCodeForToken(code);
    }
  },

  // Exchange authorization code for access token (production)
  async exchangeCodeForToken(code) {
    try {
      // This would call your backend endpoint that exchanges the code for a token
      // Your backend should call TikTok's token endpoint with CLIENT_SECRET
      const response = await fetch('/api/tiktok/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.access_token) {
        // Store token and user info
        localStorage.setItem('tiktok_access_token', data.access_token);
        localStorage.setItem('tiktok_user_info', JSON.stringify(data.user));
        localStorage.setItem('tiktok_token_expires_at', data.expires_at);

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    }
  },

  // Logout user
  logout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('tiktok_access_token');
      localStorage.removeItem('tiktok_user_info');
      localStorage.removeItem('tiktok_token_expires_at');
      localStorage.removeItem('tiktok_publications');

      window.location.href = './login.html';
    }
  },

  // Disconnect TikTok account
  disconnect() {
    if (confirm('Are you sure you want to disconnect your TikTok account? This action will revoke all permissions.')) {
      // In production, call TikTok API to revoke access
      this.revokeAccess();
    }
  },

  // Revoke TikTok access
  async revokeAccess() {
    try {
      const token = this.getAccessToken();
      // Call your backend to revoke the token
      await fetch('/api/tiktok/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token }),
      });

      // Clear local storage
      this.logout();
    } catch (error) {
      console.error('Error revoking access:', error);
      // Still logout even if revoke fails
      this.logout();
    }
  },

  // Refresh access token if expired
  async refreshToken() {
    const expiresAt = localStorage.getItem('tiktok_token_expires_at');
    if (!expiresAt) return;

    const expiryTime = new Date(expiresAt).getTime();
    if (Date.now() > expiryTime - 5 * 60 * 1000) {
      try {
        // Call your backend to refresh the token
        const response = await fetch('/api/tiktok/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();
        if (data.access_token) {
          localStorage.setItem('tiktok_access_token', data.access_token);
          localStorage.setItem('tiktok_token_expires_at', data.expires_at);
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        this.logout();
      }
    }
  },
};

// Initialize auth when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TikTokAuth.init());
} else {
  TikTokAuth.init();
}
