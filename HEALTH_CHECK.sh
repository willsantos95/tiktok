#!/bin/bash

echo "🔍 TikTok OAuth Health Check"
echo "================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se Node.js está rodando
echo "1️⃣ Verificando Node.js..."
if pgrep -f "node server.js" > /dev/null; then
    echo -e "${GREEN}✅ Node.js está rodando${NC}"
    NODE_PID=$(pgrep -f "node server.js")
    echo "   PID: $NODE_PID"
else
    echo -e "${RED}❌ Node.js NÃO está rodando${NC}"
    echo "   Iniciando Node.js..."
    npm start > /tmp/server.log 2>&1 &
    sleep 3
    if pgrep -f "node server.js" > /dev/null; then
        echo -e "${GREEN}✅ Node.js iniciado com sucesso${NC}"
    else
        echo -e "${RED}❌ Falha ao iniciar Node.js${NC}"
        echo "   Verificar logs: cat /tmp/server.log"
        exit 1
    fi
fi
echo ""

# 2. Testar Health Endpoint
echo "2️⃣ Testando Health Endpoint..."
HEALTH=$(curl -s http://localhost:3000/health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health endpoint respondendo${NC}"
    echo "   $HEALTH"
else
    echo -e "${RED}❌ Health endpoint falhou${NC}"
    exit 1
fi
echo ""

# 3. Testar OAuth Auth-URL Endpoint
echo "3️⃣ Testando OAuth Auth-URL Endpoint..."
AUTH_URL=$(curl -s http://localhost:3000/api/tiktok/auth-url)
if echo "$AUTH_URL" | grep -q "tiktok.com"; then
    echo -e "${GREEN}✅ OAuth endpoint respondendo${NC}"
    echo "   URL gerada com sucesso"
else
    echo -e "${RED}❌ OAuth endpoint falhou${NC}"
    echo "   Resposta: $AUTH_URL"
    exit 1
fi
echo ""

# 4. Verificar .env
echo "4️⃣ Verificando Configuração .env..."
if [ -f .env ]; then
    if grep -q "TIKTOK_CLIENT_KEY" .env; then
        echo -e "${GREEN}✅ .env existe e configurado${NC}"
        echo "   Client Key: $(grep TIKTOK_CLIENT_KEY .env | cut -d'=' -f2 | head -c 10)..."
    else
        echo -e "${RED}❌ .env não tem credenciais TikTok${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ .env não existe${NC}"
    exit 1
fi
echo ""

# 5. Verificar Nginx (se instalado)
echo "5️⃣ Verificando Nginx..."
if command -v nginx &> /dev/null; then
    if pgrep nginx > /dev/null; then
        echo -e "${GREEN}✅ Nginx está rodando${NC}"
    else
        echo -e "${YELLOW}⚠️  Nginx instalado mas não rodando${NC}"
        echo "   Iniciando nginx..."
        nginx
        if pgrep nginx > /dev/null; then
            echo -e "${GREEN}✅ Nginx iniciado${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Nginx não instalado (opcional)${NC}"
fi
echo ""

# 6. Verificar Portas
echo "6️⃣ Verificando Portas..."
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo -e "${GREEN}✅ Porta 3000 está aberta (Node.js)${NC}"
else
    echo -e "${YELLOW}⚠️  Porta 3000 não está escutando${NC}"
fi
echo ""

# 7. Teste de Conectividade da API
echo "7️⃣ Teste de Conectividade..."
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/tiktok/auth-url)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ API respondendo (HTTP 200)${NC}"
else
    echo -e "${RED}❌ API retornou HTTP $HTTP_CODE${NC}"
    echo "   Resposta: $BODY"
    exit 1
fi
echo ""

# Status Final
echo "================================"
echo -e "${GREEN}✅ SISTEMA PRONTO PARA LOGIN${NC}"
echo "================================"
echo ""

# Ler APP_URL do .env
if [ -f .env ]; then
    APP_URL=$(grep "^APP_URL=" .env | cut -d'=' -f2)
    if [ -z "$APP_URL" ]; then
        APP_URL="http://localhost:3000"
    fi
else
    APP_URL="http://localhost:3000"
fi

echo "🚀 URLs disponíveis:"
echo "   Configurado: ${APP_URL}/login.html"
echo "   Local:       http://localhost:3000/login.html"
echo ""
echo "📝 Para alterar a URL, edite .env:"
echo "   APP_URL=https://seu-dominio.com"
echo ""
