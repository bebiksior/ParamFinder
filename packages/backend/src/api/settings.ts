import { error, ok, Result, Settings } from "shared";
import { BackendSDK } from "../types/types";
import { getSettingsStore } from "../settings/settings";

export async function getSettings(sdk: BackendSDK): Promise<Result<Settings>> {
  const settingsStore = getSettingsStore();

  try {
    if (!settingsStore) {
      return error("Settings store not initialized");
    }
    const settings = settingsStore.getSettings();
    return ok(settings);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function updateSettings(
  sdk: BackendSDK,
  settings: Settings,
): Promise<Result<void>> {
  const settingsStore = getSettingsStore();

  try {
    if (!settingsStore) {
      return error("Settings store not initialized");
    }
    settingsStore.updateSettings(settings);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function getSettingsPath(
  sdk: BackendSDK,
): Promise<Result<string>> {
  const settingsStore = getSettingsStore();

  try {
    if (!settingsStore) {
      return error("Settings store not initialized");
    }
    const path = settingsStore.getSettingsPath();
    return ok(path);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}
