import { useCallback } from "react";
import {
  useRemoveWordlist,
  useClearWordlists,
  useToggleWordlist,
} from "../stores/wordlistsStore";

export function useWordlistActions() {
  const { mutate: removeWordlist } = useRemoveWordlist();
  const { mutate: clearWordlists } = useClearWordlists();
  const { mutate: toggleWordlist } = useToggleWordlist();

  const handleToggleWordlist = useCallback(
    (path: string, enabled: boolean) => {
      toggleWordlist({ path, enabled });
    },
    [toggleWordlist]
  );

  return {
    removeWordlist,
    clearWordlists,
    handleToggleWordlist,
  };
}
