import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable("assets");
  if (exists) {
    return;
  }
  await knex.schema.createTable("assets", (table) => {
    table.text("symbol").primary();
    table.text("type").notNullable();
    table.text("exchange").notNullable();
    table.text("description").notNullable();
    table.text("base_asset").notNullable();
    table.text("quote_asset").notNullable();
    table.text("image_url");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("assets");
}
