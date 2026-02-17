FROM node:18-alpine

WORKDIR /app

# Optional runtime deps (used by `packages/train-ai-worker/src/processor/utils/yt-dlp.ts`)
RUN apk update && apk add --no-cache yt-dlp ffmpeg

# Enable pnpm (repo uses pnpm workspaces)
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Install dependencies (workspace)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# Build only the worker package
RUN pnpm --filter @repo/train-ai-worker build

CMD ["pnpm", "--filter", "@repo/train-ai-worker", "start"]
