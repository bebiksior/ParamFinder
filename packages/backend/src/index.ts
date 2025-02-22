import { SDK, DefineAPI } from "caido:plugin";
import { initSettingsStore } from "./settings/settings";
import {
  cancelMining,
  deleteSession,
  pauseMining,
  resumeMining,
  startMining,
} from "./api/mining";
import { initWordlistManager } from "./wordlists/wordlists";
import { getSettings, getSettingsPath, updateSettings } from "./api/settings";
import {
  addWordlistPath,
  clearWordlists,
  getWordlists,
  importWordlist,
  removeWordlistPath,
  toggleWordlist,
  updateAttackTypes,
} from "./api/wordlists";
import {
  cancelWordlistUpload,
  finalizeWordlistUpload,
  startWordlistUpload,
  uploadWordlistChunk,
} from "./api/uploader";
import { getRequest } from "./api/requests";

export type { BackendEvents } from "./types/types";

export type API = DefineAPI<{
  // Mining
  startMining: typeof startMining;
  cancelMining: typeof cancelMining;
  pauseMining: typeof pauseMining;
  resumeMining: typeof resumeMining;
  deleteSession: typeof deleteSession;

  // Requests
  getRequest: typeof getRequest;

  // Wordlists
  addWordlistPath: typeof addWordlistPath;
  removeWordlistPath: typeof removeWordlistPath;
  getWordlists: typeof getWordlists;
  clearWordlists: typeof clearWordlists;
  importWordlist: typeof importWordlist;
  toggleWordlist: typeof toggleWordlist;
  updateAttackTypes: typeof updateAttackTypes;

  // Uploader
  startWordlistUpload: typeof startWordlistUpload;
  uploadWordlistChunk: typeof uploadWordlistChunk;
  finalizeWordlistUpload: typeof finalizeWordlistUpload;
  cancelWordlistUpload: typeof cancelWordlistUpload;

  // Settings
  getSettings: typeof getSettings;
  updateSettings: typeof updateSettings;
  getSettingsPath: typeof getSettingsPath;
}>;

export function init(sdk: SDK<API>) {
  initWordlistManager(sdk);
  initSettingsStore(sdk);

  // Mining
  sdk.api.register("startMining", startMining);
  sdk.api.register("getRequest", getRequest);
  sdk.api.register("cancelMining", cancelMining);
  sdk.api.register("pauseMining", pauseMining);
  sdk.api.register("resumeMining", resumeMining);
  sdk.api.register("deleteSession", deleteSession);

  // Wordlists
  sdk.api.register("addWordlistPath", addWordlistPath);
  sdk.api.register("removeWordlistPath", removeWordlistPath);
  sdk.api.register("getWordlists", getWordlists);
  sdk.api.register("clearWordlists", clearWordlists);
  sdk.api.register("importWordlist", importWordlist);
  sdk.api.register("toggleWordlist", toggleWordlist);
  sdk.api.register("updateAttackTypes", updateAttackTypes);

  // Uploader
  sdk.api.register("startWordlistUpload", startWordlistUpload);
  sdk.api.register("uploadWordlistChunk", uploadWordlistChunk);
  sdk.api.register("finalizeWordlistUpload", finalizeWordlistUpload);
  sdk.api.register("cancelWordlistUpload", cancelWordlistUpload);

  // Settings
  sdk.api.register("getSettings", getSettings);
  sdk.api.register("updateSettings", updateSettings);
  sdk.api.register("getSettingsPath", getSettingsPath);
}
