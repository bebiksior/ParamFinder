import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings } from "shared";
import { getSDK } from "./sdkStore";

const SETTINGS_QUERY_KEY = ["settings"];

export function useSettings() {
  const sdk = getSDK();

  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      return await sdk.backend.getSettings();
    }
  });
}

export function useUpdateSettings() {
  const sdk = getSDK();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Settings) => {
      await sdk.backend.updateSettings(settings);
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
      return await sdk.backend.getSettingsPath();
    }
  });
}
