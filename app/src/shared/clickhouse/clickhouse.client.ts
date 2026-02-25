import { createClient } from "@clickhouse/client";
import { config } from "@/env.config";

export const sql = String.raw;

export const clickhouse = createClient({
  url: config.CH_HOST,
  username: config.CH_USER,
  password: config.CH_PASSWORD,
  database: config.CH_DB,
  clickhouse_settings: {
    async_insert: config.CH_ASYNC_INSERT,
    wait_for_async_insert: config.CH_WAIT_FOR_ASYNC_INSERT,
    async_insert_busy_timeout_ms: config.CH_ASYNC_INSERT_BUSY_TIMEOUT_MS,
    async_insert_max_data_size: config.CH_ASYNC_INSERT_MAX_DATA_SIZE,
    async_insert_max_query_number: config.CH_ASYNC_INSERT_MAX_QUERY_NUMBER,
  },
});
