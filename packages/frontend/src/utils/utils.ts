import { FrontendSDK } from "@/types";
import { Result } from "shared";

export async function handleBackendCall<T>(
  promise: Promise<Result<T>>,
  sdk: FrontendSDK
) {
  const result = await promise;

  if (result.kind === "Error") {
    sdk?.window.showToast(result.error, {
      variant: "error",
    });
    throw new Error(result.error);
  }

  return result.value;
}


export const uint8ArrayToString = (uint8Array: Uint8Array | undefined) => {
  if (!uint8Array) return "";
  return new TextDecoder().decode(uint8Array);
};
