FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile --filter=@onyx/web...

FROM base AS build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app ./
COPY apps/web ./apps/web
COPY packages ./packages
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter=@onyx/web build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
RUN mkdir -p /app/apps/web/.next/cache && chown nextjs:nodejs /app/apps/web/.next/cache
USER nextjs
EXPOSE 8080
ENV HOSTNAME=0.0.0.0
ENV PORT=8080
CMD ["node", "apps/web/server.js"]
