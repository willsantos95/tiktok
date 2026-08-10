// TikTok Authentication Handler

// Configuration - Backend will handle OAuth flow
const API_BASE_URL = window.location.origin;
const TIKTOK_SCOPES = ['user.info.basic', 'video.upload', 'video.publish'];

// Session Management
const TikTokAuth = {
  // Initialize authentication
  init() {
    this.checkForOAuthErrors();
    this.checkAuthStatus();
    this.setupEventListeners();
  },

  // Check for OAuth errors in URL
  checkForOAuthErrors() {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error) {
      console.error('OAuth error:', error);
      const errorMsg = this.getErrorMessage(error);
      alert('Login failed: ' + errorMsg);

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  },

  // Get user-friendly error message
  getErrorMessage(error) {
    const messages = {
      'invalid_state': 'Security validation failed. Please try again.',
      'missing_parameters': 'Missing authorization parameters. Please try again.',
      'session_save_failed': 'Session error. Please try again.',
      'access_denied': 'Authorization was denied. Please try again.',
      'temporarily_unavailable': 'TikTok service is temporarily unavailable.',
    };
    return messages[error] || error;
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
  async checkAuthStatus() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isOnDashboard = currentPage === 'dashboard.html';
    const isOnLogin = currentPage === 'login.html';

    try {
      // Check with backend
      const response = await fetch(`${API_BASE_URL}/api/tiktok/user`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // User is authenticated
        this.updateUIForAuthenticated(data.user);

        // If on login page, redirect to dashboard
        if (isOnLogin) {
          setTimeout(() => {
            window.location.href = './dashboard.html';
          }, 500);
        }
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
    } catch (error) {
      console.error('Auth check error:', error);
      this.updateUIForUnauthenticated();

      if (isOnDashboard) {
        setTimeout(() => {
          window.location.href = './login.html';
        }, 500);
      }
    }
  },

  // Update UI for authenticated user
  updateUIForAuthenticated(userInfo) {
    if (!userInfo) return;

    // Update username displays
    const usernameElements = document.querySelectorAll('#user-name, #tiktok-username');
    usernameElements.forEach(el => {
      el.textContent = userInfo.displayName || '@user';
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
  async initiateLogin() {
    try {
      const loginBtn = document.getElementById('tiktok-login-btn');
      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Connecting to TikTok...';
      }

      // Get authorization URL from backend
      const response = await fetch(`${API_BASE_URL}/api/tiktok/auth-url`);
      const data = await response.json();

      if (data.authUrl) {
        // Redirect to TikTok OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to initiate login. Please try again.');
      const loginBtn = document.getElementById('tiktok-login-btn');
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login with TikTok';
      }
    }
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
  async logout() {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await fetch(`${API_BASE_URL}/api/tiktok/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Logout error:', error);
      }

      // Clear local storage
      localStorage.removeItem('tiktok_access_token');
      localStorage.removeItem('tiktok_user_info');
      localStorage.removeItem('tiktok_token_expires_at');
      localStorage.removeItem('tiktok_publications');

      window.location.href = './login.html';
    }
  },

  // Disconnect TikTok account
  disconnect() {
    this.logout();
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
