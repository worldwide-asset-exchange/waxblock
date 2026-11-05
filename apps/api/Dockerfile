FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci --workspace=apps/api --omit=dev

COPY apps/api/src ./apps/api/src

# Keep relative cache paths and the app's .env location inside the API workspace.
WORKDIR /app/apps/api

# Run as the unprivileged `node` user, by NUMERIC id (uid 1000): Kubernetes runAsNonRoot refuses a user name. The cache directory must be writable by it; mount a
# volume at /app/apps/api/cache to keep the warm cache across restarts (optional — it rebuilds).
RUN mkdir -p cache && chown -R 1000:1000 cache
USER 1000:1000

ENV NODE_ENV=production
ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=8s --start-period=300s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-8080}/api/v1/health >/dev/null || exit 1

CMD ["node", "src/index.js"]
