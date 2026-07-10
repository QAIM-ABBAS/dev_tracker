# syntax=docker/dockerfile:1.6

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

ENV CI=true
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .
# Backend reachable inside docker-compose network as http://backend:8000.
# The Vite proxy in dev handles /api -> http://localhost:8000; in the built
# static bundle we rely on nginx to reverse-proxy /api to the backend service.
RUN npm run build

# ---- Runtime stage (nginx) ----
FROM nginx:1.27-alpine AS runtime

# nginx config that serves the SPA and proxies /api -> backend:8000
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
