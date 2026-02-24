# -----------------------------
# Base
# -----------------------------
FROM node:22-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# -----------------------------
# Development
# -----------------------------
FROM base AS development
COPY . .
CMD ["npm", "run", "start:dev"]

# -----------------------------
# Build
# -----------------------------
FROM base AS builder
COPY . .
RUN npm run build

# -----------------------------
# Production
# -----------------------------
FROM node:22-slim AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main.js"]
