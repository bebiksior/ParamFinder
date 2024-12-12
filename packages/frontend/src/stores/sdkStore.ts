import type { FrontendSDK } from "@/types";
import { atom } from "nanostores";

export const $sdk = atom<FrontendSDK | null>(null);

export const setSDK = (sdk: FrontendSDK) => {
  $sdk.set(sdk);
};

export const getSDK = (): FrontendSDK => {
  const sdk = $sdk.get();
  if (!sdk) {
    throw new Error("SDK is not initialized!");
  }
  return sdk;
};
