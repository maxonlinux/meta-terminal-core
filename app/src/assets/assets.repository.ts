import { db } from "./assets.database";
import type { AssetData, AssetInput } from "./assets.types";

class AssetsRepository {
  private database = () => db<AssetData>("assets");

  getAsset = async (symbol: string) => {
    return this.database().where({ symbol }).first();
  };

  getAllAssets = async () => {
    return this.database().select("*");
  };

  searchAssets = async (query: string) => {
    const term = `%${query.trim().toLowerCase()}%`;

    return this.database()
      .whereRaw("lower(symbol) like ?", [term])
      .orWhereRaw("lower(description) like ?", [term])
      .select("*");
  };

  addAsset = async (asset: AssetInput) => {
    const { base, quote } = splitSymbol(asset.symbol);
    const payload: AssetData = {
      symbol: asset.symbol,
      type: asset.type,
      exchange: asset.exchange,
      description: asset.description,
      base_asset: asset.base_asset ?? base,
      quote_asset: asset.quote_asset ?? quote,
      image_url: asset.image_url ?? null,
    };

    const [result] = await this.database().insert(payload, "*");
    return result;
  };

  updateAsset = async (
    symbol: string,
    asset: Partial<Omit<AssetData, "symbol">>,
  ) => {
    const existing = await this.database().where({ symbol }).first();
    if (!existing) {
      return null;
    }

    await this.database().where({ symbol }).update(asset);
    return this.database().where({ symbol }).first();
  };

  deleteAsset = async (symbol: string) => {
    const existing = await this.database().where({ symbol }).first();
    if (!existing) {
      return null;
    }

    await this.database().where({ symbol }).delete();
    return existing;
  };
}

// Split symbol into base/quote using common USD-family suffixes.
function splitSymbol(symbol: string): { base: string; quote: string } {
  const quotes = ["USDT", "USDC", "USD"];
  const fallback = "USD";
  const matched = quotes.find((quote) => symbol.endsWith(quote));

  if (matched) {
    const base = symbol.slice(0, symbol.length - matched.length) || symbol;
    return { base, quote: matched };
  }

  return { base: symbol, quote: fallback };
}

export const assetsRepo = new AssetsRepository();
