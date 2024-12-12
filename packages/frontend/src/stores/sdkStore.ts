import type { CaidoSDK } from "@/types";
import { atom } from "nanostores";

export const $sdk = atom<CaidoSDK | null>(null);

export const setSDK = (sdk: CaidoSDK) => {
  $sdk.set(sdk);
};

export const getSDK = (): CaidoSDK => {
  const sdk = $sdk.get();
  if (!sdk) {
    throw new Error("SDK is not initialized!");
  }
  return sdk;
};
