import { Plus, Loader } from "lucide-solid";
import { createMemo, createSignal } from "solid-js";
import { toast } from "solid-sonner";

import type { AssetSearchResult } from "~/types/types";
import { assetsStore } from "~/state/assets-store";
import { pendingAssetsStore, makeKey } from "~/state/pending-assets";
import { cls, deriveAssetType } from "~/utils/general";

export const SearchedAsset = (props: {
  asset: AssetSearchResult;
  class?: string;
}) => {
  const { addAsset } = assetsStore();
  const pending = pendingAssetsStore();
  const [adding, setAdding] = createSignal(false);

  const type = deriveAssetType(props.asset);

  const id = createMemo(() => makeKey(props.asset));

  const isPending = createMemo(() => {
    const key = id();
    return pending.pendingAssets().some((p) => makeKey(p) === key);
  });

  const handleAdd = async () => {
    if (adding() || isPending()) return;

    const { symbol, exchange, description } = props.asset;
    const assetToAdd = {
      symbol,
      exchange,
      description,
      type,
      image_url: null as null,
    };

    const key = makeKey(assetToAdd);

    setAdding(true);
    pending.addPending(assetToAdd);

    try {
      toast.loading("Adding asset...", { id: "asset-add" });
      await addAsset(assetToAdd);
      toast.success("Asset added", { id: "asset-add" });
    } catch (e) {
      console.log(e);
      toast.error("Failed to add asset", { id: "asset-add" });
    } finally {
      pending.removePending(key);
      setAdding(false);
    }
  };

  return (
    <div
      class={cls(
        "relative flex items-center justify-between gap-2 w-full select-none p-2 rounded-sm border bg-background",
        adding() || isPending()
          ? "border-blue-500/30 bg-blue-500/5"
          : "border-white/5",
        props.class,
      )}
    >
      <div class="grid grid-cols-[auto_1fr] gap-x-2 pr-10">
        <div class="col-start-1 text-xs">
          {props.asset.symbol}:{props.asset.exchange}
        </div>
        <div class="col-start-2 text-xs text-current/50 rounded-xs">{type}</div>
        <div class="col-span-2 text-xs opacity-50">
          {props.asset.description}
        </div>
      </div>

      <div class="absolute group right-0 m-1 inset-y-0">
        <div class="size-full aspect-square flex items-center justify-center">
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding() || isPending()}
            class={cls(
              "p-1.5 rounded-xs size-full cursor-pointer",
              adding() || isPending() ? "opacity-60 cursor-not-allowed" : "",
            )}
            aria-label="Add asset"
            title="Add asset"
          >
            {adding() ? (
              <Loader size={14} class="animate-spin m-auto" />
            ) : (
              <Plus size={14} class="group-hover:text-blue-500 m-auto" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
