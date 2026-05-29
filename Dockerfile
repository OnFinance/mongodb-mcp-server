FROM node:24-alpine AS build

WORKDIR /src

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY tsconfig*.json ./
COPY src ./src
COPY server.json ./

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter @mongodb-js/mcp-metrics run compile \
    && pnpm --filter @mongodb-js/mcp-types run compile \
    && pnpm run build:esm \
    && pnpm run build:cjs

FROM node:24-alpine AS runtime

RUN addgroup -S mcp && adduser -S mcp -G mcp

WORKDIR /app

COPY --from=build /src/package.json ./
COPY --from=build /src/node_modules ./node_modules
COPY --from=build /src/packages ./packages
COPY --from=build /src/dist ./dist

ENV MDB_MCP_LOGGERS=stderr,mcp

USER mcp

EXPOSE 3000

ENTRYPOINT ["node", "/app/dist/esm/index.js"]
LABEL maintainer="OnFinance"
LABEL description="OnFinance hardened MongoDB MCP Server"
LABEL io.modelcontextprotocol.server.name="io.github.mongodb-js/mongodb-mcp-server"
