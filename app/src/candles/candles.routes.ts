import { Elysia, t } from "elysia";
import { AppError } from "@/error.handler";
import { ErrorResponse } from "@/shared/http";
import { candlesService } from "./candles.service";

const CandleSchema = t.Object({
  open: t.Number(),
  high: t.Number(),
  low: t.Number(),
  close: t.Number(),
  volume: t.Number(),
  time: t.Number(),
});

export const candlesRoutes = new Elysia({ prefix: "/candles" })
  .get(
    "/",
    async ({ query: { symbol, interval, outputsize, before } }) => {
      return await candlesService.getCandles(
        symbol,
        interval,
        outputsize,
        before,
      );
    },
    {
      query: t.Object({
        symbol: t.String(),
        interval: t.Numeric({ minimum: 60 }),
        outputsize: t.Optional(t.Numeric({ minimum: 1, default: 50 })),
        before: t.Optional(t.Numeric({ minimum: 0 })),
      }),
      response: {
        200: t.Array(CandleSchema),
        400: ErrorResponse,
        500: ErrorResponse,
      },
    },
  )
  .get(
    "/last",
    async ({ query: { symbol, interval } }) => {
      const candle = await candlesService.getLastCandle(symbol, interval);

      if (!candle) {
        throw new AppError(404, `No candles for ${symbol}`);
      }

      return candle;
    },
    {
      query: t.Object({
        symbol: t.String(),
        interval: t.Numeric({ minimum: 60 }),
      }),
      response: {
        200: CandleSchema,
        400: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
      },
    },
  );
