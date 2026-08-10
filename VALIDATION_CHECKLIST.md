# Checklist de Validação - Login Real TikTok

## ✅ Pontos a Validar

### 1. Backend - OAuth Flow

- [ ] **Credenciais configuradas**
  ```bash
  # Verificar se .env tem:
  cat .env | grep TIKTOK
  ```

- [ ] **Servidor iniciando**
  ```bash
  npm install
  npm run dev
  # Deve ver: "🚀 TikTok Video Publishing Backend"
  ```

- [ ] **Endpoints respondendo**
  ```bash
  # Em outro terminal:
  curl http://localhost:3000/health
  # Deve retornar: {"status":"healthy","timestamp":"..."}
  ```

### 2. Frontend - Login Page

- [ ] **Página carrega sem erros**
  - Abra: http://localhost:3000/login.html
  - F12 → Console (não deve ter erros em vermelho)

- [ ] **Botão "Login with TikTok" está visível**
  - Deve estar no centro da página
  - Deve estar habilitado (não desabilitado)

- [ ] **Permissões são mostradas claramente**
  - Seção "Permissions Required" visível
  - Lista os 3 escopos:
    - 👤 User Information
    - 📤 Video Upload
    - 🚀 Video Publish

### 3. OAuth Flow Completo

#### Passo 3a: Iniciar Login
- [ ] **Clique em "Login with TikTok"**
  - Botão deve mostrar "Connecting to TikTok..." (temporário)
  - Página não deve congelar

#### Passo 3b: Backend gera URL
- [ ] **Verifique logs do backend**
  ```
  Deve ver algo como:
  - Request para /api/tiktok/auth-url
  - Response com authUrl contendo:
    * client_key=sbawom3osgvtdcjh12
    * response_type=code
    * scope=user.info.basic,video.upload,video.publish
    * redirect_uri=https://vid.relampagodeofertas.shop/api/tiktok/callback
  ```

#### Passo 3c: Redireciona para TikTok
- [ ] **Você é redirecionado para TikTok**
  - URL deve começar com: `https://www.tiktok.com/v1/oauth/authorize/`
  - Página do TikTok deve carregar
  - Deve pedir para fazer login (se não estiver logado)

#### Passo 3d: Autorizar Aplicação
- [ ] **Página do TikTok mostra permissões**
  - "Relampago de Ofertas wants to:"
  - Lista as 3 permissões
  - Botão "Authorize" visível

- [ ] **Clique em "Authorize"**
  - TikTok processa autorização
  - Você é redirecionado de volta ao seu app

#### Passo 3e: Backend Processa Callback
- [ ] **Verifique logs do backend**
  ```
  Deve ver algo como:
  - GET /api/tiktok/callback?code=...&state=...
  - Trocando código por token (POST para /v1/oauth/token/)
  - Obtendo info do usuário (GET para /v1/user/info/)
  - Session salva com dados do usuário
  - Redirect para /dashboard.html
  ```

#### Passo 3f: Redirecionado ao Dashboard
- [ ] **Você é redirecionado ao dashboard**
  - URL muda para: http://localhost:3000/dashboard.html
  - Página carrega

### 4. Dashboard - Usuário Autenticado

- [ ] **Dados do usuário aparecem**
  - Nome/username TikTok visível no topo
  - Avatar pode aparecer (se retornado pela API)

- [ ] **Seções de upload são visíveis**
  - "Send as Draft" card visível
  - "Publish Directly" card visível

- [ ] **Botão Logout está disponível**
  - Deve estar na navegação
  - Deve permitir desconectar

### 5. Upload & Publicação (Testes Reais)

#### Draft Upload
- [ ] **Selecionar vídeo**
  - Clique em "Select Video" na seção Draft
  - Escolha um MP4 pequeno (< 50MB para teste)

- [ ] **Adicionar caption**
  - Digite uma descrição
  - Ex: "Test video - Draft upload"

- [ ] **Enviar como draft**
  - Clique "Upload as Draft"
  - Deve aparecer "Preparing video upload..."
  - Após alguns segundos: "✓ Video uploaded as draft!"

