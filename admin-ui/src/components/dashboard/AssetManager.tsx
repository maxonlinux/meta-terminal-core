import { createMemo } from "solid-js";
import { AssetsProvider, assetsStore } from "~/state/assets-store";
import { CandlesProvider } from "~/state/candles-store";
import {
  PendingAssetsProvider,
  pendingAssetsStore,
} from "~/state/pending-assets";

import { AddAsset } from "./AddAsset";
import { SavedAssets } from "./SavedAssets";

const AssetManagerContent = () => {
  const { assets } = assetsStore();
  const pending = pendingAssetsStore();

  const allSymbolsForPolling = createMemo(() => {
    const saved = assets() ?? [];
    const out: string[] = [];
    for (const a of saved) out.push(a.symbol);
    return Array.from(new Set(out));
  });

  return (
    <CandlesProvider getSymbols={allSymbolsForPolling}>
      <div class="h-full min-h-0 grid grid-cols-2 max-sm:grid-cols-1 max-sm:grid-rows-2 px-2 gap-2">
        <AddAsset />
        <SavedAssets pendingAssets={pending.pendingAssets()} />
      </div>
    </CandlesProvider>
  );
};

export const AssetManager = () => (
  <AssetsProvider>
    <PendingAssetsProvider>
      <AssetManagerContent />
    </PendingAssetsProvider>
  </AssetsProvider>
);
