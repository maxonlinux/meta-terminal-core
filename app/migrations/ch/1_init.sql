-- ticks table
CREATE TABLE
    IF NOT EXISTS ticks (
        symbol String,
        price Float64,
        volume Float64,
        timestamp DateTime
    ) ENGINE = MergeTree ()
PARTITION BY
    toYYYYMMDD (timestamp)
ORDER BY
    (symbol, timestamp) TTL timestamp + INTERVAL 1 DAY DELETE;

-- 1m candles table (30 days TTL)
CREATE TABLE
    IF NOT EXISTS candles_1m (
        symbol String,
        time DateTime,
        open AggregateFunction (argMin, Float64, DateTime),
        high SimpleAggregateFunction (max, Float64),
        low SimpleAggregateFunction (min, Float64),
        close AggregateFunction (argMax, Float64, DateTime),
        volume SimpleAggregateFunction (sum, Float64)
    ) ENGINE = AggregatingMergeTree
PARTITION BY
    toYYYYMM (time)
ORDER BY
    (symbol, time)
TTL time + INTERVAL 30 DAY DELETE;

-- mat view for 1m candles
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_1m TO candles_1m AS
SELECT
    symbol,
    toStartOfMinute (timestamp) AS time,
    argMinState (price, timestamp) open,
    max(price) AS high,
    min(price) AS low,
    argMaxState (price, timestamp) close,
    sum(volume) AS volume
FROM
    ticks
GROUP BY
    symbol,
    time;