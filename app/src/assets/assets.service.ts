import { tradingview } from "@/shared/tradingview/tradingview.ingestor";
import { assetsRepo } from "./assets.repository";
import type { AssetData, AssetInput } from "./assets.types";
import { AppError } from "@/error.handler";

class AssetsService {
  getAsset = async (symbol: string) => {
    return assetsRepo.getAsset(symbol);
  };
  getAllAssets = async () => {
    return assetsRepo.getAllAssets();
  };

  searchAssets = async (query: string) => {
    return assetsRepo.searchAssets(query);
  };

  addAsset = async (asset: AssetInput) => {
    const newAsset = await assetsRepo.addAsset(asset);
    if (!newAsset) {
      throw new AppError(500, "ASSET_CREATE_FAILED");
    }
    tradingview.subscribe([newAsset]);
  };

  updateAsset = async (
    symbol: string,
    asset: Partial<Omit<AssetData, "symbol">>
  ) => {
    const updatedAsset = await assetsRepo.updateAsset(symbol, asset);
    return updatedAsset;
  };

  deleteAsset = async (symbol: string) => {
    const deletedAsset = await assetsRepo.deleteAsset(symbol);
    if (!deletedAsset) {
      return null;
    }
    tradingview.unsubscribe([deletedAsset]);
    return deletedAsset;
  };
}

export const assetsService = new AssetsService();
