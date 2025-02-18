import { SDK } from "caido:plugin";
import { Settings } from "shared";
import * as path from "path";
import { readFile, writeFile } from "fs/promises";

class SettingsStore {
  private static instance: SettingsStore;

  private settings: Settings;
  private sdk: SDK;

  constructor(sdk: SDK) {
    this.settings = {
      delay: 20,
      concurrency: 5,
      timeout: 15 * 60,
      autoDetectMaxSize: true,
      performanceMode: false,
      learnRequestsCount: 6,
      wafDetection: true,
      additionalChecks: true,
      debug: false,
      autopilotEnabled: true,
      updateContentLength: true,
      ignoreAnomalyTypes: [],
    };
    this.sdk = sdk;

    this.loadSettingsFromFile();
    SettingsStore.instance = this;
  }

  static get(): SettingsStore {
    if (!SettingsStore.instance) {
      throw new Error("SettingsStore not initialized");
    }

    return SettingsStore.instance;
  }

  getSettings(): Settings {
    return this.settings;
  }

  updateSettings(newSettings: Settings): Settings {
    this.settings = newSettings;
    this.saveSettingsToFile();
    return this.settings;
  }

  updateSetting(key: string, value: any): Settings {
    Object.assign(this.settings, { [key]: value });
    this.saveSettingsToFile();
    return this.settings;
  }

  getSettingsPath(): string {
    return path.join(this.sdk.meta.path(), "settings.json");
  }

  private async saveSettingsToFile() {
    const settingsPath = this.getSettingsPath();
    await writeFile(settingsPath, JSON.stringify(this.settings, null, 2));
  }

  private async loadSettingsFromFile() {
    const settingsPath = this.getSettingsPath();
    try {
      const settings = JSON.parse(await readFile(settingsPath, "utf-8"));
      Object.assign(this.settings, settings);
    } catch (error) {
      await this.saveSettingsToFile();
    }
  }
}

let settingsStore: SettingsStore | null = null;
export function initSettingsStore(sdk: SDK) {
  if (settingsStore) {
    throw new Error("Settings store already initialized");
  }

  settingsStore = new SettingsStore(sdk);
}

export function getSettingsStore(): SettingsStore {
  if (!settingsStore) {
    throw new Error("Settings store not initialized");
  }

  return settingsStore;
}
