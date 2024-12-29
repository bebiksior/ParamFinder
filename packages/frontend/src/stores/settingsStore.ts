import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings } from "shared";
import { getSDK } from "./sdkStore";
import { handleBackendCall } from "@/utils/utils";

export function useSettings<TData = Settings>(select?: (data: Settings) => TData) {
  const sdk = getSDK();

  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      return await handleBackendCall(sdk.backend.getSettings(), sdk);
    },
    select,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const sdk = getSDK();

  return useMutation({
    mutationFn: async (settings: Settings) => {
      return await handleBackendCall(sdk.backend.updateSettings(settings), sdk);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
    },
  });
}

export function useUpdateSettingsField() {
  const { data: settings } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();

  return (fields: Partial<Settings>) => {
    if (!settings) return;
    updateSettings({
      ...settings,
      ...fields,
    });
  };
}

export function useSettingsPath() {
  const sdk = getSDK();
  return useQuery({
    queryKey: ["settingsPath"],
    queryFn: async () => {
      return await handleBackendCall(sdk.backend.getSettingsPath(), sdk);
    },
  });
}
