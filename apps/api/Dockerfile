FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile --filter=@onyx/api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages
COPY apps/api ./apps/api
COPY packages ./packages
RUN pnpm --filter=@onyx/db db:generate
# Compile TypeScript to dist/ — no tsx in production
RUN pnpm --filter=@onyx/api build:prod

FROM base AS runner
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodeapp
# Only copy compiled output and production node_modules — no source or tsx
COPY --from=build --chown=nodeapp:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodeapp:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=nodeapp:nodejs /app/packages ./packages
WORKDIR /app/apps/api
USER nodeapp
EXPOSE 4000
CMD ["node", "dist/index.js"]
