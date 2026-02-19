-- Rebuild higher-timeframe candles directly from ticks to ensure correct open/close

DROP VIEW IF EXISTS mv_candles_5m;
DROP VIEW IF EXISTS mv_candles_15m;
DROP VIEW IF EXISTS mv_candles_30m;
DROP VIEW IF EXISTS mv_candles_1h;
DROP VIEW IF EXISTS mv_candles_4h;
DROP VIEW IF EXISTS mv_candles_1d;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_5m TO candles_5m AS
SELECT
  symbol,
  toStartOfInterval(timestamp, INTERVAL 300 SECOND) AS time,
  argMinState(price, timestamp) AS open,
  max(price) AS high,
  min(price) AS low,
  argMaxState(price, timestamp) AS close,
  sum(volume) AS volume
FROM ticks
GROUP BY symbol, time;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_15m TO candles_15m AS
SELECT
  symbol,
  toStartOfInterval(timestamp, INTERVAL 900 SECOND) AS time,
  argMinState(price, timestamp) AS open,
  max(price) AS high,
  min(price) AS low,
  argMaxState(price, timestamp) AS close,
  sum(volume) AS volume
FROM ticks
GROUP BY symbol, time;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_30m TO candles_30m AS
SELECT
  symbol,
  toStartOfInterval(timestamp, INTERVAL 1800 SECOND) AS time,
  argMinState(price, timestamp) AS open,
  max(price) AS high,
  min(price) AS low,
  argMaxState(price, timestamp) AS close,
  sum(volume) AS volume
FROM ticks
GROUP BY symbol, time;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_1h TO candles_1h AS
SELECT
  symbol,
  toStartOfInterval(timestamp, INTERVAL 3600 SECOND) AS time,
  argMinState(price, timestamp) AS open,
  max(price) AS high,
  min(price) AS low,
  argMaxState(price, timestamp) AS close,
  sum(volume) AS volume
FROM ticks
GROUP BY symbol, time;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_4h TO candles_4h AS
SELECT
  symbol,
  toStartOfInterval(timestamp, INTERVAL 14400 SECOND) AS time,
  argMinState(price, timestamp) AS open,
  max(price) AS high,
  min(price) AS low,
  argMaxState(price, timestamp) AS close,
  sum(volume) AS volume
FROM ticks
GROUP BY symbol, time;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_1d TO candles_1d AS
SELECT
  symbol,
  toStartOfInterval(timestamp, INTERVAL 86400 SECOND) AS time,
  argMinState(price, timestamp) AS open,
  max(price) AS high,
  min(price) AS low,
  argMaxState(price, timestamp) AS close,
  sum(volume) AS volume
FROM ticks
GROUP BY symbol, time;
