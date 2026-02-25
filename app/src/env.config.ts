import { bool, cleanEnv, num, str, url } from "envalid";

const rawConfig = cleanEnv(process.env, {
  PORT: num({ example: "3100" }),

  JWT_SECRET: str({ example: "xxxxxxxxxxxxxxxxxxxxxxxx" }),
  COOKIE_SECRET: str({ example: "xxxxxxxxxxxxxxxxxxxxxxxx" }),

  NATS_URL: url({ example: "nats://localhost:4222" }),
  NATS_TOKEN: str({ example: "xxxxxxxxxxxxxxxxxxxxxxxx" }),
  NATS_TOPIC: str({ example: "core.price" }),
  NATS_BATCH_INTERVAL_MS: num({ default: 500 }),
  NATS_BATCH_SIZE: num({ default: 1000 }),

  CH_HOST: url({ example: "http://localhost:8123" }),
  CH_USER: str({ example: "default" }),
  CH_PASSWORD: str({ example: "default" }),
  CH_DB: str({ example: "default" }),
  CH_ASYNC_INSERT: num({ default: 1 }),
  CH_WAIT_FOR_ASYNC_INSERT: num({ default: 1 }),
  CH_ASYNC_INSERT_BUSY_TIMEOUT_MS: num({ default: 500 }),
  CH_ASYNC_INSERT_MAX_DATA_SIZE: num({ default: 10_485_760 }),
  CH_ASYNC_INSERT_MAX_QUERY_NUMBER: num({ default: 450 }),

  COOKIE_TOKEN_NAME: str({
    example: "meta_core_token",
    default: "meta_core_token",
  }),

  VERBOSE: bool({
    default: false,
  }),

  LOG_LEVEL: str({
    choices: ["trace", "debug", "info", "warning", "error", "fatal"],
    default: "info",
  }),

  NODE_ENV: str({
    choices: ["development", "test", "production", "staging"],
    default: "development",
  }),
});

export const config = {
  ...rawConfig,
};
