# Como Fazer Deploy

## Pré-requisitos

- Node.js 14+ instalado
- npm ou yarn
- Domínio HTTPS (obrigatório para TikTok)
- Servidor com suporte a Node.js

## Deploy Local (Desenvolvimento)

### 1. Clonar/Preparar Repositório

```bash
cd ~/tiktok
npm install
```

### 2. Configurar .env

```bash
cp .env.example .env

# Editar .env com suas credenciais
nano .env
```

### 3. Iniciar Servidor

```bash
npm run dev
```

Acesse: `http://localhost:3000`

---

## Deploy em Produção (VPS/Cloud)

### Opção A: Usando PM2 (Recomendado)

#### 1. Instalar PM2 globalmente

```bash
npm install -g pm2
```

#### 2. Clonar repositório

```bash
cd /var/www
git clone https://github.com/willsantos95/tiktok.git
cd tiktok
npm install --production
```

#### 3. Configurar .env

```bash
cp .env.example .env
nano .env

# Editar com suas credenciais:
TIKTOK_CLIENT_KEY=sbawom3osgvtdcjh12
TIKTOK_CLIENT_SECRET=JC19bDo5UrBFpti0xLyIyXCxP5PHkYSM
TIKTOK_REDIRECT_URI=https://vid.relampagodeofertas.shop/api/tiktok/callback
CORS_ORIGIN=https://vid.relampagodeofertas.shop
NODE_ENV=production
SESSION_SECRET=change-to-strong-random-string
```

#### 4. Iniciar com PM2

```bash
pm2 start server.js --name "tiktok-backend"
pm2 save
pm2 startup
```

#### 5. Verificar Status

```bash
pm2 status
pm2 logs
```

---

### Opção B: Usando Docker

#### 1. Criar Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### 2. Criar .dockerignore

```
node_modules
npm-debug.log
.env
.git
uploads
```

#### 3. Build e Run

```bash
docker build -t tiktok-backend .

docker run -d \
  --name tiktok-backend \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  tiktok-backend
```

---

### Opção C: Usando Heroku

#### 1. Instalar Heroku CLI

```bash
npm install -g heroku
heroku login
```

#### 2. Criar aplicação Heroku

```bash
heroku create seu-app-name
```

#### 3. Configurar variáveis de ambiente

```bash
heroku config:set TIKTOK_CLIENT_KEY=sbawom3osgvtdcjh12
heroku config:set TIKTOK_CLIENT_SECRET=JC19bDo5UrBFpti0xLyIyXCxP5PHkYSM
heroku config:set TIKTOK_REDIRECT_URI=https://seu-app-name.herokuapp.com/api/tiktok/callback
heroku config:set CORS_ORIGIN=https://seu-app-name.herokuapp.com
heroku config:set SESSION_SECRET=sua-chave-secreta
heroku config:set NODE_ENV=production
```

#### 4. Deploy

```bash
git push heroku main
```

---

## Configurar Nginx (Reverse Proxy)

### 1. Instalar Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 2. Criar arquivo de configuração

```bash
sudo nano /etc/nginx/sites-available/tiktok
```

```nginx
server {
    listen 80;
    server_name vid.relampagodeofertas.shop;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vid.relampagodeofertas.shop;

    # Certificados SSL (usar certbot do Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/vid.relampagodeofertas.shop/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vid.relampagodeofertas.shop/privkey.pem;

    # Configurações de segurança
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Headers de segurança
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy para a aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Servir arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Habilitar site

```bash
sudo ln -s /etc/nginx/sites-available/tiktok /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Configurar SSL com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d vid.relampagodeofertas.shop
```

---

## Configurar Let's Encrypt SSL

### Usando Certbot

```bash
sudo apt install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot certonly --standalone -d vid.relampagodeofertas.shop

# Auto-renovação
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Monitoramento

### PM2 Monitoring

```bash
# Instalar monitoramento
pm2 install pm2-logrotate

# Visualizar em tempo real
pm2 monit

# Gerar relatório
pm2 report
```

### Logs

```bash
# Ver logs
pm2 logs tiktok-backend

# Limpar logs
pm2 flush

# Configurar rotação
pm2 install pm2-auto-pull
```

---

## Backup

### Backup de Dados

```bash
# Criar backup
tar -czf backup-$(date +%Y%m%d).tar.gz \
  .env \
  uploads/ \
  node_modules/

# Restaurar backup
tar -xzf backup-20240101.tar.gz
```

---

## Troubleshooting

### Porta 3000 já está em uso

```bash
# Encontrar processo
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou usar porta diferente
PORT=8000 npm start
```

### Erro de conexão com TikTok

1. Verifique credenciais no .env
2. Confirme CORS_ORIGIN
3. Verifique se HTTPS está ativo
4. Confirme callback URL no TikTok Developer Portal

### Permissão negada ao salvar uploads

```bash
# Criar diretório
mkdir -p uploads

# Definir permissões
chmod 755 uploads
chown $USER:$USER uploads
```

---

## Checklist de Segurança

- [ ] HTTPS habilitado
- [ ] SESSION_SECRET alterado
- [ ] .env não commitado no Git
- [ ] firewall configurado
- [ ] Rate limiting ativo
- [ ] Logs monitorados
- [ ] Backups automáticos
- [ ] SSL atualizado
- [ ] Dependências atualizadas
- [ ] Node.js versão estável

---

## Próximos Passos

1. Fazer deploy da aplicação
2. Testar login com TikTok
3. Testar upload de vídeo
4. Gravar vídeo de demonstração
5. Enviar para revisão do TikTok
