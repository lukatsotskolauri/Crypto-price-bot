# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ── Stage 2: production runtime ─────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Non-root user for least-privilege execution
RUN addgroup -S bot && adduser -S bot -G bot

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

USER bot

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]