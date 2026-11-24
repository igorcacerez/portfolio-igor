FROM node:24-alpine AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:24-alpine AS production

ENV NODE_ENV=production \
    PORT=80 \
    DATA_DIR=/data \
    DIST_DIR=/app/dist

WORKDIR /app
COPY server ./server
COPY --from=build /app/dist ./dist

# banco SQLite e arquivos dos slides ficam aqui — monte um volume em /data no EasyPanel
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/health || exit 1

CMD ["node", "--disable-warning=ExperimentalWarning", "server/index.mjs"]
