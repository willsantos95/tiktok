# Multi-stage: Node.js + Nginx in one container
FROM node:22-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install --production

# Final stage
FROM nginx:1.27-alpine

# Install Node.js in Nginx container
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy Node.js files
COPY package*.json ./
COPY server.js ./
COPY .env.example ./.env

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static files
COPY . /usr/share/nginx/html

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Create startup script
RUN cat > /start.sh << 'EOF'
#!/bin/sh

# Start Node.js backend in background
echo "Starting Node.js backend..."
npm start &
NODE_PID=$!

# Start Nginx in foreground
echo "Starting Nginx..."
nginx -g "daemon off;"

# Clean up on exit
trap "kill $NODE_PID" EXIT
EOF

RUN chmod +x /start.sh

# Expose ports
EXPOSE 80 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

# Start both services
CMD ["/start.sh"]
