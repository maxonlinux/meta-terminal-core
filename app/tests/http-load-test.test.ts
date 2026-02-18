import { test, expect } from "bun:test";

const HOST = "localhost";
const PORT = 3030;
const PATH = "/api/candles";

const CONNECTIONS = 5000;
const CONCURRENCY = 50;
const MAX_FAILURE_RATE = 0.05;
const INTERVALS = [60, 300, 900, 1800, 3600];
const SYMBOLS = ["BTCUSDT", "ETHUSDT"];
const BEFORE_SPAN = 24 * 3600;

function buildUrl(now: number) {
  const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const interval = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
  const before = now - Math.floor(Math.random() * BEFORE_SPAN);

  const query = new URLSearchParams({
    symbol,
    interval: String(interval),
    before: String(before),
  });

  return `http://${HOST}:${PORT}${PATH}?${query.toString()}`;
}

test(
  "http load /candles",
  async () => {
    const now = Math.floor(Date.now() / 1000);
    let completed = 0;
    let failed = 0;
    let cursor = 0;
    const statusCounts = new Map<number, number>();
    const errorSamples: string[] = [];

    async function worker() {
      while (true) {
        const current = cursor;
        if (current >= CONNECTIONS) break;
        cursor += 1;

        try {
          const res = await fetch(buildUrl(now), { method: "GET" });
          await res.arrayBuffer();
          if (!res.ok) {
            failed += 1;
            statusCounts.set(
              res.status,
              (statusCounts.get(res.status) ?? 0) + 1,
            );
          }
        } catch (err) {
          failed += 1;
          if (errorSamples.length < 5) {
            errorSamples.push(String(err));
          }
        } finally {
          completed += 1;
        }
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    const failureRate = completed === 0 ? 1 : failed / completed;
    const statusSummary = Array.from(statusCounts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([status, count]) => `${status}:${count}`)
      .join(", ");
    console.log(`Completed: ${completed}, Failed: ${failed}`);
    if (statusSummary) console.log(`Status counts: ${statusSummary}`);
    if (errorSamples.length)
      console.log(`Error samples: ${errorSamples.join(" | ")}`);
    expect(completed).toBe(CONNECTIONS);
    expect(failureRate).toBeLessThanOrEqual(MAX_FAILURE_RATE);
  },
  { timeout: 10000 },
);
