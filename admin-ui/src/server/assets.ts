import { action, query, revalidate } from "@solidjs/router";
import axios from "axios";
import * as cheerio from "cheerio";
import sharp from "sharp";
import { getRequestEvent } from "solid-js/web";
import { config } from "~/config";
import type { AssetData, AssetSearchResult } from "~/types/types";

export type NewAsset = Omit<AssetData, "base_asset" | "quote_asset">;

const REQUEST_TIMEOUT_MS = 8000;
const TRADINGVIEW_ORIGIN = "https://www.tradingview.com";

const core = axios.create({
  baseURL: config.core,
  timeout: REQUEST_TIMEOUT_MS,
  validateStatus: () => true,
});

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function isAssetData(x: unknown): x is AssetData {
  return (
    isRecord(x) &&
    typeof x.symbol === "string" &&
    typeof x.exchange === "string" &&
    typeof x.description === "string" &&
    typeof x.type === "string" &&
    ("image_url" in x
      ? x.image_url === null || typeof x.image_url === "string"
      : true)
  );
}

function isAssetDataArray(x: unknown): x is AssetData[] {
  return Array.isArray(x) && x.every(isAssetData);
}


function isAssetSearchResult(x: unknown): x is AssetSearchResult {
  return (
    isRecord(x) &&
    typeof x.symbol === "string" &&
    typeof x.exchange === "string" &&
    typeof x.description === "string"
  );
}

function isOk(status: number): boolean {
  return status >= 200 && status < 300;
}

function errorMessage(data: unknown, fallback: string): string {
  if (isRecord(data) && typeof data.error === "string") return data.error;
  return fallback;
}

function authHeaders(): Record<string, string> {
  const cookie = getRequestEvent()?.request.headers.get("cookie");
  return cookie ? { cookie } : {};
}

function makeKey(item: { exchange?: string; symbol?: string }): string {
  const exchange = (item.exchange || "").trim().toUpperCase();
  const symbol = (item.symbol || "").trim().toUpperCase();
  return `${exchange}:${symbol}`;
}

async function searchLogoUrl(symbol: string): Promise<string | null> {
  try {
    const cleanSymbol = symbol.replace("/", "");
    const url = `https://www.tradingview.com/symbols/${cleanSymbol}`;

    const res = await axios.get(url, {
      responseType: "text",
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    });

    if (!isOk(res.status)) return null;

    const html = typeof res.data === "string" ? res.data : "";
    const $ = cheerio.load(html);
    const img = $('img[class^="logo-"]').first().attr("src");
    return img ?? null;
  } catch {
    return null;
  }
}

async function imageUrlToBuffer(logoUrl: string): Promise<Buffer> {
  const res = await axios.get(logoUrl, {
    responseType: "arraybuffer",
    timeout: REQUEST_TIMEOUT_MS,
    validateStatus: () => true,
  });

  if (!isOk(res.status)) throw new Error("LOGO_DOWNLOAD_FAILED");

  return await sharp(res.data).resize(512, 512).webp().toBuffer();
}

async function uploadImage(file: Blob): Promise<string> {
  const form = new FormData();
  form.append("file", file, "image.webp");

  const res = await core.post("/admin/storage/upload", form, {
    headers: authHeaders(),
  });

  if (!isOk(res.status)) {
    throw new Error(errorMessage(res.data, "UPLOAD_FAILED"));
  }

  const data = res.data as { filename?: string };
  if (!data?.filename) throw new Error("UPLOAD_FAILED");
  return data.filename;
}

/**
 * Assets list (cached + deduped by Solid Router)
 */
export const getAssets = query(async (): Promise<AssetData[]> => {
  "use server";

  const res = await core.get("/assets", {
    headers: { accept: "application/json", ...authHeaders() },
  });

  if (!isOk(res.status)) {
    throw new Error(errorMessage(res.data, "ASSETS_FETCH_FAILED"));
  }

  if (!isAssetDataArray(res.data)) throw new Error("ASSETS_BAD_RESPONSE");
  return res.data;
}, "assets.list");

/**
 * Assets search (TradingView)
 */
