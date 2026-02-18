import WebSocket, { type RawData } from "ws";
import { logger } from "@/shared/logger";
import type {
  IncomingMessage,
  IncomingPacket,
  QuoteMethod,
  QuoteParams,
  SubscriptionItem,
} from "./tradingview.ingestor.types";
import { genSession, subscriptionKey } from "./tradingview.ingestor.utils";

class Protocol {
  private cleanerRgx = /~h~/g;
  private splitterRgx = /~m~[0-9]{1,}~m~/g;

  encode(msg: string) {
    return `~m~${msg.length}~m~${msg}`;
  }

  decode(msg: string): IncomingMessage[] {
    return msg
      .replace(this.cleanerRgx, "")
      .split(this.splitterRgx)
      .map((p) => {
        if (!p) return false;
        try {
          return JSON.parse(p);
        } catch (error) {
          logger.error("Error in decoding", { error });
          logger.warn("[TV Protocol] Cant parse", { data: p });
          return false;
        }
      })
      .filter((p) => p);
  }
}

class Heartbeat {
  private timeoutMs: number;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(timeoutMs: number) {
    this.timeoutMs = timeoutMs;
  }

  private clearHeartbeatTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private setHeartbeatTimeout(ws: WebSocket) {
    this.timeoutId = setTimeout(() => {
      logger.warn("Heartbeat timed out, closing connection...");
      ws.terminate();
    }, this.timeoutMs);
  }

  reset(ws: WebSocket) {
    logger.debug("Heartbeat received. Resetting timeout");
    this.clearHeartbeatTimeout();
    this.setHeartbeatTimeout(ws);
  }

  create(ws: WebSocket) {
    logger.debug("Heartbeat created");

    this.setHeartbeatTimeout(ws);

    ws.addEventListener(
      "close",
      () => {
        logger.debug("Heartbeat removed");
        this.clearHeartbeatTimeout();
        this.timeoutId = null;
      },
      { once: true },
    );
  }
}

export class TradingviewIngestor {
  private readonly server: string = "data";
  private readonly url: string = `wss://${this.server}.tradingview.com/socket.io/websocket?type=chart`;
  private readonly origin: string = "https://www.tradingview.com";
  private readonly session: string = genSession();

  private readonly reconnectDelay: number;
  private reconnectTimeoutId: NodeJS.Timeout | null;
  private ws: WebSocket | null;

  private readonly heartbeat: Heartbeat;
  private readonly protocol: Protocol;
  private readonly subscriptions: Set<string>;

  constructor() {
    this.reconnectDelay = 5000;
    this.reconnectTimeoutId = null;
    this.ws = null;

    this.heartbeat = new Heartbeat(30_000);
    this.protocol = new Protocol();
    this.subscriptions = new Set();
  }

  // ---- CONNECTION ----

  async connect() {
    if (this.ws) {
      logger.warn("WebSocket already connected");
      return;
    }

    this.ws = new WebSocket(this.url, {
      headers: {
        Origin: this.origin,
      },
    });

    this.ws.on("open", () => {
      logger.info("WebSocket connected");

      this.withWebSocket((ws) => {
        this.heartbeat.create(ws);
      });

      this.sendMessage({
        m: "quote_create_session",
      });

      this.sendMessage({
        m: "quote_set_fields",
        p: ["lp", "bid", "ask", "volume"] satisfies QuoteParams[],
      });

      this.onopen();
    });

    this.ws.on("message", (data) => {
      this.handleMessage(data);
    });

    this.ws.on("error", (err) => {
      logger.error("WebSocket error", { error: err.message });
      this.withWebSocket((ws) => ws.terminate());
    });

    this.ws.on("close", (code, reason) => {
      logger.warn("WebSocket closed", { code, reason });
      this.ws = null;

      this.reconnect();
    });
  }

  disconnect() {
    this.clearReconnectTimeout();
    this.ws?.close(1000, "Client disconnect");
  }

