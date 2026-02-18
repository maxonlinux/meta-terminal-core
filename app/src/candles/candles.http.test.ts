import { describe, expect, it } from "bun:test";

const BASE_URL = process.env.CORE_URL ?? "http://localhost:3000";

async function fetchJson(path: string) {
  const res = await fetch(`${BASE_URL}${path}`);
  const text = await res.text();
  return {
    status: res.status,
    json: text ? JSON.parse(text) : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertCandleShape(value: unknown) {
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

describe("candles http", () => {
  it("/health responds", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);
  });

  it("/candles returns array", async () => {
    const { status, json } = await fetchJson(
      "/candles?symbol=BTCUSDT&interval=3600&outputsize=1",
    );
    expect(status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    if (Array.isArray(json) && json.length > 0) {
      assertCandleShape(json[0]);
    }
  });

  it("/candles supports non-standard interval", async () => {
    const { status, json } = await fetchJson(
      "/candles?symbol=BTCUSDT&interval=2700&outputsize=1",
    );
    expect(status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    if (Array.isArray(json) && json.length > 0) {
      assertCandleShape(json[0]);
    }
  });

  it("/candles supports small interval fallback", async () => {
    const { status, json } = await fetchJson(
      "/candles?symbol=BTCUSDT&interval=60&outputsize=1",
    );
    expect(status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    if (Array.isArray(json) && json.length > 0) {
      assertCandleShape(json[0]);
    }
  });

  it("/candles/last responds (200 or 404)", async () => {
    const { status, json } = await fetchJson(
      "/candles/last?symbol=BTCUSDT&interval=3600",
    );
    expect([200, 404]).toContain(status);
    if (status === 200) {
      assertCandleShape(json);
    }
  });

  it("/candles/last supports non-standard interval", async () => {
    const { status } = await fetchJson(
      "/candles/last?symbol=BTCUSDT&interval=2700",
    );
    expect([200, 404]).toContain(status);
  });
});
