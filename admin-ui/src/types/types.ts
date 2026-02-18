export interface AssetSearchResult {
  symbol: string;
  description: string;
  type: string;
  exchange: string;
  currency_code: string;
  logoid: string;
  "currency-logoid": string;
  "base-currency-logoid"?: string;
  provider_id: string;
  source_logoid: string;
  source2: { id: string; name: string; description: string };
  source_id: string;
  typespecs: string[];
}

export interface AssetData {
  symbol: string;
  type: string;
  exchange: string;
  description: string;
  base_asset: string;
  quote_asset: string;
  image_url: string | null;
}

export interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  time: number;
}
