import { Elysia, t } from "elysia";
import { assetsService } from "./assets.service";
import { ErrorResponse } from "@/shared/http";
import { AppError } from "@/error.handler";

const AssetSchema = t.Object({
  symbol: t.String(),
  exchange: t.String(),
  type: t.String(),
  description: t.String(),
  base_asset: t.String(),
  quote_asset: t.String(),
  image_url: t.Optional(t.Union([t.String(), t.Null()])),
});

export const assetsRoutes = new Elysia({ prefix: "/assets" })
  .get(
    "/",
    async ({ query: { symbol } }) => {
      if (!symbol) {
        return await assetsService.getAllAssets();
      }

      const asset = await assetsService.getAsset(symbol);

      if (asset) {
        return asset;
      }

      throw new AppError(404, "ASSET_NOT_FOUND");
    },
    {
      query: t.Object({
        symbol: t.Optional(t.String()),
      }),
      response: {
        200: t.Union([t.Array(AssetSchema), AssetSchema]),
        400: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
      },
    },
  )
  .get(
    "/search",
    async ({ query: { query } }) => {
      return await assetsService.searchAssets(query);
    },
    {
      query: t.Object({
        query: t.String(),
      }),
      response: {
        200: t.Array(AssetSchema),
        400: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
      },
    },
  );