  private reconnect() {
    logger.info(`Reconnecting to WS in ${this.reconnectDelay / 1000} sec...`);

    this.reconnectTimeoutId = setTimeout(() => {
      logger.info("Reconnecting...");
      this.connect();
    }, this.reconnectDelay);
  }

  private clearReconnectTimeout() {
    if (!this.reconnectTimeoutId) {
      logger.warn("No pending reconnect");
      return;
    }

    clearTimeout(this.reconnectTimeoutId);
    this.reconnectTimeoutId = null;
  }

  private withWebSocket<T>(fn: (ws: WebSocket) => T): T | null {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn("WebSocket is not connected");
      return null;
    }

    return fn(this.ws);
  }

  // ---- MESSAGING ----

  private sendMessage(packet: { m: QuoteMethod; p?: string[] }) {
    const { p = [] } = packet;

    const message = JSON.stringify({
      m: packet.m,
      p: [this.session, ...p],
    });

    const formatted = this.protocol.encode(message);
    this.withWebSocket((ws) => ws.send(formatted));
  }

  private handleHeartbeat(packet: number) {
    const pong = this.protocol.encode(`~h~${packet}`);
    this.withWebSocket((ws) => {
      ws.send(pong);
      this.heartbeat.reset(ws);
    });
  }

  private handlePacket(packet: IncomingMessage) {
    const isHeartbeat = typeof packet === "number";

    if (isHeartbeat) {
      this.handleHeartbeat(packet);
      return;
    }

    if (!packet.p) return;

    const payload = packet.p[1];

    if (typeof payload === "string" && packet.m === "quote_completed") {
      this.oncompleted(packet);
      return;
    }

    if (typeof payload === "object" && payload.s === "error") {
      this.onerror(packet);
      return;
    }

    this.onprice(packet);
  }

  private handleMessage(data: RawData) {
    const msg = data.toString();
    const parsed = this.protocol.decode(msg);

    for (const packet of parsed) {
      this.handlePacket(packet);
    }
  }

  // ---- SUBSCRIPTIONS ----

  subscribe(assets: SubscriptionItem[]) {
    const symbols: string[] = [];
    for (const asset of assets) {
      const subscription = subscriptionKey({
        symbol: asset.symbol,
        exchange: asset.exchange,
      });

      if (this.subscriptions.has(subscription)) {
        continue;
      }

      this.subscriptions.add(subscription);
      symbols.push(subscription);
    }

    if (symbols.length === 0) return;

    this.sendMessage({
      m: "quote_add_symbols",
      p: symbols,
    });
  }

  unsubscribe(assets: SubscriptionItem[]) {
    const symbols: string[] = [];
    for (const asset of assets) {
      const subscription = subscriptionKey({
        symbol: asset.symbol,
        exchange: asset.exchange,
      });

      if (!this.subscriptions.has(subscription)) {
        continue;
      }

      this.subscriptions.delete(subscription);
      symbols.push(subscription);
    }

    if (symbols.length === 0) return;

    this.sendMessage({
      m: "quote_remove_symbols",
      p: symbols,
    });
  }

  resubscribe(assets: SubscriptionItem[]) {
    const symbols = assets.map((asset) =>
      subscriptionKey({
        symbol: asset.symbol,
        exchange: asset.exchange,
      }),
    );

    if (symbols.length === 0) return;

    this.sendMessage({
      m: "quote_remove_symbols",
      p: symbols,
    });

    this.sendMessage({
      m: "quote_add_symbols",
      p: symbols,
    });
  }

  // ---- REASSIGNABLE ----

  onopen() {
    logger.info("WS open");
  }

  onprice(price: IncomingPacket) {
    logger.debug("Price update", { price });
  }

  onerror(packet: IncomingPacket) {
    logger.error("Error in quote", { packet });
  }

  oncompleted(packet: IncomingPacket) {
    logger.debug("Quote completed", { packet });
  }
}

export const tradingview = new TradingviewIngestor();
