FROM oven/bun:latest AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:latest AS build
WORKDIR /app
ARG CORE_URL
ENV CORE_URL=$CORE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM oven/bun:latest AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/bun.lock ./bun.lock
RUN bun install --frozen-lockfile --production
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["bun", "run", "start"]
