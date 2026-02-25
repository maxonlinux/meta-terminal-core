import { createClient } from "@clickhouse/client";
import { config } from "@/env.config";

export const sql = String.raw;

const asyncInsert: 0 | 1 = config.CH_ASYNC_INSERT === 1 ? 1 : 0;
const waitForAsyncInsert: 0 | 1 =
  config.CH_WAIT_FOR_ASYNC_INSERT === 1 ? 1 : 0;

export const clickhouse = createClient({
  url: config.CH_HOST,
  username: config.CH_USER,
  password: config.CH_PASSWORD,
  database: config.CH_DB,
  clickhouse_settings: {
    async_insert: asyncInsert,
    wait_for_async_insert: waitForAsyncInsert,
    async_insert_busy_timeout_ms: String(
      config.CH_ASYNC_INSERT_BUSY_TIMEOUT_MS,
    ),
    async_insert_max_data_size: String(config.CH_ASYNC_INSERT_MAX_DATA_SIZE),
    async_insert_max_query_number: String(
      config.CH_ASYNC_INSERT_MAX_QUERY_NUMBER,
    ),
  },
});
