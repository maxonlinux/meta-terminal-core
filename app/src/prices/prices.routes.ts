import { Elysia, t } from "elysia";
import { priceService } from "./prices.service";
import { ErrorResponse } from "@/shared/http";
import { AppError } from "@/error.handler";

const TickSchema = t.Object({
  timestamp: t.Number(),
  value: t.Number(),
  volume: t.Optional(t.Number()),
});

export const pricesRoutes = new Elysia({ prefix: "/prices" }).get(
  "/",
  async ({ query: { symbol } }) => {
    const price = await priceService.getLastPrice(symbol);

    if (!price) {
      throw new AppError(404, "NO_PRICE_FOUND");
    }

    return price;
  },
  {
    query: t.Object({
      symbol: t.String(),
    }),
    response: {
      200: TickSchema,
      400: ErrorResponse,
      404: ErrorResponse,
      500: ErrorResponse,
    },
  },
);
