import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { config } from "@/env.config";
import { AppError, appErrorResponse } from "@/error.handler";
import { assetsRoutes } from "./assets/assets.routes";
import { candlesRoutes } from "./candles/candles.routes";
import { pricesRoutes } from "./prices/prices.routes";
import { storageRoutes } from "./storage/storage.routes";
import { adminRoutes } from "./admin/admin.routes";
import { assetsRepo } from "./assets/assets.repository";
import { pricesRepo } from "./prices/prices.repository";
import type { TickData } from "./prices/prices.types";
import { initLogging, logger } from "./shared/logger";
import { NatsClient } from "./shared/nats/nats.client";
import { tradingview } from "./shared/tradingview/tradingview.ingestor";
import { isIncomingMessageWithPrice } from "./shared/tradingview/tradingview.ingestor.utils";
import { dateToSeconds } from "./shared/utils";

const app = new Elysia({
  serve: {
    // Stable server id enables hot reload without re-binding ports.
    id: "meta-core",
  },
})
  .onRequest(({ request }) => {
    const url = new URL(request.url);
    logger.debug(`${request.method} ${url.pathname}${url.search}`);
  })
  .use(
    cors({
      origin: true,
      credentials: true,
    }),
  )
  .error({ APP_ERROR: AppError })
  .onError(({ code, error }) => {
    if (code === "APP_ERROR") {
      return appErrorResponse(error);
    }
  })
  .use(assetsRoutes)
  .use(candlesRoutes)
  .use(pricesRoutes)
  .use(storageRoutes)
  .use(adminRoutes)
  .get("/health", () => ({ status: "ok" }));

const start = async () => {
  try {
    await initLogging();
    const nats = await NatsClient.getInstance(
      config.NATS_URL,
      config.NATS_TOKEN,
    );

    const batchIntervalMs = config.NATS_BATCH_INTERVAL_MS;
    const batchSize = config.NATS_BATCH_SIZE;
    const tickBuffer: TickData[] = [];
    let flushing = false;

    const flushTicks = async (reason: "interval" | "size") => {
      if (flushing || tickBuffer.length === 0) return;
      flushing = true;
      const batch = tickBuffer.splice(0, tickBuffer.length);

      try {
        await pricesRepo.insertTicks(batch);
      } catch (error) {
        logger.error("Failed to batch insert price ticks", {
          reason,
          count: batch.length,
          error,
        });
      } finally {
        flushing = false;
      }
    };

    nats.subscribe<Omit<TickData, "volume">>(config.NATS_TOPIC, (tick) => {
      const cached = pricesRepo.cacheTick(tick);
      tickBuffer.push(cached);

      if (tickBuffer.length >= batchSize) {
        void flushTicks("size");
      }
    });

    setInterval(() => {
      void flushTicks("interval");
    }, batchIntervalMs);

    tradingview.connect();

    tradingview.onopen = async () => {
      const assets = await assetsRepo.getAllAssets();
      logger.info("Subscribing to assets...");
      tradingview.subscribe(assets);
    };

    tradingview.onprice = async (packet) => {
      if (!isIncomingMessageWithPrice(packet)) return;

      const [_session, payload] = packet.p;
      const [_exchange, symbol] = payload.n.split(":");

      if (!symbol) return;

      const timestamp = dateToSeconds(Date.now());

      const withTimestamp = {
        symbol: symbol,
        price: payload.v.lp,
        timestamp,
      };

      if (config.VERBOSE) {
        logger.debug("Price update from ingestor", withTimestamp);
      }

      nats.publish(config.NATS_TOPIC, withTimestamp);
    };

    // If an asset never produced a tick, we resubscribe less aggressively.
    const staleSeconds = 60;
    const resubscribeEverySeconds = 60;
    const resubscribeNoTickSeconds = 300;
    const lastResubscribe = new Map<string, number>();

    setInterval(async () => {
      const assets = await assetsRepo.getAllAssets();
      const now = dateToSeconds(Date.now());
      const staleAssets = [] as typeof assets;

      const shouldResubscribe = (symbol: string, hasTick: boolean) => {
        const lastTry = lastResubscribe.get(symbol) ?? 0;
        const cooldown = hasTick
          ? resubscribeEverySeconds
          : resubscribeNoTickSeconds;
        return now - lastTry >= cooldown;
      };

      for (const asset of assets) {
        const tick = pricesRepo.getLastPriceFromMemory(asset.symbol);
        if (!tick) {
          // No tick yet: resubscribe at a slower cadence to avoid WS churn.
          if (shouldResubscribe(asset.symbol, false)) {
            lastResubscribe.set(asset.symbol, now);
            staleAssets.push(asset);
          }
          continue;
        }

        if (now - tick.timestamp <= staleSeconds) {
          continue;
        }

        if (!shouldResubscribe(asset.symbol, true)) {
          continue;
        }

        lastResubscribe.set(asset.symbol, now);
        staleAssets.push(asset);
      }

      if (staleAssets.length > 0) {
        logger.debug("Resubscribing stale assets", {
          symbols: staleAssets.map((a) => a.symbol),
        });
        tradingview.resubscribe(staleAssets);
      }
    }, resubscribeEverySeconds * 1000);
  } catch (err) {
    logger.error("Failed to start server", { err });
    process.exit(1);
  }
};

start();

app.listen({ port: config.PORT }, () => {
  logger.info("Server started", { port: config.PORT });
});
