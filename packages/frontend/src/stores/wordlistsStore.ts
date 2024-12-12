import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSDK } from "./sdkStore";
import { handleBackendCall } from "@/utils/utils";
const WORDLISTS_QUERY_KEY = ["wordlists"] as const;

export function useWordlists() {
  return useQuery({
    queryKey: WORDLISTS_QUERY_KEY,
    queryFn: async () => {
      const sdk = getSDK();
      return await handleBackendCall(sdk.backend.getWordlists(), sdk);
    },
  });
}

export function useAddWordlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (path: string) => {
      const sdk = getSDK();
      await handleBackendCall(sdk.backend.addWordlistPath(path), sdk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORDLISTS_QUERY_KEY });
    },
  });
}

export function useRefreshWordlist() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: WORDLISTS_QUERY_KEY });
  };
}

export function useToggleWordlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ path, enabled }: { path: string; enabled: boolean }) => {
      const sdk = getSDK();
      await handleBackendCall(sdk.backend.toggleWordlist(path, enabled), sdk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORDLISTS_QUERY_KEY });
    },
  });
}

export function useRemoveWordlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (path: string) => {
      const sdk = getSDK();
      await handleBackendCall(sdk.backend.removeWordlistPath(path), sdk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORDLISTS_QUERY_KEY });
    },
  });
}

export function useClearWordlists() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const sdk = getSDK();
      await handleBackendCall(sdk.backend.clearWordlists(), sdk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORDLISTS_QUERY_KEY });
    },
  });
}
