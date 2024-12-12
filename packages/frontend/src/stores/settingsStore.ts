import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings } from "shared";
import { getSDK } from "./sdkStore";
import { handleBackendCall } from "@/utils/utils";

const SETTINGS_QUERY_KEY = ["settings"];

export function useSettings() {
  const sdk = getSDK();

  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      return await handleBackendCall(sdk.backend.getSettings(), sdk);
    }
  });
}

export function useUpdateSettings() {
  const sdk = getSDK();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Settings) => {
      await handleBackendCall(sdk.backend.updateSettings(settings), sdk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    }
  });
}

export function useSettingsPath() {
  const sdk = getSDK();
  return useQuery({
    queryKey: ["settingsPath"],
    queryFn: async () => {
      return await handleBackendCall(sdk.backend.getSettingsPath(), sdk);
    }
  });
}
