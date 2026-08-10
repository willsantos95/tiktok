# Docker Setup - TikTok OAuth Application

## 🐳 Arquitetura Docker

```
┌──────────────────────────────────────┐
│         EASYPANEL / HOST              │
├──────────────────────────────────────┤
│  Port 80/443 (HTTP/HTTPS)             │
│         ↓                              │
│  ┌─────────────────────────────────┐ │
│  │   NGINX (nginx:1.27-alpine)     │ │
│  │  - Proxy Reverso                │ │
│  │  - SSL/HTTPS                    │ │
│  │  - Static Files                 │ │
│  │  - Porta: 80/443                │ │
│  └────────────┬────────────────────┘ │
│               ↓                        │
│  ┌─────────────────────────────────┐ │
│  │  NODE.JS (node:22-alpine)       │ │
│  │  - Backend Express              │ │
│  │  - OAuth Handler                │ │
│  │  - API Endpoints                │ │
│  │  - Porta: 3000 (interno)        │ │
│  └─────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

## 📋 Arquivos Docker

### **docker-compose.yml** (Novo!)
Define 2 serviços:
- **backend**: Node.js rodando na porta 3000
- **nginx**: Nginx como proxy reverso

### **Dockerfile.backend** (Novo!)
Imagem Docker para Node.js:
- Base: `node:22-alpine`
- Instala dependências
- Inicia aplicação com `npm start`

### **nginx.conf**
Configuração Nginx:
- Proxy reverso para `http://127.0.0.1:3000`
- Static files (`/assets`, `/login.html`, etc)
- SSL/HTTPS (se configurado)

---

## 🚀 Como Usar no EasyPanel

### **Passo 1: Preparar Arquivos**

Certifique-se que tem:
```
✅ docker-compose.yml
✅ Dockerfile.backend
✅ nginx.conf
✅ server.js
✅ package.json
✅ .env (com variáveis preenchidas)
```

### **Passo 2: Variáveis de Ambiente**

No EasyPanel, configure:
```env
APP_URL=https://seu-dominio.com
PORT=3000
NODE_ENV=production

TIKTOK_CLIENT_KEY=sua-chave
TIKTOK_CLIENT_SECRET=seu-secret
TIKTOK_REDIRECT_URI=https://seu-dominio.com/api/tiktok/callback
TIKTOK_API_BASE_URL=https://open.tiktokapis.com
TIKTOK_SANDBOX=true

CORS_ORIGIN=https://seu-dominio.com
SESSION_SECRET=seu-segredo-aleatorio
```

### **Passo 3: Deploy**

No EasyPanel:
```
1. Selecione app
2. Settings → Source
3. Conecte GitHub: willsantos95/tiktok
4. Branch: claude/tiktok-login-demo-video-06rbps
5. Deploy
```

EasyPanel automaticamente:
- Executa `docker-compose up`
- Inicia Node.js na porta 3000
- Inicia Nginx na porta 80
- Configura proxy automático

### **Passo 4: Verificar**

```
1. Logs → Procure por:
   ✅ "backend_1 | 🚀 TikTok Video Publishing Backend"
   ✅ "backend_1 | 📍 Running on http://localhost:3000"
   ✅ "nginx_1 | nginx: master process started"

2. Teste:
   https://seu-dominio.com/login.html
   Clique "Login with TikTok"
   Deve redirecionar (não mais 502!)
```

---

## 🔧 Troubleshooting Docker

### **Problema: 502 Bad Gateway**

**Solução 1: Verificar se containers estão rodando**
```bash
docker ps
# Deve mostrar:
# - relampago-tiktok-backend (running)
# - relampago-tiktok-nginx (running)
```

**Solução 2: Reiniciar containers**
```
EasyPanel → App → Restart
```

**Solução 3: Verificar logs**
```
EasyPanel → Logs → Backend
# Procure por erros em vermelho
```

### **Problema: Node.js não inicia**

**Verificar:**
```bash
docker logs relampago-tiktok-backend
# Procure por:
# - ENOENT: arquivo não encontrado
# - Cannot find module: dependência faltando
# - PORT already in use: conflito de porta
```

**Solução:**
```
1. Verifique .env está correto
2. Verifique package.json existe
3. Verifique server.js existe
4. Reinicie: EasyPanel → Restart
```

### **Problema: Nginx não consegue conectar**

**Verificar nginx.conf:**
```nginx
upstream nodejs_backend {
    server backend:3000;  # ← Nome do serviço, não localhost
}
```

❌ **ERRADO:**
```nginx
upstream nodejs_backend {
    server 127.0.0.1:3000;  # ← Não funciona entre containers
}
```

---

## 📊 Verificação de Saúde

### **Backend Health**
```bash
curl http://localhost:3000/health
# Resposta esperada:
# {"status":"healthy","timestamp":"..."}
```

### **Nginx Health**
```bash
curl http://localhost/health
# Resposta esperada:
# ok
```

### **OAuth Endpoint**
```bash
curl http://localhost/api/tiktok/auth-url
# Resposta esperada:
# {"authUrl":"https://www.tiktok.com/v1/oauth/..."}
```

---

## 🎯 Desenvolvimento Local com Docker

```bash
# Iniciar tudo
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f nginx

# Parar
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

---

## 📝 Resumo das Mudanças

| Arquivo | Mudança | Motivo |
|---------|---------|--------|
| docker-compose.yml | Reescrito com 2 serviços | Node.js + Nginx separados |
| Dockerfile.backend | Novo | Node.js container |
| nginx.conf | Proxy para `backend:3000` | Comunicação entre containers |

---

## ✅ Checklist Final

- [ ] docker-compose.yml atualizado
- [ ] Dockerfile.backend criado
- [ ] .env com variáveis completas
- [ ] SSH/Git push feito
- [ ] EasyPanel reconheceu mudanças
- [ ] Deploy executado
- [ ] Logs mostram "🚀 TikTok Video Publishing Backend"
- [ ] Acesso `https://seu-dominio.com/login.html`
- [ ] Clique "Login with TikTok" funciona (redirect, não 502)

Pronto! 🚀