- [ ] **Verificar no TikTok**
  - Vá para sua conta TikTok
  - Vá para "Drafts"
  - Seu vídeo deve estar lá

#### Direct Publish
- [ ] **Selecionar vídeo**
  - Clique em "Select Video" na seção Publish
  - Escolha um MP4 diferente (< 50MB)

- [ ] **Adicionar informações**
  - Caption: "Test video - Direct publish"
  - Hashtags: "#test #relampago"

- [ ] **Clicar "Review & Publish"**
  - Modal deve aparecer com preview do vídeo
  - Deve mostrar caption e hashtags

- [ ] **Confirmar publicação**
  - Clique "Publish to TikTok"
  - Deve aparecer "Publishing..."
  - Após alguns segundos: "✓ Video published successfully!"

- [ ] **Verificar no TikTok**
  - Vá para sua conta TikTok
  - Seu vídeo deve estar no perfil
  - Deve estar público

### 6. Segurança

- [ ] **Tokens não aparecem no localStorage**
  ```javascript
  // No console do navegador:
  console.log(localStorage)
  // Não deve conter "access_token" ou "tiktok"
  ```

- [ ] **Tokens não aparecem na URL**
  - Nunca deve ver token_access ou refresh_token na URL

- [ ] **Session é segura**
  - Cookie `connect.sid` deve estar presente
  - Cookie deve ser `HttpOnly` (não acessível por JS)

### 7. Logout

- [ ] **Clique em Logout**
  - Deve aparecer confirmação
  - Clique "OK"

- [ ] **Redirecionado ao login**
  - URL muda para /login.html
  - Session é destruída no backend

- [ ] **Login novamente funciona**
  - Clique novamente em "Login with TikTok"
  - Todo o fluxo deve funcionar de novo

---

## 🐛 Troubleshooting

### Erro: "Failed to get authorization URL"
**Causa:** Backend não respondendo
**Solução:**
```bash
# Verifique se servidor está rodando
ps aux | grep node
# Se não, execute:
npm start
```

### Erro: "Invalid state parameter"
**Causa:** Sessão expirou durante login
**Solução:**
- Limpe cookies: F12 → Application → Cookies → Delete all
- Tente login novamente

### Erro: "Cannot GET /api/tiktok/callback"
**Causa:** Callback é POST em vez de GET
**Solução:**
- Verifique se atualizou server.js corretamente
- O endpoint deve ser `app.get()`, não `app.post()`

### Vídeo não aparece no TikTok
**Possíveis causas:**
- Sandbox está habilitado (normal para testes)
- Vídeo muito grande
- Formato não suportado
- Erro na API do TikTok

**Solução:**
- Verifique resposta no console do navegador (F12)
- Verifique logs do backend
- Tente vídeo menor

---

## ✅ Checklist Final

Quando todos os pontos passarem:

- [ ] Login OAuth funciona real
- [ ] Dados do usuário são recuperados
- [ ] Draft upload funciona
- [ ] Direct publish funciona
- [ ] Vídeos aparecem no TikTok
- [ ] Logout funciona
- [ ] Tokens seguros (servidor)
- [ ] Fluxo completo testado

---

## 📊 Evidências para o Vídeo

Quando tudo funcionar, para o vídeo de demonstração capture:

1. ✓ Login → Tela do TikTok → Autorizando → Dashboard
2. ✓ Draft Upload → Sucesso → Verificar no TikTok
3. ✓ Direct Publish → Sucesso → Verificar no TikTok
4. ✓ Logout → Retorna ao login

---

## 🚨 Se Algo Não Funcionar

Colete informações:

```bash
# 1. Logs do backend
npm run dev  # Veja mensagens de erro

# 2. Console do navegador
F12 → Console → Veja erros

# 3. Requisições de rede
F12 → Network → Veja status HTTP

# 4. Verifique .env
cat .env

# 5. Teste manualmente
curl -X GET "https://open.tiktokapis.com/v1/user/info/" \
  -H "Authorization: Bearer <seu_token>"
```

---

**Pronto para validar! 🚀**
