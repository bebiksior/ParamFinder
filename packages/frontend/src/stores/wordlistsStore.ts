import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSDK } from "./sdkStore";

const WORDLISTS_QUERY_KEY = ["wordlists"] as const;

export function useWordlists() {
  return useQuery({
    queryKey: WORDLISTS_QUERY_KEY,
    queryFn: async () => {
      const sdk = getSDK();
      return await sdk.backend.getWordlists();
    },
  });
}

export function useAddWordlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (path: string) => {
      const sdk = getSDK();
      await sdk.backend.addWordlistPath(path);
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
      await sdk.backend.toggleWordlist(path, enabled);
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
      await sdk.backend.removeWordlistPath(path);
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
      await sdk.backend.clearWordlists();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORDLISTS_QUERY_KEY });
    },
  });
}
