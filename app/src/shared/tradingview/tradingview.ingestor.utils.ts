import type {
  IncomingPacket,
  IncomingPacketWithPrice,
} from "./tradingview.ingestor.types";

export function genSession(type = "xs") {
  let r = "";
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 12; i += 1)
    r += c.charAt(Math.floor(Math.random() * c.length));
  return `${type}_${r}`;
}

export const subscriptionKey = ({
  exchange,
  symbol,
}: {
  exchange: string;
  symbol: string;
}) => `${exchange}:${symbol}`;

export const isIncomingMessageWithPrice = (
  message: IncomingPacket,
): message is IncomingPacketWithPrice =>
  typeof message === "object" &&
  "p" in message &&
  Array.isArray(message.p) &&
  typeof message.p[1] === "object" &&
  "lp" in message.p[1].v &&
  typeof message.p[1].v.lp === "number";
