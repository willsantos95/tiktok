# TikTok API Integration Setup

## Visão Geral

Este aplicativo integra-se com a API do TikTok para permitir que usuários façam login com suas contas TikTok e publiquem vídeos diretamente.

## Fluxo de Autenticação OAuth

```
Usuário clica "Login with TikTok"
    ↓
Frontend solicita URL de autenticação ao backend
    ↓
Backend retorna URL de autorização do TikTok
    ↓
Usuário é redirecionado para TikTok OAuth
    ↓
Usuário autoriza a aplicação
    ↓
TikTok redireciona para /api/tiktok/callback com código
    ↓
Backend troca código por access token
    ↓
Backend armazena token na sessão
    ↓
Usuário é redirecionado ao dashboard
```

## Instalação

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Credenciais

Crie um arquivo `.env` na raiz do projeto com suas credenciais:

```bash
cp .env.example .env
```

Atualize o arquivo `.env` com suas credenciais:

```env
TIKTOK_CLIENT_KEY=sbawom3osgvtdcjh12
TIKTOK_CLIENT_SECRET=JC19bDo5UrBFpti0xLyIyXCxP5PHkYSM
TIKTOK_REDIRECT_URI=https://vid.relampagodeofertas.shop/api/tiktok/callback
CORS_ORIGIN=https://vid.relampagodeofertas.shop
```

### 3. Iniciar o Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

O servidor estará rodando em `http://localhost:3000`

## Endpoints da API

### Autenticação

#### `GET /api/tiktok/auth-url`
Retorna a URL de autorização do TikTok.

**Resposta:**
```json
{
  "authUrl": "https://www.tiktok.com/v1/oauth/authorize/?..."
}
```

#### `POST /api/tiktok/callback`
Callback do OAuth que troca o código por um token de acesso.

**Body:**
```json
{
  "code": "authorization_code",
  "state": "state_parameter"
}
```

**Resposta:**
```json
{
  "success": true,
  "user": {
    "openId": "user_open_id",
    "displayName": "User Display Name",
    "avatarUrl": "https://...",
    "accessToken": "access_token",
    "expiresAt": "2024-12-31T23:59:59Z"
  },
  "accessToken": "access_token"
}
```

#### `GET /api/tiktok/user`
Retorna informações do usuário autenticado.

**Resposta:**
```json
{
  "user": {
    "openId": "user_open_id",
    "displayName": "User Display Name",
    "avatarUrl": "https://..."
  }
}
```

#### `POST /api/tiktok/logout`
Encerra a sessão do usuário.

**Resposta:**
```json
{
  "success": true
}
```

### Upload de Vídeos

#### `POST /api/tiktok/upload-draft`
Faz upload de um vídeo como rascunho (draft).

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (FormData):**
```
video: <arquivo de vídeo>
caption: "Descrição do vídeo"
```

**Resposta:**
```json
{
  "success": true,
  "message": "Video uploaded as draft",
  "data": {
    "video_id": "...",
    "publish_token": "..."
  }
}
```

#### `POST /api/tiktok/publish`
Faz upload e publica um vídeo diretamente.

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (FormData):**
```
video: <arquivo de vídeo>
caption: "Descrição do vídeo"
hashtags: "#trending #foryoupage"
```

**Resposta:**
```json
{
  "success": true,
  "message": "Video published successfully",
  "data": {
    "video_id": "...",
    "publish_url": "https://www.tiktok.com/@user/video/..."
  }
}
```

## Escopos Solicitados

A aplicação solicita os seguintes escopos ao TikTok:

1. **user.info.basic** - Acesso a informações básicas do perfil do usuário
2. **video.upload** - Permissão para fazer upload de vídeos como rascunho
3. **video.publish** - Permissão para publicar vídeos diretamente

## Gerenciamento de Tokens

### Armazenamento Seguro

- **Access tokens** são armazenados na sessão do servidor (seguro)
- **Refresh tokens** são usados para renovar tokens expirados
- **Tokens não são armazenados no localStorage** (protege contra XSS)

