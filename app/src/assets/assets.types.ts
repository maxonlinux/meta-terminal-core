export type AssetData = {
  symbol: string;
  type: string;
  exchange: string;
  description: string;
  base_asset: string;
  quote_asset: string;
  image_url: string | null;
};

export type AssetInput = Omit<AssetData, "base_asset" | "quote_asset"> & {
  base_asset?: string;
  quote_asset?: string;
};
