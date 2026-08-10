# 🔧 Correção Crítica: TikTok API v2 OAuth

## O Problema

A aplicação estava usando os **endpoints desatualizados da TikTok API v1**, o que causava:
```
❌ Erro 404 ao tentar fazer login
❌ "https://www.tiktok.com/404?fromUrl=/v1/oauth/authorize/?..."
```

## A Solução

TikTok atualizou seus endpoints de OAuth para **v2**. Os endpoints corretos agora são:

### ✅ URLs Corretas (v2)

**Autorização:**
```
https://www.tiktok.com/v2/auth/authorize/?
  client_key=SEU_CLIENT_KEY&
  response_type=code&
  scope=user.info.basic,video.upload,video.publish&
  redirect_uri=https://seu-dominio.com/api/tiktok/callback&
  state=random_state
```

**Troca de Token:**
```
POST https://open.tiktokapis.com/v2/oauth/token/

Body (form-urlencoded):
- client_key=SEU_CLIENT_KEY
- client_secret=SEU_CLIENT_SECRET
- code=AUTHORIZATION_CODE
- grant_type=authorization_code
- redirect_uri=https://seu-dominio.com/api/tiktok/callback
```

**Refresh Token:**
```
POST https://open.tiktokapis.com/v2/oauth/token/

Body (form-urlencoded):
- client_key=SEU_CLIENT_KEY
- client_secret=SEU_CLIENT_SECRET
- grant_type=refresh_token
- refresh_token=SEU_REFRESH_TOKEN
```

---

## ❌ URLs Desatualizadas (v1) - NÃO USE MAIS

| Endpoint | v1 (Desatualizado) | v2 (Correto) |
|----------|-------------------|-------------|
| Autorização | `https://www.tiktok.com/v1/oauth/authorize/` | `https://www.tiktok.com/v2/auth/authorize/` |
| Token Exchange | `https://open.tiktokapis.com/v1/oauth/token/` | `https://open.tiktokapis.com/v2/oauth/token/` |
| Token Refresh | `https://open.tiktokapis.com/v1/oauth/token/` | `https://open.tiktokapis.com/v2/oauth/token/` |

---

## ✅ O que foi corrigido no código

### server.js
```javascript
// ANTES (❌ ERRADO):
authorizationUrl: 'https://www.tiktok.com/v1/oauth/authorize'

// DEPOIS (✅ CORRETO):
authorizationUrl: 'https://www.tiktok.com/v2/auth/authorize/'
```

```javascript
// ANTES (❌ ERRADO):
`${TIKTOK_CONFIG.apiBaseUrl}/v1/oauth/token/`

// DEPOIS (✅ CORRETO):
`${TIKTOK_CONFIG.apiBaseUrl}/v2/oauth/token/`
```

---

## 🎯 Por que estava dando 404?

TikTok descontinuou os endpoints v1:
1. Sua app enviava requisição para: `https://www.tiktok.com/v1/oauth/authorize/`
2. TikTok respondeu com: **404 Not Found**
3. Retornou: `https://www.tiktok.com/404?fromUrl=/v1/oauth/authorize/?...`

Agora, com v2:
1. Sua app envia requisição para: `https://www.tiktok.com/v2/auth/authorize/`
2. TikTok reconhece o endpoint: ✅ Válido
3. Mostra página de login do TikTok: ✅ Sucesso

---

## 🚀 Próximos Passos

1. **Fazer upload no GitHub:**
   - Atualize `server.js` com as mudanças
   - Ou use o novo ZIP que será gerado com essa correção

2. **Redeploy no EasyPanel:**
   - Redeploy da aplicação
   - Aguarde ~30 segundos para iniciar

3. **Testar OAuth:**
   - Acesse: https://vid.relampagodeofertas.shop/login.html
   - Clique: "Login with TikTok"
   - **Você DEVE ver a página de login do TikTok** (não 404)

4. **Verificar Logs:**
   - Procure por: `🔐 OAuth Auth URL Generated`
   - Se ver essa mensagem, backend está funcionando
   - A URL deve conter: `v2/auth/authorize`

---

## 📚 Referências Oficiais

- **TikTok API Docs:** https://developers.tiktok.com/doc/web-api-intro/
- **OAuth 2.0 Flow:** https://developers.tiktok.com/doc/web-api-intro/#oauth-authorization-flow
- **Scopes Disponíveis:**
  - `user.info.basic` - Informações básicas do usuário
  - `video.upload` - Upload de vídeos como rascunho
  - `video.publish` - Publicação direta de vídeos

---

## ⚠️ Importante

Se o erro 404 persistir APÓS essa correção:

1. ✅ Verifique que você atualizou o `server.js` com v2
2. ✅ Redeploy a aplicação (EasyPanel → Restart)
3. ✅ Limpe o cache do navegador (Ctrl+Shift+Delete)
4. ✅ Tente em modo incógnito
5. ✅ Verifique logs do backend

Se ainda não funcionar, consulte:
- `OAUTH_TROUBLESHOOTING.md` - Diagnóstico completo
- `OAUTH_VALIDATION.sh` - Verificação automática
- `OAUTH_QUICK_FIX.md` - Resolução em 5 minutos

---

## 🎉 Uma vez funcionando

Teste os dois fluxos de publicação:

### 1️⃣ Draft Upload (video.upload)
```
Login → Dashboard → "Send as Draft" 
→ Upload vídeo → Vire rascunho no TikTok ✅
```

### 2️⃣ Direct Publish (video.publish)
```
Login → Dashboard → "Publish Directly"
→ Upload vídeo → Vire publicado imediatamente ✅
```

---

## 📝 Conclusão

Esta era a **razão raiz** do erro 404. TikTok mudou de v1 para v2 e os endpoints antigos retornam 404.

**Versão corrigida:** `server.js` agora usa os endpoints v2 oficiais do TikTok.

**Resultado esperado:** OAuth 2.0 flow funciona perfeitamente! ✅
