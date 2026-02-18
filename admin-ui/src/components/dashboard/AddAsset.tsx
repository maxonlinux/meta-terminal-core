import { createDebouncedMemo } from "@solid-primitives/memo";
import { BadgePlus, Frown, Loader, TextCursorInput } from "lucide-solid";
import {
  createMemo,
  createResource,
  createSignal,
  For,
  Match,
  Show,
  Switch,
} from "solid-js";

import { ContentContainer } from "~/components/dashboard/ContentContainer";
import { Skeleton } from "~/components/Skeleton";
import { assetsStore } from "~/state/assets-store";
import type { AssetSearchResult } from "~/types/types";
import { pendingAssetsStore, makeKey } from "~/state/pending-assets";
import { SearchedAsset } from "./SearchedAsset";

const SearchedAssetSkeleton = () => (
  <div class="relative flex gap-2 border border-white/5 bg-background rounded-sm p-2">
    <div class="grid grid-cols-[auto_1fr] gap-2 w-full">
      <Skeleton class="col-start-1 h-3 w-40 rounded-sm" />
      <Skeleton class="col-start-2 h-3 w-28 rounded-sm" />
      <Skeleton class="col-span-2 h-3 w-30 rounded-sm" />
    </div>
  </div>
);

const List = (props: {
  search: () => string;
  isLoading: () => boolean;
  items: () => AssetSearchResult[];
}) => {
  const hasSearch = createMemo(() => props.search().trim().length > 0);

  return (
    <Switch>
      <Match when={props.isLoading() && props.items().length === 0}>
        <div class="flex flex-col gap-2 text-white min-h-0 overflow-y-auto overflow-x-hidden p-2">
          <For each={[0, 1, 2, 3, 4, 5]}>{() => <SearchedAssetSkeleton />}</For>
        </div>
      </Match>

      <Match when={!hasSearch()}>
        <div class="flex items-center justify-center h-full">
          <div class="flex items-center gap-4 opacity-50">
            <TextCursorInput />
            <p class="text-sm">Search for an asset</p>
          </div>
        </div>
      </Match>

      <Match when={props.items().length === 0}>
        <div class="flex gap-4 items-center justify-center size-full opacity-50">
          <Frown />
          <p>Nothing found</p>
        </div>
      </Match>

      <Match when={props.items().length > 0}>
        <ul class="flex flex-col gap-2 text-white min-h-0 overflow-y-auto overflow-x-hidden p-2 list-none">
          <For each={props.items()}>
            {(item) => (
              <li>
                <SearchedAsset asset={item} />
              </li>
            )}
          </For>
        </ul>
      </Match>
    </Switch>
  );
};

export const AddAsset = () => {
  const [search, setSearch] = createSignal("");
  const debounced = createDebouncedMemo(() => search().trim(), 500);

  const { assets, searchAssets } = assetsStore();
  const pending = pendingAssetsStore();

  const [searchResult] = createResource(
    debounced,
    async (q) => {
      if (!q) return [];
      try {
        return await searchAssets(q);
      } catch {
        return [];
      }
    },
    { initialValue: [] },
  );

  const isSpinner = createMemo(() => {
    const s = search().trim();
    if (!s) return false;
    return debounced() !== s || searchResult.loading;
  });

  const uniqueSearched = createMemo(() => {
    const items = searchResult.latest;
    const map = new Map<string, AssetSearchResult>();
    for (const item of items) map.set(makeKey(item), item);
    return Array.from(map.values());
  });

  const filtered = createMemo(() => {
    const items = uniqueSearched();
    const existing = assets() ?? [];
    const pend = pending.pendingAssets();

    return items.filter((asset) => {
      const id = makeKey(asset);
      const isExisting = existing.some((e) => makeKey(e) === id);
      const isPending = pend.some((p) => makeKey(p) === id);
      return !isExisting && !isPending;
    });
  });

  const isListLoading = createMemo(() => {
    return search().trim().length > 0 && searchResult.loading;
  });

  return (
    <ContentContainer>
      <div class="flex flex-col h-full w-full">
        <div class="p-2">
          <p class="flex items-center gap-2 mb-2 py-2">
            <BadgePlus size={16} /> Add Asset
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

            <Show when={isSpinner()}>
              <Loader class="absolute right-3 size-3 animate-spin" />
            </Show>
          </div>
        </div>

        <List search={search} isLoading={isListLoading} items={filtered} />
      </div>
    </ContentContainer>
  );
};
