# Configuração de Variáveis de Ambiente

## 📋 Variáveis Disponíveis

### APP_URL (Novo!)
Define a URL base da aplicação. Usada para logs e referências internas.

```env
# Desenvolvimento Local
APP_URL=http://localhost:3000

# Produção
APP_URL=https://seu-dominio.com
APP_URL=https://vid.relampagodeofertas.shop
```

---

## 🚀 Como Configurar

### 1. **Desenvolvimento Local**

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# O .env padrão já contém:
APP_URL=http://localhost:3000
PORT=3000
NODE_ENV=development
```

### 2. **Produção em Servidor**

Edite o arquivo `.env`:

```bash
nano .env
```

Atualize estas variáveis:

```env
# URL da aplicação
APP_URL=https://vid.relampagodeofertas.shop

# Porta (geralmente 3000, ou deixe nginx gerenciar porta 80/443)
PORT=3000

# Ambiente
NODE_ENV=production

# TikTok OAuth
TIKTOK_CLIENT_KEY=sbawom3osgvtdcjh12
TIKTOK_CLIENT_SECRET=JC19bDo5UrBFpti0xLyIyXCxP5PHkYSM
TIKTOK_REDIRECT_URI=https://vid.relampagodeofertas.shop/api/tiktok/callback

# CORS
CORS_ORIGIN=https://vid.relampagodeofertas.shop

# Segurança
SESSION_SECRET=seu-segredo-aleatorio-super-seguro
```

### 3. **Com Docker**

O Docker pode receber variáveis via `.env`:

```bash
# Arquivo docker-compose.yml lê .env automaticamente
docker-compose up -d
```

Ou passar na linha de comando:

```bash
docker run -e APP_URL=https://seu-dominio.com -e PORT=3000 seu-imagem
```

### 4. **Com Nginx + Proxy Reverso**

Se estiver usando Nginx:

```bash
# Nginx na porta 80/443
APP_URL=https://seu-dominio.com

# Node.js continua em localhost:3000
PORT=3000

# Nginx encaminha /api/* para localhost:3000
```

---

## ✅ Variáveis Completas Referência

| Variável | Descrição | Exemplo | Obrigatória |
|----------|-----------|---------|------------|
| `APP_URL` | URL base da aplicação | `https://seu-dominio.com` | Sim |
| `PORT` | Porta do Node.js | `3000` | Não (padrão: 3000) |
| `NODE_ENV` | Ambiente | `production` ou `development` | Não |
| `TIKTOK_CLIENT_KEY` | TikTok API Key | `sbawom3osgvtdcjh12` | Sim |
| `TIKTOK_CLIENT_SECRET` | TikTok API Secret | `JC19bDo5UrBFpti0xLyIyXCxP5PHkYSM` | Sim |
| `TIKTOK_REDIRECT_URI` | URL de callback OAuth | `https://seu-dominio.com/api/tiktok/callback` | Sim |
| `TIKTOK_API_BASE_URL` | URL base da API TikTok | `https://open.tiktokapis.com` | Não |
| `TIKTOK_SANDBOX` | Modo sandbox | `true` ou `false` | Não (padrão: true) |
| `CORS_ORIGIN` | CORS permitido | `*` ou `https://seu-dominio.com` | Não (padrão: *) |
| `SESSION_SECRET` | Secret para sessões | Qualquer string aleatória | Não |

---

## 🔍 Verificar Configuração

Use o health check para verificar se tudo está correto:

```bash
bash HEALTH_CHECK.sh
```

Output esperado:

```
🔍 TikTok OAuth Health Check
================================

1️⃣ Verificando Node.js...
✅ Node.js está rodando
   PID: 1234

2️⃣ Testando Health Endpoint...
✅ Health endpoint respondendo
   {"status":"healthy","timestamp":"..."}

3️⃣ Testando OAuth Auth-URL Endpoint...
✅ OAuth endpoint respondendo
   URL gerada com sucesso

...

================================
✅ SISTEMA PRONTO PARA LOGIN
================================

🚀 URLs disponíveis:
   Configurado: https://seu-dominio.com/login.html
   Local:       http://localhost:3000/login.html

📝 Para alterar a URL, edite .env:
   APP_URL=https://seu-dominio.com
```

---

## 🚨 Troubleshooting

### "Failed to initiate login"
- Verifique `APP_URL` está correto
- Verifique CORS_ORIGIN permite sua URL
- Execute `bash HEALTH_CHECK.sh`

### "502 Bad Gateway"
- Nginx não consegue conectar ao Node.js
- Verifique se Node.js está rodando: `ps aux | grep node`
- Verifique porta 3000: `netstat -tlnp | grep 3000`

### Tokens não são salvos
- Verifique SESSION_SECRET está configurado
- Limpe cookies do navegador
- Tente em modo anônimo/incógnito

---

## 📝 Exemplo Completo .env

```env
# ============================================
# TIKTOK OAUTH CONFIGURATION
# ============================================
TIKTOK_CLIENT_KEY=sbawom3osgvtdcjh12
TIKTOK_CLIENT_SECRET=JC19bDo5UrBFpti0xLyIyXCxP5PHkYSM
TIKTOK_REDIRECT_URI=https://vid.relampagodeofertas.shop/api/tiktok/callback
TIKTOK_API_BASE_URL=https://open.tiktokapis.com
TIKTOK_SANDBOX=true

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3000
APP_URL=https://vid.relampagodeofertas.shop
NODE_ENV=production
SESSION_SECRET=meu-segredo-super-aleatorio-12345-xyz

# ============================================
# SECURITY & CORS
# ============================================
CORS_ORIGIN=https://vid.relampagodeofertas.shop
```

---

## 🎯 Próximos Passos

1. ✅ Configure `.env` com suas variáveis
2. ✅ Execute `bash HEALTH_CHECK.sh`
3. ✅ Teste login em `https://seu-dominio.com/login.html`
4. ✅ Verifique logs com `npm run dev`

Pronto! 🚀
