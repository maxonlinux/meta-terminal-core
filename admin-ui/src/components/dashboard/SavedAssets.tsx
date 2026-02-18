import { Brackets, Frown, Loader, SaveAll, Trash2 } from "lucide-solid";
import { createMemo, createSignal, For, Match, Show, Switch } from "solid-js";
import { toast } from "solid-sonner";
import { ContentContainer } from "~/components/dashboard/ContentContainer";
import { Skeleton } from "~/components/Skeleton";
import { assetsStore } from "~/state/assets-store";
import { useCandles } from "~/state/candles-store";
import type { AssetData } from "~/types/types";
import { cls } from "~/utils/general";

export type PendingAsset = Omit<AssetData, "base_asset" | "quote_asset">;

type SavedAssetProps = {
  asset: AssetData | PendingAsset;
  pending?: boolean;
};

const SavedAsset = (props: SavedAssetProps) => {
  const [isRemoving, setIsRemoving] = createSignal(false);
  const candles = useCandles();
  const { removeAsset } = assetsStore();

  const candle = () => candles.get(props.asset.symbol);
  const candleColor = () => {
    const c = candle();
    if (!c) return "text-white/50";
    if (c.close > c.open) return "text-green-400";
    if (c.close < c.open) return "text-red-400";
    return "text-white/50";
  };

  const handleRemove = async () => {
    if (props.pending) return;

    setIsRemoving(true);

    try {
      toast.loading("Deleting asset...", { id: "asset-delete" });
      await removeAsset(props.asset.symbol);
      toast.success("Asset deleted", { id: "asset-delete" });
    } catch (e) {
      console.log(e);
      toast.error("Failed to delete asset", { id: "asset-delete" });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div class="relative flex gap-2 border border-white/5 bg-background rounded-sm p-2">
      <Show
        when={!props.pending}
        fallback={
          <div class="size-8 flex items-center justify-center">
            <Loader class="animate-spin" />
          </div>
        }
      >
        <div class="relative size-8 bg-neutral-800 rounded-xs overflow-hidden">
          <Show
            when={!!props.asset.image_url}
            fallback={
              <div class="size-full flex items-center justify-center">
                <Frown size={14} class="text-current/50" />
              </div>
            }
          >
            <img
              src={`/api/storage/${props.asset.image_url}`}
              alt={`${props.asset.symbol} Logo`}
              class="h-full w-full object-cover"
              width={32}
              height={32}
              loading="lazy"
            />
          </Show>
        </div>
      </Show>

      <div
        class={cls("grid grid-cols-[auto_1fr] gap-x-2", {
          "animate-pulse": !!props.pending,
        })}
      >
        <div class="col-start-1 text-xs">
          {props.asset.symbol}:{props.asset.exchange}
        </div>
        <div class="col-start-2 text-xs text-current/50 rounded-xs">
          {props.asset.type}
        </div>
        <div class="col-span-2 text-xs opacity-50">
          {props.asset.description}
        </div>
      </div>

      <Show when={candle()}>
        {(c) => (
          <div
            class={cls(
              "flex items-center ml-auto mr-10 text-xs",
              candleColor(),
            )}
          >
            {c().close}
          </div>
        )}
      </Show>

      <Show when={!props.pending}>
        <div class="absolute group right-0 m-1 inset-y-0">
          <div class="size-full aspect-square flex items-center justify-center">
            <Show
              when={!isRemoving()}
              fallback={
                <div class="p-1.5">
                  <Loader size={14} class="animate-spin" />
                </div>
              }
            >
              <button
                type="button"
                class="p-1.5 cursor-pointer rounded-xs size-full"
                onClick={handleRemove}
              >
                <Trash2 size={14} class="group-hover:text-red-400 m-auto" />
              </button>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
};

const SavedAssetSkeleton = () => (
  <div class="relative flex gap-2 border border-white/5 bg-background rounded-sm p-2">
    <Skeleton class="size-8 rounded-sm" />
    <div class="grid grid-cols-[auto_1fr] gap-2">
      <Skeleton class="col-start-1 h-3 w-40 rounded-sm" />
      <Skeleton class="col-start-2 h-3 w-28 rounded-sm" />
      <Skeleton class="col-span-2 h-3 w-30 rounded-sm" />
    </div>
  </div>
);

const AssetCount = (props: { assets: AssetData[] | undefined }) => (
  <Show when={props.assets}>
    {(a) => (
      <span class="text-xs rounded-full px-2 py-0.5 bg-background border border-white/10">
        {a().length}
      </span>
    )}
  </Show>
);

type SavedAssetsProps = {
  pendingAssets: PendingAsset[];
};

export const SavedAssets = (props: SavedAssetsProps) => {
  const { assets, isLoading } = assetsStore();
  const [search, setSearch] = createSignal("");

  const skeletonKeys = Array.from({ length: 6 }, (_, i) => i);

  const filtered = createMemo<AssetData[]>(() => {
    const list = assets() ?? [];
    const q = search().trim().toLowerCase();

    if (!q) return list;

    return list.filter((asset) => {
      const symbol = asset.symbol.toLowerCase();
      const exchange = asset.exchange.toLowerCase();
      const description = (asset.description ?? "").toLowerCase();

      return (
        symbol.includes(q) || exchange.includes(q) || description.includes(q)
      );
    });
  });

  const totalCount = createMemo(() => {
    return filtered().length + props.pendingAssets.length;
  });

  const isSearching = createMemo(() => search().trim().length > 0);

  return (
    <ContentContainer class="relative overflow-hidden">
      <div class="flex flex-col h-full w-full">
        <div class="p-2">
          <p class="flex items-center gap-2 mb-2 py-2">
            <SaveAll size={16} /> Saved Assets <AssetCount assets={assets()} />
          </p>

          <div class="relative w-full flex items-center rounded-sm border border-white/10 appearance-none">
            <input
              placeholder="Search asset"
              aria-label="Asset search input"
              class="w-full text-white p-2 rounded-xs data-focused:ring data-focused:outline-none data-focused:ring-white placeholder:text-sm"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck={false}
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
            />

            <Show when={isSearching() && isLoading()}>
              <Loader class="absolute right-3 size-3 animate-spin" />
            </Show>
          </div>
        </div>

        <ul class="flex flex-col gap-2 text-white min-h-0 overflow-y-auto overflow-x-hidden p-2 list-none">
          {/* pending assets сверху всегда */}
          <For each={props.pendingAssets}>
            {(asset) => (
              <li>
                <SavedAsset asset={asset} pending />
              </li>
            )}
          </For>

          <Switch>
            {/* loading */}
            <Match when={isLoading()}>
              <For each={skeletonKeys}>
                {() => (
                  <li>
                    <SavedAssetSkeleton />
                  </li>
                )}
              </For>
            </Match>

            {/* есть данные */}
            <Match when={filtered().length > 0}>
              <For each={filtered()}>
                {(asset) => (
                  <li>
                    <SavedAsset asset={asset} />
                  </li>
                )}
              </For>
            </Match>

            {/* empty */}
            <Match when={totalCount() === 0}>
              <li>
                <div class="flex gap-4 items-center justify-center size-full opacity-50">
                  <Show
                    when={isSearching()}
                    fallback={
                      <>
                        <Brackets />
                        <p>No assets</p>
                      </>
                    }
                  >
                    <Frown />
                    <p>Nothing found</p>
                  </Show>
                </div>
              </li>
            </Match>
          </Switch>
        </ul>
      </div>
    </ContentContainer>
  );
};
