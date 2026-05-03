FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json for the web app
COPY apps/web/package.json apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/web/ apps/web/

# Build Astro
WORKDIR /app/apps/web
RUN pnpm build

EXPOSE 3007
ENV HOST=0.0.0.0
ENV PORT=3007
CMD ["node", "dist/server/entry.mjs"]
