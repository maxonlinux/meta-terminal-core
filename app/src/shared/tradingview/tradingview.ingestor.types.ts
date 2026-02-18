export type QuoteMethod =
  | "quote_create_session"
  | "quote_set_fields"
  | "quote_add_symbols"
  | "quote_remove_symbols";

export type QuoteParams =
  | "base-currency-logoid"
  | "ch"
  | "chp"
  | "currency-logoid"
  | "provider_id"
  | "currency_code"
  | "current_session"
  | "description"
  | "exchange"
  | "format"
  | "fractional"
  | "is_tradable"
  | "language"
  | "local_description"
  | "logoid"
  | "lp"
  | "lp_time"
  | "minmov"
  | "minmove2"
  | "original_name"
  | "pricescale"
  | "pro_name"
  | "short_name"
  | "type"
  | "update_mode"
  | "volume"
  | "ask"
  | "bid"
  | "fundamentals"
  | "high_price"
  | "low_price"
  | "open_price"
  | "prev_close_price"
  | "rch"
  | "rchp"
  | "rtc"
  | "rtc_time"
  | "status"
  | "industry"
  | "basic_eps_net_income"
  | "beta_1_year"
  | "market_cap_basic"
  | "earnings_per_share_basic_ttm"
  | "price_earnings_ttm"
  | "sector"
  | "dividends_yield"
  | "timezone"
  | "country_code";

export type SubscriptionItem = {
  symbol: string;
  exchange: string;
};

export type OutgoingPacket = {
  m?: string;
  p?: [session: string, params: []];
};

export type IncomingHeartbeatPacket = number;

type BaseQuotePayload = {
  n: string; // symbol
  v: Record<string, unknown>; // values
};

export type QuotePayloadOk = BaseQuotePayload & {
  s: "ok";
};

export type QuotePayloadError = BaseQuotePayload & {
  s: "error";
  errmsg: string;
};

export type QuotePayload = QuotePayloadOk | QuotePayloadError;

export type IncomingPacket = {
  m?: string;
  p?: [session: string, payload: QuotePayload] | string[];
};

export type QuotePricePayload = {
  n: string;
  v: { lp: number };
};

export type IncomingPacketWithPrice = IncomingPacket & {
  p: [string, QuotePricePayload];
};

export type IncomingMessage = IncomingPacket | IncomingHeartbeatPacket;