### Refresh Automático

O servidor verifica automaticamente se o token está expirado antes de fazer chamadas à API do TikTok. Se o token estiver prestes a expirar (menos de 5 minutos), um novo token é solicitado usando o refresh token.

## Upload de Vídeos

### Limitações

- Tamanho máximo: 2GB
- Formatos suportados: MP4, MOV, WebM
- O servidor carrega o vídeo em chunks

### Fluxo de Upload

1. **Inicialização**: O servidor obtém um token de upload do TikTok
2. **Upload de Chunks**: O arquivo de vídeo é enviado em partes
3. **Finalização**: O servidor confirma o upload e publica (ou salva como draft)

## Tratamento de Erros

Todos os endpoints retornam detalhes de erro em caso de falha:

```json
{
  "error": "Mensagem de erro geral",
  "details": "Detalhes técnicos da API do TikTok"
}
```

## Sandbox vs Produção

### Sandbox
- Use para testes
- Defina `TIKTOK_SANDBOX=true`
- Vídeos não são publicados em contas reais

### Produção
- Use para produção
- Defina `TIKTOK_SANDBOX=false`
- Vídeos são publicados em contas reais
- Requer aprovação do TikTok

## Variáveis de Ambiente

```env
# Credenciais TikTok
TIKTOK_CLIENT_KEY=seu_client_key
TIKTOK_CLIENT_SECRET=seu_client_secret
TIKTOK_REDIRECT_URI=https://seu-dominio.com/api/tiktok/callback
TIKTOK_API_BASE_URL=https://open.tiktokapis.com

# Configurações do Servidor
PORT=3000
NODE_ENV=production
SESSION_SECRET=sua-chave-secreta-super-segura

# CORS
CORS_ORIGIN=https://seu-dominio.com

# Modo Sandbox
TIKTOK_SANDBOX=true
```

## Troubleshooting

### Erro 403: Invalid Client Key
- Verifique se o `TIKTOK_CLIENT_KEY` está correto
- Confirme se a aplicação está registrada no TikTok Developer Portal

### Erro 400: Invalid Redirect URI
- O `TIKTOK_REDIRECT_URI` deve corresponder ao registrado no TikTok Developer Portal
- Deve usar HTTPS (exceto para localhost em desenvolvimento)

### Erro de Upload: File Too Large
- O arquivo de vídeo excede 2GB
- Divida o arquivo em partes menores

### Erro de Autenticação: Invalid State
- O parâmetro `state` não corresponde
- Pode indicar ataque CSRF
- Limpe cookies e tente novamente

## Segurança

### Boas Práticas Implementadas

1. **Tokens não armazenados no cliente** - Protege contra XSS
2. **HTTPS obrigatório** - Protege contra ataques man-in-the-middle
3. **Validação de state** - Protege contra ataques CSRF
4. **Refresh automático** - Limita o tempo de vida dos tokens
5. **Session segura** - Cookies HTTP-only com proteção

### Recomendações

1. Use HTTPS em produção
2. Configure `SESSION_SECRET` com uma string criptográfica forte
3. Mantenha `TIKTOK_CLIENT_SECRET` seguro (nunca commit no Git)
4. Monitore logs para atividades suspeitas
5. Implemente rate limiting para endpoints públicos

## Próximos Passos

1. Instale as dependências: `npm install`
2. Configure o arquivo `.env`
3. Inicie o servidor: `npm start`
4. Acesse http://localhost:3000
5. Teste o fluxo de login com sua conta TikTok Sandbox
6. Grave um vídeo de demonstração
7. Envie para revisão do TikTok

## Referências

- [TikTok Login Kit Documentation](https://developers.tiktok.com/doc/login-kit-overview)
- [TikTok Video Upload Documentation](https://developers.tiktok.com/doc/video-upload-api)
- [TikTok API Reference](https://developers.tiktok.com/doc/api-reference)
