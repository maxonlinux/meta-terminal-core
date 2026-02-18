# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN bun run build

# Production stage
FROM oven/bun:latest AS production

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY package.json bun.lock ./
RUN bun install --production
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
