FROM node:22-slim AS base
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/engine/package.json ./packages/engine/
RUN pnpm install --frozen-lockfile --filter @veil/engine
COPY packages/engine/tsconfig.json ./packages/engine/
COPY packages/engine/src ./packages/engine/src
RUN pnpm --filter @veil/engine build

FROM base AS runtime
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/engine/package.json ./packages/engine/
RUN pnpm install --frozen-lockfile --filter @veil/engine --prod
COPY --from=build /app/packages/engine/dist ./packages/engine/dist

ENV PORT=3100
ENV HOST=0.0.0.0
EXPOSE 3100

CMD ["node", "packages/engine/dist/index.js"]
