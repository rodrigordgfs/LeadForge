FROM mcr.microsoft.com/playwright:v1.49.0-jammy

WORKDIR /app

ENV PLAYWRIGHT_BROWSERS_PATH=0
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/worker/package.json apps/worker/
COPY packages/db/package.json packages/db/
COPY packages/queue/package.json packages/queue/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile --filter @leadforge/worker...

COPY apps/worker apps/worker
COPY packages/db packages/db
COPY packages/queue packages/queue
COPY packages/shared packages/shared

RUN pnpm --filter @leadforge/db db:generate \
  && pnpm turbo run build --filter=@leadforge/worker

WORKDIR /app/apps/worker

CMD ["node", "dist/index.js"]
