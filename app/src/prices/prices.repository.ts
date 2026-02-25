import { clickhouse, sql } from "@/shared/clickhouse/clickhouse.client";
import type { TickData } from "./prices.types";

export class PricesRepository {
  // Keep an in-memory snapshot of the last tick per symbol.
  private lastTicks = new Map<string, TickData>();

  // Return the last in-memory tick (if any).
  getLastPriceFromMemory = (symbol: string) => {
    return this.lastTicks.get(symbol) ?? null;
  };

  cacheTick = (data: Omit<TickData, "volume">) => {
    const tick: TickData = { ...data, volume: 0 };
    this.lastTicks.set(tick.symbol, tick);
    return tick;
  };

  getLastPriceFromCandle = async (symbol: string) => {
    const query = sql`
      SELECT
        argMax(close, time)  AS price,
        max(time)           AS timestamp
      FROM candles_1m
      WHERE symbol = {symbol:String}
      `;

    const result = await clickhouse.query({
      query,
      query_params: { symbol },
      format: "JSONEachRow",
    });

    const data = await result.json<{
      price: number;
      timestamp: number;
    }>();

    if (data.length) {
      return data[0];
    }

    return null;
  };

  getLastPrice = async (symbol: string) => {
    const query = sql`
      SELECT
        price,
        toUnixTimestamp(timestamp) AS timestamp,
        volume
      FROM ticks
      WHERE symbol = {symbol:String}
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const result = await clickhouse.query({
      query,
      query_params: { symbol },
      format: "JSONEachRow",
    });

    const data = await result.json<TickData>();

    if (data.length) {
      return data[0];
    }

    return null;
  };

  savePriceTick = async (data: Omit<TickData, "volume">) => {
    const tick = this.cacheTick(data);
    await this.insertTicks([tick]);
  };

  insertTicks = async (ticks: TickData[]) => {
    if (!ticks.length) return;

    await clickhouse.insert({
      table: "ticks",
      values: ticks,
      format: "JSONEachRow",
    });
  };
}

export const pricesRepo = new PricesRepository();
