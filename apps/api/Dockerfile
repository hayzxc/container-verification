FROM node:20-alpine AS base
RUN corepack enable

FROM base AS builder
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
RUN pnpm --filter @container-verification/shared build

# Generate Prisma client
RUN pnpm --filter @container-verification/api prisma:generate

# Build API
RUN pnpm --filter @container-verification/api build

# Prune dev dependencies
RUN pnpm install --prod --frozen-lockfile

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy everything needed for production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

EXPOSE 3001

CMD ["node", "apps/api/dist/server.js"]
