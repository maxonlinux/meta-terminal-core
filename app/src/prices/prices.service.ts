import type { TickData } from "./prices.types";
import { pricesRepo } from "./prices.repository";

class PricesService {
  getLastPrice = async (symbol: string) => {
    const tick = await pricesRepo.getLastPrice(symbol);

    if (tick) {
      return {
        value: tick.price,
        timestamp: tick.timestamp,
        volume: tick.volume,
      };
    }

    const priceFromCandle = await pricesRepo.getLastPriceFromCandle(symbol);

    if (priceFromCandle) {
      return {
        value: priceFromCandle.price,
        timestamp: priceFromCandle.timestamp,
        volume: 0,
      };
    }

    return null;
  };

  savePriceTick = async (data: Omit<TickData, "volume">) => {
    return pricesRepo.savePriceTick(data);
  };
}

export const priceService = new PricesService();
