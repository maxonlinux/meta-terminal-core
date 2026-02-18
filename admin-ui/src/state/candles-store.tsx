import { createContext, useContext, type JSX } from "solid-js";
import { createSignal, onCleanup } from "solid-js";
import type { Candle } from "~/types/types";
import axios from "axios";

type CandleKey = `${string}:${number}`;

function makeKey(symbol: string, interval: number): CandleKey {
  return `${symbol}:${interval}`;
}

export function createCandlesPoller(params: {
  intervalSec: number;
  getSymbols: () => string[];
  pollMs?: number;
  concurrency?: number;
}) {
  const pollMs = params.pollMs ?? 1000;
  const concurrency = params.concurrency ?? 6;

  const [map, setMap] = createSignal<Record<CandleKey, Candle>>({});

  const fetchOne = async (symbol: string): Promise<void> => {
    const res = await axios.get<Candle>("/api/candles/last", {
      params: { symbol, interval: params.intervalSec },
      withCredentials: true,
      timeout: 8000,
      validateStatus: () => true,
    });

    if (res.status < 200 || res.status >= 300) return;

    const candle = res.data;
    const open = Number(candle.open);
    const close = Number(candle.close);
    const high = Number(candle.high);
    const low = Number(candle.low);
    const volume = Number(candle.volume);
    const time = Number(candle.time);

    if (
      !Number.isFinite(open) ||
      !Number.isFinite(close) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(volume) ||
      !Number.isFinite(time)
    ) {
      return;
    }
    const key = makeKey(symbol, params.intervalSec);

    setMap((prev) => ({
      ...prev,
      [key]: { open, close, high, low, volume, time },
    }));
  };

  const pollOnce = (): void => {
    const symbols = params.getSymbols();
    if (symbols.length === 0) return;

    for (let i = 0; i < symbols.length; i += concurrency) {
      const chunk = symbols.slice(i, i + concurrency);
      void Promise.allSettled(chunk.map((s) => fetchOne(s)));
    }
  };

  const timer = setInterval(pollOnce, pollMs);

  onCleanup(() => clearInterval(timer));

  const get = (symbol: string): Candle | undefined => {
    return map()[makeKey(symbol, params.intervalSec)];
  };

  return {
    get,
    pollOnce,
  };
}

type CandlesStore = ReturnType<typeof createCandlesPoller>;

const CandlesContext = createContext<CandlesStore | undefined>(undefined);

export function CandlesProvider(props: {
  getSymbols: () => string[];
  children: JSX.Element;
}) {
  const store = createCandlesPoller({
    intervalSec: 60 * 60 * 24,
    getSymbols: props.getSymbols,
    pollMs: 1000,
    concurrency: 6,
  });

  return (
    <CandlesContext.Provider value={store}>
      {props.children}
    </CandlesContext.Provider>
  );
}

export function useCandles() {
  const store = useContext(CandlesContext);
  if (!store) throw new Error("CandlesContext missing");
  return store;
}
