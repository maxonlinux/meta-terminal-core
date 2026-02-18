import type { RouteDefinition } from "@solidjs/router";
import { AssetManager } from "~/components/dashboard/AssetManager";
import { getAssets } from "~/server/assets";

export const route = {
  preload: () => getAssets(),
} satisfies RouteDefinition;

export default function Page() {
  return <AssetManager />;
}
