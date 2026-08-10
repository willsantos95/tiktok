#!/bin/bash

# TikTok OAuth Configuration Validation Script
# This script validates that all OAuth settings are correctly configured

echo "🔐 TikTok OAuth Configuration Validator"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check if value exists
check_value() {
  local name=$1
  local value=$2

  if [ -z "$value" ]; then
    echo -e "${RED}✗${NC} $name: NOT SET"
    ((ERRORS++))
    return 1
  else
    echo -e "${GREEN}✓${NC} $name: $value"
    return 0
  fi
}

# Function to check if URL is valid
check_url() {
  local name=$1
  local url=$2

  if [ -z "$url" ]; then
    echo -e "${RED}✗${NC} $name: NOT SET"
    ((ERRORS++))
    return 1
  fi

  # Check if URL starts with https:// or http://
  if [[ $url == http://* ]] || [[ $url == https://* ]]; then
    echo -e "${GREEN}✓${NC} $name: $url"
    return 0
  else
    echo -e "${RED}✗${NC} $name: INVALID FORMAT (must start with http:// or https://) - $url"
    ((ERRORS++))
    return 1
  fi
}

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
  echo -e "${GREEN}✓${NC} .env file found and loaded"
else
  echo -e "${RED}✗${NC} .env file not found"
  ((ERRORS++))
fi

echo ""
echo "📋 OAuth Configuration:"
echo "----------------------"

# Check TikTok credentials
check_value "TIKTOK_CLIENT_KEY" "$TIKTOK_CLIENT_KEY"
check_value "TIKTOK_CLIENT_SECRET" "$TIKTOK_CLIENT_SECRET"
check_url "TIKTOK_REDIRECT_URI" "$TIKTOK_REDIRECT_URI"
check_url "TIKTOK_API_BASE_URL" "$TIKTOK_API_BASE_URL"

echo ""
echo "🌐 Application Settings:"
echo "------------------------"

# Check application settings
check_url "APP_URL" "$APP_URL"
check_value "NODE_ENV" "$NODE_ENV"
check_value "PORT" "$PORT"

echo ""
echo "🔒 Security Settings:"
echo "---------------------"

# Check security settings
check_value "SESSION_SECRET" "$SESSION_SECRET"
check_url "CORS_ORIGIN" "$CORS_ORIGIN"

echo ""
echo "📝 Scopes Required:"
echo "-------------------"

REQUIRED_SCOPES=("user.info.basic" "video.upload" "video.publish")
echo "Required TikTok OAuth scopes (verify in TikTok Developer Portal):"
for scope in "${REQUIRED_SCOPES[@]}"; do
  echo -e "  ${GREEN}✓${NC} $scope"
done

echo ""
echo "🌍 Redirect URI Validation:"
echo "----------------------------"

# Validate redirect URI format
if [ ! -z "$TIKTOK_REDIRECT_URI" ]; then
  if [[ $TIKTOK_REDIRECT_URI == *"/api/tiktok/callback" ]]; then
    echo -e "${GREEN}✓${NC} Redirect URI has correct path: /api/tiktok/callback"
  else
    echo -e "${YELLOW}⚠${NC} Redirect URI path may be incorrect: $TIKTOK_REDIRECT_URI"
    ((WARNINGS++))
  fi

  if [[ $TIKTOK_REDIRECT_URI == https://* ]]; then
    echo -e "${GREEN}✓${NC} Redirect URI uses HTTPS (required)"
  elif [[ $TIKTOK_REDIRECT_URI == http://localhost* ]]; then
    echo -e "${GREEN}✓${NC} Redirect URI uses HTTP for localhost (OK for development)"
  else
    echo -e "${RED}✗${NC} Redirect URI should use HTTPS for production"
    ((ERRORS++))
  fi
fi

echo ""
echo "🧪 Backend Health Check:"
echo "------------------------"

# Check if backend is responding
if command -v curl &> /dev/null; then
  if curl -s http://127.0.0.1:3000/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend is running on port 3000"
  else
    echo -e "${YELLOW}⚠${NC} Backend does not appear to be running (http://127.0.0.1:3000)"
    ((WARNINGS++))
  fi

  # Try to get the OAuth URL
  if curl -s http://127.0.0.1:3000/api/tiktok/auth-url > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} OAuth endpoint (/api/tiktok/auth-url) is accessible"
  else
    echo -e "${YELLOW}⚠${NC} OAuth endpoint may not be accessible"
    ((WARNINGS++))
  fi
else
  echo -e "${YELLOW}⚠${NC} curl command not available for health check"
  ((WARNINGS++))
fi

echo ""
echo "📊 Summary:"
echo "-----------"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed! OAuth is properly configured.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Visit https://vid.relampagodeofertas.shop/login.html"
  echo "2. Click 'Login with TikTok'"
  echo "3. You should be redirected to TikTok's OAuth authorization page"
  echo "4. Check the server logs for detailed OAuth flow information"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠ Configuration looks good, but check the $WARNINGS warning(s) above${NC}"
  exit 0
else
  echo -e "${RED}✗ Configuration has $ERRORS error(s) - OAuth will not work${NC}"
  echo ""
  echo "Required fixes:"
  echo "1. Add missing environment variables to .env"
  echo "2. Verify the values match your TikTok Developer Portal settings"
  echo "3. Ensure HTTPS is used for production redirect URIs"
  echo "4. Restart the application after fixing .env"
  exit 1
fi
