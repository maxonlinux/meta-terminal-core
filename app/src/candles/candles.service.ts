import { candlesRepo } from "./candles.repository";

class CandlesService {
  getCandles = async (
    symbol: string,
    interval: number,
    outputsize: number = 50,
    before?: number
  ) => {
    const candles = await candlesRepo.getCandles(
      symbol,
      interval,
      outputsize,
      before
    );

    if (!candles) return [];

    return candles.reverse();
  };

  getLastCandle = async (symbol: string, interval: number) => {
    const candle = await candlesRepo.getLastCandle(symbol, interval);
    if (!candle) return null;

    return candle;
  };
}

export const candlesService = new CandlesService();
