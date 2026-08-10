# 🧪 Sandbox vs Production - Erro `non_sandbox_target`

## O Erro que Recebeu

```
Não foi possível entrar com o TikTok. Isso pode ser devido a configurações específicas do app.

error_type=non_sandbox_target
```

## O Que Significa?

TikTok está rejeitando o login porque há um **mismatch entre Sandbox e Production**:

| Situação | Resultado |
|----------|-----------|
| App em SANDBOX + Conta REAL | ❌ `non_sandbox_target` |
| App em PRODUCTION + Conta SANDBOX | ❌ `non_sandbox_target` |
| App em SANDBOX + Conta SANDBOX | ✅ Funciona |
| App em PRODUCTION + Conta REAL | ✅ Funciona |

---

## 🔧 Como Corrigir

### **Passo 1: Verificar Modo da App no Portal TikTok**

1. Vá para: https://developer.tiktok.com/apps
2. Selecione sua app
3. Procure por: **"Sandbox" ou "Production"**
4. Anote qual modo sua app está

### **Passo 2: Atualizar .env Conforme o Modo**

#### **Se sua app está em SANDBOX (Modo de Testes):**

```env
TIKTOK_CLIENT_KEY=sbawom3osgvtdcjh12
TIKTOK_CLIENT_SECRET=JC19bDo5UrBFpti0xLyIyXCxP5PHkYSM
TIKTOK_REDIRECT_URI=https://vid.relampagodeofertas.shop/api/tiktok/callback

# 🧪 SANDBOX CONFIGURATION
TIKTOK_SANDBOX=true
TIKTOK_API_BASE_URL=https://open-sandbox.tiktokapis.com
```

**Importante:** Para testar em SANDBOX, você DEVE usar uma **conta de teste do TikTok**, não sua conta real!

#### **Se sua app está em PRODUCTION (Produção):**

```env
TIKTOK_CLIENT_KEY=sbawom3osgvtdcjh12
TIKTOK_CLIENT_SECRET=JC19bDo5UrBFpti0xLyIyXCxP5PHkYSM
TIKTOK_REDIRECT_URI=https://vid.relampagodeofertas.shop/api/tiktok/callback

# 🌐 PRODUCTION CONFIGURATION
TIKTOK_SANDBOX=false
TIKTOK_API_BASE_URL=https://open.tiktokapis.com
```

---

## 📋 Verificação Rápida

Após atualizar `.env`, verificar os logs do backend:

```
🚀 TikTok Video Publishing Backend
📍 Running on https://vid.relampagodeofertas.shop
🔐 TikTok OAuth configured
🧪 MODE: SANDBOX              ← Deve estar correto
🌐 API Base URL: https://open-sandbox.tiktokapis.com  ← Deve corresponder ao modo
```

Se os logs mostram:
- ✅ `🧪 MODE: SANDBOX` e URL termina com `-sandbox` = Correto para Sandbox
- ✅ `🌐 MODE: PRODUCTION` e URL não tem `-sandbox` = Correto para Production

---

## 🧪 Recomendação para Desenvolvimento

Para testar a app enquanto está sendo desenvolvida:

### **Usar SANDBOX:**
```env
TIKTOK_SANDBOX=true
TIKTOK_API_BASE_URL=https://open-sandbox.tiktokapis.com
```

**Por quê?**
- ✅ Pode testar com contas de teste
- ✅ Não afeta dados reais do TikTok
- ✅ Sem limite de requisições durante testes
- ✅ Ideal para desenvolvimento

### **Mudar para PRODUCTION:**
Quando tiver certeza de que tudo funciona e a app foi aprovada pelo TikTok:
```env
TIKTOK_SANDBOX=false
TIKTOK_API_BASE_URL=https://open.tiktokapis.com
```

---

## 🔑 Contas de Teste no TikTok Sandbox

Se estiver usando SANDBOX, precisa criar contas de teste:

1. Vá para: https://developer.tiktok.com/apps
2. Selecione sua app SANDBOX
3. Procure por: **"Test Accounts"** ou **"Contas de Teste"**
4. Crie uma conta de teste
5. Use a conta de teste para fazer login

**Importante:** Contas reais não funcionam em SANDBOX!

---

## 🚀 Passo a Passo Completo

### 1️⃣ Identificar Modo Atual
```
Vá para TikTok Developer Portal → Sua App → Procure por "Sandbox"
```

### 2️⃣ Atualizar .env
```env
# Se SANDBOX:
TIKTOK_SANDBOX=true
TIKTOK_API_BASE_URL=https://open-sandbox.tiktokapis.com

# Se PRODUCTION:
TIKTOK_SANDBOX=false
TIKTOK_API_BASE_URL=https://open.tiktokapis.com
```

### 3️⃣ Redeploy
```
EasyPanel → App → Restart
Aguarde ~30 segundos
```

### 4️⃣ Verificar Logs
```
EasyPanel → Logs → Procure por:
- "🧪 MODE: SANDBOX" ou "🌐 MODE: PRODUCTION"
- Verifique se é o que você quer
```

### 5️⃣ Testar Login
```
1. Acesse: https://vid.relampagodeofertas.shop/login.html
2. Clique: "Login with TikTok"
3. Faça login com:
   - Conta de TESTE se usando SANDBOX
   - Conta REAL se usando PRODUCTION
4. Autorize a app
```

### 6️⃣ Sucesso! 🎉
```
Deve ser redirecionado para o dashboard
Dashboard mostra: "Logged in as: [Seu Nome TikTok]"
```

---

## ⚠️ Erro Ainda Aparece?

Se ainda receber `non_sandbox_target`:

1. ✅ Confirme o modo da app no Portal TikTok
2. ✅ Verifique os logs do backend mostram o modo correto
3. ✅ Limpe o cache do navegador (Ctrl+Shift+Delete)
4. ✅ Use modo incógnito para testar
5. ✅ Se SANDBOX, use conta de TESTE (não real)
6. ✅ Se PRODUCTION, use conta REAL (não teste)

Se ainda não funcionar, consulte:
- `OAUTH_TROUBLESHOOTING.md` - Diagnóstico completo
- `OAUTH_QUICK_FIX.md` - Solução em 5 minutos

---

## 📊 Comparação: Sandbox vs Production

| Aspecto | Sandbox | Production |
|---------|---------|-----------|
| **URL** | `open-sandbox.tiktokapis.com` | `open.tiktokapis.com` |
| **Contas** | Contas de teste | Contas reais |
| **Dados** | Isolados | Reais |
| **Aprovação** | Não precisa | Precisa de aprovação TikTok |
| **Limites** | Alto limite | Limite por quota |
| **Recomendado para** | Desenvolvimento | Produção |

---

## 🎯 Conclusão

O erro `non_sandbox_target` significa que sua app e sua conta não estão no mesmo modo (Sandbox ou Production).

**Solução:** Atualize a variável `TIKTOK_SANDBOX` e `TIKTOK_API_BASE_URL` no `.env` para corresponder ao modo da sua app no TikTok Developer Portal.

Depois redeploy e teste novamente! ✅
