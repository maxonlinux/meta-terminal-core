import { beforeAll, describe, expect, it } from "bun:test";
import { createClient } from "@clickhouse/client";

const BASE_URL = process.env.CORE_URL ?? "http://localhost:3000";
const CH_HOST = process.env.CH_HOST ?? "http://localhost:8123";
const CH_USER = process.env.CH_USER ?? "default";
const CH_PASSWORD = process.env.CH_PASSWORD ?? "";
const CH_DB = process.env.CH_DB ?? "default";

const symbol = "TESTBTCUSDT";
const baseTime = Date.UTC(2024, 0, 1, 0, 0, 0);

const clickhouse = createClient({
  url: CH_HOST,
  username: CH_USER,
  password: CH_PASSWORD,
  database: CH_DB,
});

async function command(query: string) {
  await clickhouse.command({ query });
}

async function fetchJson(path: string) {
  const res = await fetch(`${BASE_URL}${path}`);
  const text = await res.text();
  return {
    status: res.status,
    json: text ? JSON.parse(text) : null,
  };
}

async function seedTicks() {
  await command(`
    CREATE TABLE IF NOT EXISTS ticks (
      symbol String,
      price Float64,
      volume Float64,
      timestamp DateTime
    ) ENGINE = MergeTree()
    PARTITION BY toYYYYMMDD(timestamp)
    ORDER BY (symbol, timestamp)
  `);

  await command(`
    CREATE TABLE IF NOT EXISTS candles_1m (
      symbol String,
      time DateTime,
      open AggregateFunction(argMin, Float64, DateTime),
      high SimpleAggregateFunction(max, Float64),
      low SimpleAggregateFunction(min, Float64),
      close AggregateFunction(argMax, Float64, DateTime),
      volume SimpleAggregateFunction(sum, Float64)
    ) ENGINE = AggregatingMergeTree
    PARTITION BY toYYYYMM(time)
    ORDER BY (symbol, time)
  `);

  await command(`
    CREATE TABLE IF NOT EXISTS candles_30m (
      symbol String,
      time DateTime,
      open AggregateFunction(argMin, Float64, DateTime),
      high SimpleAggregateFunction(max, Float64),
      low SimpleAggregateFunction(min, Float64),
      close AggregateFunction(argMax, Float64, DateTime),
      volume SimpleAggregateFunction(sum, Float64)
    ) ENGINE = AggregatingMergeTree
    PARTITION BY toYYYYMM(time)
    ORDER BY (symbol, time)
  `);

  await command(`
    CREATE TABLE IF NOT EXISTS candles_1h (
      symbol String,
      time DateTime,
      open AggregateFunction(argMin, Float64, DateTime),
      high SimpleAggregateFunction(max, Float64),
      low SimpleAggregateFunction(min, Float64),
      close AggregateFunction(argMax, Float64, DateTime),
      volume SimpleAggregateFunction(sum, Float64)
    ) ENGINE = AggregatingMergeTree
    PARTITION BY toYYYYMM(time)
    ORDER BY (symbol, time)
  `);

  const rows: Array<{
    symbol: string;
    price: number;
    volume: number;
    timestamp: string;
  }> = [];

  for (let i = 0; i < 120; i += 1) {
    const ts = new Date(baseTime + i * 60_000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    rows.push({
      symbol,
      price: 10000 + i,
      volume: 1,
      timestamp: ts,
    });
  }

  await clickhouse.insert({
    table: "ticks",
    values: rows,
    format: "JSONEachRow",
  });

  await command(`
    INSERT INTO candles_1m
    SELECT
      symbol,
      toStartOfMinute(timestamp) AS time,
      argMinState(price, timestamp) open,
      max(price) AS high,
      min(price) AS low,
      argMaxState(price, timestamp) close,
      sum(volume) AS volume
    FROM ticks
    WHERE symbol = '${symbol}'
    GROUP BY symbol, time
  `);

  await command(`
    INSERT INTO candles_30m
    SELECT
      symbol,
      toStartOfInterval(timestamp, INTERVAL 1800 SECOND) AS time,
      argMinState(price, timestamp) open,
      max(price) AS high,
      min(price) AS low,
      argMaxState(price, timestamp) close,
      sum(volume) AS volume
    FROM ticks
    WHERE symbol = '${symbol}'
    GROUP BY symbol, time
  `);

  await command(`
    INSERT INTO candles_1h
    SELECT
      symbol,
      toStartOfInterval(timestamp, INTERVAL 3600 SECOND) AS time,
      argMinState(price, timestamp) open,
      max(price) AS high,
      min(price) AS low,
      argMaxState(price, timestamp) close,
      sum(volume) AS volume
    FROM ticks
    WHERE symbol = '${symbol}'
    GROUP BY symbol, time
  `);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function expectCandle(value: unknown) {
  expect(value).toBeTruthy();
  if (!isRecord(value)) {
    return;
  }
  expect(typeof value.time).toBe("number");
  expect(typeof value.open).toBe("number");
  expect(typeof value.high).toBe("number");
  expect(typeof value.low).toBe("number");
  expect(typeof value.close).toBe("number");
  expect(typeof value.volume).toBe("number");
}

beforeAll(async () => {
  await seedTicks();
});

describe("candles aggregation", () => {
  it("builds 1h candles correctly", async () => {
    const { status, json } = await fetchJson(
      `/candles?symbol=${symbol}&interval=3600&outputsize=2`,
    );
    expect(status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    if (!Array.isArray(json) || json.length < 2) {
      return;
    }
    const sorted = [...json].sort((a, b) => a.time - b.time);
    const first = sorted[0];
    const second = sorted[1];
    expectCandle(first);
    expectCandle(second);
    expect(first.open).toBe(10000);
    expect(first.close).toBe(10059);
    expect(first.high).toBe(10059);
    expect(first.low).toBe(10000);
    expect(first.volume).toBe(60);
    expect(second.open).toBe(10060);
    expect(second.close).toBe(10119);
    expect(second.high).toBe(10119);
    expect(second.low).toBe(10060);
    expect(second.volume).toBe(60);
  });

  it("builds 45m candles from 30m base", async () => {
    const { status, json } = await fetchJson(
      `/candles?symbol=${symbol}&interval=2700&outputsize=2`,
    );
    expect(status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    if (!Array.isArray(json) || json.length < 2) {
      return;
    }
    const sorted = [...json].sort((a, b) => a.time - b.time);
    const first = sorted[0];
    const second = sorted[1];
    expectCandle(first);
    expectCandle(second);
    expect(first.open).toBe(10000);
    expect(first.close).toBe(10044);
    expect(first.high).toBe(10044);
    expect(first.low).toBe(10000);
    expect(first.volume).toBe(45);
    expect(second.open).toBe(10045);
    expect(second.close).toBe(10089);
    expect(second.high).toBe(10089);
    expect(second.low).toBe(10045);
    expect(second.volume).toBe(45);
  });
});
