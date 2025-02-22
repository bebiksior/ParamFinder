import { useCallback } from "react";
import {
  useRemoveWordlist,
  useClearWordlists,
  useToggleWordlist,
  useUpdateAttackTypes,
} from "../stores/wordlistsStore";
import { AttackType } from "shared";

export function useWordlistActions() {
  const { mutate: removeWordlist } = useRemoveWordlist();
  const { mutate: clearWordlists } = useClearWordlists();
  const { mutate: toggleWordlist } = useToggleWordlist();
  const { mutate: updateAttackTypes } = useUpdateAttackTypes();

  const handleToggleWordlist = useCallback(
    (path: string, enabled: boolean) => {
      toggleWordlist({ path, enabled });
    },
    [toggleWordlist]
  );

  const handleUpdateAttackTypes = useCallback(
    (path: string, attackTypes: AttackType[]) => {
      updateAttackTypes({ path, attackTypes });
    },
    [updateAttackTypes]
  );

  return {
    removeWordlist,
    clearWordlists,
    handleToggleWordlist,
    handleUpdateAttackTypes,
  };
}
