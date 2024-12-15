import { useSettings } from "../stores/settingsStore";
import { useWordlists } from "../stores/wordlistsStore";
import { useSessionsStore } from "../stores/sessionsStore";
import { useSettingsPath } from "../stores/settingsStore";

export function usePageData() {
  // Wordlists page data
  const { data: wordlists, isLoading: isWordlistsLoading } = useWordlists();

  // Settings page data
  const { data: settings, isLoading: isSettingsLoading } = useSettings();
  const { data: settingsPath, isLoading: isSettingsPathLoading } =
    useSettingsPath();

  // Sessions page data
  const sessions = useSessionsStore((state) => state.sessions);

  return {
    wordlists,
    settings,
    settingsPath,
    sessions,
    isLoading: isWordlistsLoading || isSettingsLoading || isSettingsPathLoading,
  };
}
