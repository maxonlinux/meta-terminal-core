-- candles_5m: 60 days TTL
CREATE TABLE IF NOT EXISTS candles_5m (
    symbol String,
    time DateTime,
    open AggregateFunction (argMin, Float64, DateTime),
    high SimpleAggregateFunction (max, Float64),
    low SimpleAggregateFunction (min, Float64),
    close AggregateFunction (argMax, Float64, DateTime),
    volume SimpleAggregateFunction (sum, Float64)
) ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM (time)
ORDER BY (symbol, time)
TTL time + INTERVAL 60 DAY DELETE;

-- candles_15m: 90 days TTL
CREATE TABLE IF NOT EXISTS candles_15m (
    symbol String,
    time DateTime,
    open AggregateFunction (argMin, Float64, DateTime),
    high SimpleAggregateFunction (max, Float64),
    low SimpleAggregateFunction (min, Float64),
    close AggregateFunction (argMax, Float64, DateTime),
    volume SimpleAggregateFunction (sum, Float64)
) ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM (time)
ORDER BY (symbol, time)
TTL time + INTERVAL 90 DAY DELETE;

-- candles_30m: 180 days TTL
CREATE TABLE IF NOT EXISTS candles_30m (
    symbol String,
    time DateTime,
    open AggregateFunction (argMin, Float64, DateTime),
    high SimpleAggregateFunction (max, Float64),
    low SimpleAggregateFunction (min, Float64),
    close AggregateFunction (argMax, Float64, DateTime),
    volume SimpleAggregateFunction (sum, Float64)
) ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM (time)
ORDER BY (symbol, time)
TTL time + INTERVAL 180 DAY DELETE;

-- candles_1h: 180 days TTL
CREATE TABLE IF NOT EXISTS candles_1h (
    symbol String,
    time DateTime,
    open AggregateFunction (argMin, Float64, DateTime),
    high SimpleAggregateFunction (max, Float64),
    low SimpleAggregateFunction (min, Float64),
    close AggregateFunction (argMax, Float64, DateTime),
    volume SimpleAggregateFunction (sum, Float64)
) ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM (time)
ORDER BY (symbol, time)
TTL time + INTERVAL 180 DAY DELETE;

-- candles_4h: 365 days TTL
CREATE TABLE IF NOT EXISTS candles_4h (
    symbol String,
    time DateTime,
    open AggregateFunction (argMin, Float64, DateTime),
    high SimpleAggregateFunction (max, Float64),
    low SimpleAggregateFunction (min, Float64),
    close AggregateFunction (argMax, Float64, DateTime),
    volume SimpleAggregateFunction (sum, Float64)
) ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM (time)
ORDER BY (symbol, time)
TTL time + INTERVAL 365 DAY DELETE;

-- candles_1d: no TTL (keep all)
CREATE TABLE IF NOT EXISTS candles_1d (
    symbol String,
    time DateTime,
    open AggregateFunction (argMin, Float64, DateTime),
    high SimpleAggregateFunction (max, Float64),
    low SimpleAggregateFunction (min, Float64),
    close AggregateFunction (argMax, Float64, DateTime),
    volume SimpleAggregateFunction (sum, Float64)
) ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM (time)
ORDER BY (symbol, time);

-- mat view: 5m candles from 1m
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_5m TO candles_5m AS
SELECT
    symbol,
    bucket AS time,
    argMinState(open_value, time) AS open,
    max(high_value) AS high,
    min(low_value) AS low,
    argMaxState(close_value, time) AS close,
    sum(volume_value) AS volume
FROM (
    SELECT
        symbol,
        time,
        toStartOfInterval(time, INTERVAL 300 SECOND) AS bucket,
        argMinMerge(open) AS open_value,
        max(high) AS high_value,
        min(low) AS low_value,
        argMaxMerge(close) AS close_value,
        sum(volume) AS volume_value
    FROM candles_1m
    GROUP BY symbol, time, bucket
)
GROUP BY symbol, bucket;

-- mat view: 15m candles from 1m
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_15m TO candles_15m AS
SELECT
    symbol,
    bucket AS time,
    argMinState(open_value, time) AS open,
    max(high_value) AS high,
    min(low_value) AS low,
    argMaxState(close_value, time) AS close,
    sum(volume_value) AS volume
FROM (
    SELECT
        symbol,
        time,
        toStartOfInterval(time, INTERVAL 900 SECOND) AS bucket,
        argMinMerge(open) AS open_value,
        max(high) AS high_value,
        min(low) AS low_value,
        argMaxMerge(close) AS close_value,
        sum(volume) AS volume_value
    FROM candles_1m
    GROUP BY symbol, time, bucket
)
GROUP BY symbol, bucket;

-- mat view: 30m candles from 1m
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_30m TO candles_30m AS
SELECT
    symbol,
    bucket AS time,
    argMinState(open_value, time) AS open,
    max(high_value) AS high,
    min(low_value) AS low,
    argMaxState(close_value, time) AS close,
    sum(volume_value) AS volume
FROM (
    SELECT
        symbol,
        time,
        toStartOfInterval(time, INTERVAL 1800 SECOND) AS bucket,
        argMinMerge(open) AS open_value,
        max(high) AS high_value,
        min(low) AS low_value,
        argMaxMerge(close) AS close_value,
        sum(volume) AS volume_value
    FROM candles_1m
    GROUP BY symbol, time, bucket
)
GROUP BY symbol, bucket;

-- mat view: 1h candles from 1m
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_1h TO candles_1h AS
SELECT
    symbol,
    bucket AS time,
    argMinState(open_value, time) AS open,
    max(high_value) AS high,
    min(low_value) AS low,
    argMaxState(close_value, time) AS close,
    sum(volume_value) AS volume
FROM (
    SELECT
        symbol,
        time,
        toStartOfInterval(time, INTERVAL 3600 SECOND) AS bucket,
        argMinMerge(open) AS open_value,
        max(high) AS high_value,
        min(low) AS low_value,
        argMaxMerge(close) AS close_value,
        sum(volume) AS volume_value
    FROM candles_1m
    GROUP BY symbol, time, bucket
)
GROUP BY symbol, bucket;

-- mat view: 4h candles from 1m
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_4h TO candles_4h AS
SELECT
    symbol,
    bucket AS time,
    argMinState(open_value, time) AS open,
    max(high_value) AS high,
    min(low_value) AS low,
    argMaxState(close_value, time) AS close,
    sum(volume_value) AS volume
FROM (
    SELECT
        symbol,
        time,
        toStartOfInterval(time, INTERVAL 14400 SECOND) AS bucket,
        argMinMerge(open) AS open_value,
        max(high) AS high_value,
        min(low) AS low_value,
        argMaxMerge(close) AS close_value,
        sum(volume) AS volume_value
    FROM candles_1m
    GROUP BY symbol, time, bucket
)
GROUP BY symbol, bucket;

-- mat view: 1d candles from 1m
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_1d TO candles_1d AS
SELECT
    symbol,
    bucket AS time,
    argMinState(open_value, time) AS open,
    max(high_value) AS high,
    min(low_value) AS low,
    argMaxState(close_value, time) AS close,
    sum(volume_value) AS volume
FROM (
    SELECT
        symbol,
        time,
        toStartOfInterval(time, INTERVAL 86400 SECOND) AS bucket,
        argMinMerge(open) AS open_value,
        max(high) AS high_value,
        min(low) AS low_value,
        argMaxMerge(close) AS close_value,
        sum(volume) AS volume_value
    FROM candles_1m
    GROUP BY symbol, time, bucket
)
GROUP BY symbol, bucket;
