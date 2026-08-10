# ⚡ Fix: Sandbox vs Production Configuration

## O Erro Recebido
```
error_type=non_sandbox_target
```

## Causa
Mismatch entre:
- Modo da app no TikTok (SANDBOX ou PRODUCTION)
- Tipo de conta que você está usando (teste ou real)

## Solução Rápida

### 1. Verificar Portal TikTok
- Vá para: https://developer.tiktok.com/apps
- Clique na sua app
- Procure: "Sandbox" ou "Production"
- Anote qual modo está

### 2. Atualizar .env

**SE SUA APP ESTÁ EM SANDBOX:**
```env
TIKTOK_SANDBOX=true
TIKTOK_API_BASE_URL=https://open-sandbox.tiktokapis.com
```

**SE SUA APP ESTÁ EM PRODUCTION:**
```env
TIKTOK_SANDBOX=false
TIKTOK_API_BASE_URL=https://open.tiktokapis.com
```

### 3. Redeploy
- EasyPanel → App → Restart
- Aguarde 30 segundos

### 4. Testar
- Acesse: https://vid.relampagodeofertas.shop/login.html
- Clique: "Login with TikTok"
- Use conta apropriada:
  - SANDBOX: conta de TESTE
  - PRODUCTION: conta REAL

## Verificar Logs
Depois do redeploy, os logs devem mostrar:
```
🧪 MODE: SANDBOX
🌐 API Base URL: https://open-sandbox.tiktokapis.com
```

Ou:
```
🌐 MODE: PRODUCTION
🌐 API Base URL: https://open.tiktokapis.com
```

## Documentação Completa
Veja `SANDBOX_VS_PRODUCTION.md` para detalhes completos sobre Sandbox vs Production.
