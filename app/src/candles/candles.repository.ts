import { clickhouse, sql } from "@/shared/clickhouse/clickhouse.client";
import type { CandleData } from "./candles.types";

const TIMEFRAME_TABLES: Record<number, string> = {
  60: "candles_1m",
  300: "candles_5m",
  900: "candles_15m",
  1800: "candles_30m",
  3600: "candles_1h",
  14400: "candles_4h",
  86400: "candles_1d",
};

const MIN_INTERVAL = 60;

const STANDARD_INTERVALS = Object.keys(TIMEFRAME_TABLES)
  .map(Number)
  .sort((a, b) => b - a);

export function getBaseInterval(interval: number): number {
  for (const standard of STANDARD_INTERVALS) {
    if (standard <= interval) return standard;
  }
  // fallback min 60 (1 min)
  return MIN_INTERVAL;
}

export function getTableForInterval(interval: number): string {
  const baseInterval = getBaseInterval(interval);
  const res = TIMEFRAME_TABLES[baseInterval] || TIMEFRAME_TABLES[MIN_INTERVAL];
  if (!res) throw new Error("Invalid interval");
  return res;
}

class CandlesRepository {
  getCandles = async (
    symbol: string,
    interval: number,
    outputsize: number = 50,
    before?: number,
  ) => {
    const table = getTableForInterval(interval);

    const query = sql`
      SELECT
        symbol,
        toUnixTimestamp(toStartOfInterval(time, INTERVAL {interval:UInt32} SECOND)) AS time,
        argMinMerge(open) AS open,
        max(high) AS high,
        min(low) AS low,
        argMaxMerge(close) AS close,
        sum(volume) AS volume
      FROM ${table}
      WHERE symbol = {symbol:String}
        AND ({before:Nullable(UInt64)} IS NULL OR toUnixTimestamp(time) <= {before:Nullable(UInt64)})
      GROUP BY symbol, time
      ORDER BY time DESC
      LIMIT {outputsize:UInt32}
    `;

    const result = await clickhouse.query({
      query,
      format: "JSONEachRow",
      query_params: {
        symbol,
        interval,
        outputsize,
        before: before,
      },
    });

    return await result.json<CandleData>();
  };

  getLastCandle = async (symbol: string, interval: number) => {
    const table = TIMEFRAME_TABLES[MIN_INTERVAL];

    const result = await clickhouse.query({
      query: sql`
        SELECT
          symbol,
          toUnixTimestamp(toStartOfInterval(time, INTERVAL ${interval} SECOND)) AS time,
          argMinMerge(open) AS open,
          max(high) AS high,
          min(low) AS low,
          argMaxMerge(close) AS close,
          sum(volume) AS volume
        FROM ${table}
        WHERE symbol = {symbol:String}
        GROUP BY symbol, time
        ORDER BY time DESC
        LIMIT 1
      `,
      format: "JSONEachRow",
      query_params: {
        symbol,
      },
    });

    const data = await result.json<CandleData>();

    if (data.length) {
      return data[0];
    }

    return null;
  };
}

export const candlesRepo = new CandlesRepository();
