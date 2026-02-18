import { describe, test } from "bun:test";

const BASE_URL = process.env.CORE_URL ?? "http://localhost:3000";

async function fetchCandles(interval: number, outputsize: number) {
  const params = new URLSearchParams({
    symbol: "BTCUSDT",
    interval: String(interval),
    outputsize: String(outputsize),
  });
  const res = await fetch(`${BASE_URL}/candles?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`candles request failed: ${res.status}`);
  }
  await res.json();
}

describe("candles throughput", () => {
  test("/candles 1h outputsize=200", async () => {
    await fetchCandles(3600, 200);
  });
});
