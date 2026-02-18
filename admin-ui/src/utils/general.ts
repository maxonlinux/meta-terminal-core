import type { AssetSearchResult } from "../types/types";

type ClassValue =
  | string
  | false
  | null
  | undefined
  | { [key: string]: boolean };

export function cls(...args: ClassValue[]): string {
  return args
    .flatMap((arg) => {
      if (!arg) return [];
      if (typeof arg === "string") return [arg];
      if (typeof arg === "object") {
        return Object.entries(arg)
          .filter(([, value]) => value)
          .map(([key]) => key);
      }
      return [];
    })
    .join(" ");
}

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function remToPx(rem: number): number {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function deriveAssetType(asset: AssetSearchResult) {
  const logoid = asset.logoid ?? asset["base-currency-logoid"];

  if (logoid?.includes("/")) {
    const [type] = logoid.split("/");
    return type;
  }

  return asset.type;
}
