import { describe, expect, it } from "bun:test";
import { getBaseInterval, getTableForInterval } from "./candles.repository";

describe("candles interval resolution", () => {
  it("uses exact standard interval when available", () => {
    expect(getBaseInterval(60)).toBe(60);
    expect(getBaseInterval(300)).toBe(300);
    expect(getTableForInterval(3600)).toBe("candles_1h");
  });

  it("uses nearest lower standard interval", () => {
    expect(getBaseInterval(90)).toBe(60);
    expect(getBaseInterval(7200)).toBe(3600);
    expect(getTableForInterval(7200)).toBe("candles_1h");
  });

  it("falls back to 1m when below 60", () => {
    expect(getBaseInterval(30)).toBe(60);
    expect(getTableForInterval(30)).toBe("candles_1m");
  });
});
