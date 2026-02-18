import { createContext, createSignal, type JSX, useContext } from "solid-js";
import type { AssetData } from "~/types/types";

export type PendingAsset = Omit<AssetData, "base_asset" | "quote_asset">;

export function makeKey(item: { exchange?: string; symbol?: string }) {
  const exchange = (item.exchange || "").trim().toUpperCase();
  const symbol = (item.symbol || "").trim().toUpperCase();
  return `${symbol}:${exchange}`;
}

type PendingStore = {
  pendingAssets: () => PendingAsset[];
  addPending: (asset: PendingAsset) => void;
  removePending: (id: string) => void;
};

const PendingContext = createContext<PendingStore | undefined>(undefined);

export function PendingAssetsProvider(props: { children: JSX.Element }) {
  const [pendingAssets, setPendingAssets] = createSignal<PendingAsset[]>([]);

  const addPending = (asset: PendingAsset) => {
    const id = makeKey(asset);
    setPendingAssets((prev) => {
      if (prev.some((p) => makeKey(p) === id)) return prev;
      return [...prev, asset];
    });
  };

  const removePending = (id: string) => {
    const key = id.trim().toUpperCase();
    setPendingAssets((prev) => prev.filter((p) => makeKey(p) !== key));
  };

  return (
    <PendingContext.Provider
      value={{ pendingAssets, addPending, removePending }}
    >
      {props.children}
    </PendingContext.Provider>
  );
}

export function pendingAssetsStore() {
  const store = useContext(PendingContext);
  if (!store) throw new Error("PendingAssetsProvider missing");
  return store;
}