export const searchAssets = query(
  async (q: string): Promise<AssetSearchResult[]> => {
    "use server";

    if (!q.trim()) return [];

    const splittedSearch = q.toUpperCase().replace(/ /g, "+").split(":");
    const exchange = splittedSearch.length === 2 ? splittedSearch[0] : undefined;
    const text = splittedSearch.pop() ?? "";

    const params = new URLSearchParams({
      text,
      search_type: "",
    });

    if (exchange) params.set("exchange", exchange);

    const res = await axios.get(
      `https://symbol-search.tradingview.com/symbol_search/v3?${params.toString()}`,
      {
        headers: {
          origin: TRADINGVIEW_ORIGIN,
          referer: TRADINGVIEW_ORIGIN,
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          accept: "application/json",
        },
        maxRedirects: 5,
        timeout: REQUEST_TIMEOUT_MS,
        validateStatus: () => true,
      },
    );

    if (!isOk(res.status)) throw new Error("ASSETS_SEARCH_FAILED");

    const data = res.data as {
      symbols?: AssetSearchResult[];
      symbols_remaining?: number;
    };

    const results = Array.isArray(data.symbols) ? data.symbols : [];
    const filtered = results.filter((item) => {
      if (typeof item.currency_code !== "string") return true;
      return item.currency_code.includes("USD");
    });

    const deduped = Array.from(
      new Map(filtered.map((item) => [makeKey(item), item])).values(),
    );

    return deduped.filter(isAssetSearchResult);
  },
  "assets.search",
);

/**
 * Saved assets search (core DB)
 */
export const searchSavedAssets = query(
  async (q: string): Promise<AssetData[]> => {
    "use server";

    const query = q.trim();
    if (!query) return [];

    const res = await core.get("/assets/search", {
      params: { query },
      headers: { accept: "application/json", ...authHeaders() },
    });

    if (!isOk(res.status)) {
      throw new Error(errorMessage(res.data, "ASSETS_SEARCH_FAILED"));
    }

    if (!isAssetDataArray(res.data)) throw new Error("ASSETS_BAD_RESPONSE");
    return res.data;
  },
  "assets.search.saved",
);

/**
 * Mutations
 */
export const addAsset = action(async (asset: NewAsset): Promise<void> => {
  "use server";

  const exists = await core.get("/assets", {
    params: { symbol: asset.symbol },
    headers: authHeaders(),
  });

  if (exists.status !== 404) {
    if (isOk(exists.status)) throw new Error("ASSET_EXISTS");
    throw new Error(errorMessage(exists.data, "ASSET_ADD_FAILED"));
  }

  const logoUrl = await searchLogoUrl(asset.symbol);

  if (!logoUrl) {
    const createRes = await core.post(
      "/admin/assets",
      {
        symbol: asset.symbol,
        exchange: asset.exchange,
        type: asset.type,
        description: asset.description,
      },
      {
        headers: { "content-type": "application/json", ...authHeaders() },
      },
    );

    if (!isOk(createRes.status)) {
      throw new Error(errorMessage(createRes.data, "ASSET_ADD_FAILED"));
    }

    revalidate(getAssets.key);
    return;
  }

  const buffer = await imageUrlToBuffer(logoUrl);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: "image/webp" });
  const uploadedImageFileName = await uploadImage(blob);

  const createRes = await core.post(
    "/admin/assets",
    {
      symbol: asset.symbol,
      exchange: asset.exchange,
      type: asset.type,
      description: asset.description,
      image_url: uploadedImageFileName,
    },
    {
      headers: { "content-type": "application/json", ...authHeaders() },
    },
  );

  if (!isOk(createRes.status)) {
    throw new Error(errorMessage(createRes.data, "ASSET_ADD_FAILED"));
  }

  revalidate(getAssets.key);
}, "assets.add");

export const removeAsset = action(async (symbol: string): Promise<void> => {
  "use server";

  const res = await core.delete("/admin/assets", {
    params: { symbol },
    headers: { accept: "application/json", ...authHeaders() },
  });

  if (!isOk(res.status)) {
    throw new Error(errorMessage(res.data, "ASSET_DELETE_FAILED"));
  }

  await revalidate(getAssets.key);
}, "assets.remove");
