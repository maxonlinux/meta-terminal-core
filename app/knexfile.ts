import type { Knex } from "knex";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "assets.sqlite");

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "sqlite3",
    connection: {
      filename: DB_PATH,
    },
    useNullAsDefault: true,
    migrations: {
      tableName: "knex_migrations",
      directory: "./migrations/sqlite",
    },
  },

  production: {
    client: "sqlite3",
    connection: {
      filename: DB_PATH,
    },
    useNullAsDefault: true,
    migrations: {
      tableName: "knex_migrations",
      directory: "./migrations/sqlite",
    },
  },
};

export default config;
