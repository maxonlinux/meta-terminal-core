import { Elysia, t } from "elysia";
import { AppError } from "@/error.handler";
import { assetsService } from "../assets/assets.service";
import {
  ErrorResponse,
  SuccessResponse,
  SuccessTrueResponse,
} from "@/shared/http";

const AssetInputSchema = t.Object({
  symbol: t.String(),
  exchange: t.String(),
  type: t.String(),
  description: t.String(),
  image_url: t.Optional(t.Union([t.String(), t.Null()])),
});

export const adminAssetsRoutes = new Elysia({ prefix: "/assets" })
  .post(
    "/",
    async ({ body, set }) => {
      const { symbol, exchange, type, description, image_url } = body;

      await assetsService.addAsset({
        symbol,
        exchange,
        type,
        description,
        image_url: image_url ?? null,
      });

      set.status = 201;
      return { success: true };
    },
    {
      body: AssetInputSchema,
      response: {
        201: SuccessTrueResponse,
        400: ErrorResponse,
        401: ErrorResponse,
        500: ErrorResponse,
      },
    },
  )
  .put(
    "/",
    async ({ body, query: { symbol } }) => {
      const { type, description, image_url } = body;

      await assetsService.updateAsset(symbol, {
        type,
        description,
        image_url,
      });

      return { success: true };
    },
    {
      body: t.Omit(AssetInputSchema, ["symbol", "exchange"]),
      query: t.Object({ symbol: t.String() }),
      response: {
        200: SuccessResponse,
        400: ErrorResponse,
        401: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
      },
    },
  )
  .delete(
    "/",
    async ({ query: { symbol } }) => {
      const deleted = await assetsService.deleteAsset(symbol);
      if (!deleted) {
        throw new AppError(404, "ASSET_NOT_FOUND");
      }
      return { success: true };
    },
    {
      query: t.Object({ symbol: t.String() }),
      response: {
        200: SuccessResponse,
        400: ErrorResponse,
        401: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
      },
    },
  );
