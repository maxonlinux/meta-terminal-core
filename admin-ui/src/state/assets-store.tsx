import { useAction } from "@solidjs/router";
import { createContext, createResource, useContext, type JSX } from "solid-js";
import {
  addAsset,
  getAssets,
  removeAsset,
  searchAssets,
  searchSavedAssets,
} from "~/server/assets";
import type { AssetData, AssetSearchResult } from "~/types/types";

type AssetsStore = {
  assets: () => AssetData[] | undefined;
  isLoading: () => boolean;
  addAsset: (asset: Omit<AssetData, "base_asset" | "quote_asset">) => Promise<void>;
  removeAsset: (symbol: string) => Promise<void>;
  searchAssets: (query: string) => Promise<AssetSearchResult[]>;
  searchSavedAssets: (query: string) => Promise<AssetData[]>;
  revalidate: () => Promise<void>;
};

const AssetsContext = createContext<AssetsStore | undefined>(undefined);

export function AssetsProvider(props: { children: JSX.Element }) {
  const fetchAssets = async () => {
    return await getAssets();
  };

  const [assets, { refetch }] = createResource(fetchAssets);

  const addAction = useAction(addAsset);
  const removeAction = useAction(removeAsset);

  const add = async (
    asset: Omit<AssetData, "base_asset" | "quote_asset">,
  ) => {
    await addAction(asset);
    await refetch();
  };

  const remove = async (symbol: string) => {
    await removeAction(symbol);
    await refetch();
  };

  const store: AssetsStore = {
    assets,
    isLoading: () => assets.loading && assets() === undefined,
    addAsset: add,
    removeAsset: remove,
    searchAssets: async (query: string) => searchAssets(query),
    searchSavedAssets: async (query: string) => searchSavedAssets(query),
    revalidate: async () => {
      await refetch();
    },
  };

  return (
    <AssetsContext.Provider value={store}>
      {props.children}
    </AssetsContext.Provider>
  );
}

export function assetsStore() {
  const store = useContext(AssetsContext);
  if (!store) throw new Error("AssetsContext missing");
  return store;
}
