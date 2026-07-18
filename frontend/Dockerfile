# syntax=docker/dockerfile:1.6
# --------------------------------------------------------------------------- #
# ProjectFlow frontend — production image                                    #
# Assumes a Vite + React build (`npm run build` -> ./dist). If this is CRA    #
# or another tool, swap the build script / output dir below.                 #
# Stage 1 builds static assets. Stage 2 serves them with a hardened,          #
# non-root nginx — no Node runtime, no dev server, shipped in production.    #
# --------------------------------------------------------------------------- #

# ---- Stage 1: build static assets ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps first so this layer is cached unless package.json changes
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: serve with a non-root, hardened nginx ----
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

USER root

# SPA-aware config: client-side routing fallback, gzip, security headers,
# long-lived caching for hashed static assets, and a lightweight healthcheck
# endpoint. Runs on 8080 because nginx-unprivileged can't bind < 1024.
RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml text/javascript image/svg+xml;

    location = /healthz {
        access_log off;
        default_type text/plain;
        return 200 "ok\n";
    }

    location ~* \.(?:css|js|mjs|svg|woff2?|ttf|eot|png|jpe?g|gif|ico|webp)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/healthz >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
