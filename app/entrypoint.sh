#!/bin/sh

echo "📦 Running SQLite migrations..."
bun x knex migrate:latest --env production --knexfile ./knexfile.ts

echo "📦 Running ClickHouse migrations..."
node node_modules/.bin/clickhouse-migrations migrate --host="${CH_HOST}" --user="${CH_USER}" --password="${CH_PASSWORD}" --migrations-home=./migrations/ch --db="${CH_DB}"

if [ "$RUN_BACKFILL" = "true" ]; then
    echo "📊 Running candle backfill..."
    echo "⚠️ Backfill requires clickhouse-client"
fi

echo "✅ Starting app..."
if [ "$BUN_PROFILING" = "true" ]; then
    PROFILE_DIR="${BUN_PROFILE_DIR:-/app/profiles}"
    mkdir -p "$PROFILE_DIR"
    BUN_OPTIONS="--cpu-prof --heap-prof --cpu-prof-dir=${PROFILE_DIR} --heap-prof-dir=${PROFILE_DIR} ${BUN_OPTIONS}"
fi

exec bun ${BUN_OPTIONS:-} run dist/index.js
