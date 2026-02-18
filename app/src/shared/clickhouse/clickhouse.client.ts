import { createClient } from "@clickhouse/client";
import { config } from "@/env.config";

export const sql = String.raw;

export const clickhouse = createClient({
  url: config.CH_HOST,
  username: config.CH_USER,
  password: config.CH_PASSWORD,
  database: config.CH_DB,
});
