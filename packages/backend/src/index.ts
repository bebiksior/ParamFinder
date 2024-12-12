import { SDK, DefineAPI } from "caido:plugin";
import { ParamMiner } from "./miner/param-miner";
import { ParamMinerOptions, Request, Settings, Wordlist } from "shared";
import { BackendEvents } from "./types/types";
import WordlistManager from "./wordlists/wordlists";
import { writeToFile } from "./helper/helper";
import { startUploadSession, uploadChunk, finalizeUpload, cancelUpload } from "./wordlists/uploader";
import { SettingsStore } from "./settings/settings";

export type { BackendEvents } from "./types/types";

const runningSessions: Map<string, ParamMiner> = new Map();
let wordlistManager: WordlistManager | null = null;
let settingsStore: SettingsStore | null = null;

export type API = DefineAPI<{
  // Mining
  startMining: typeof startMining;
  getRequest: typeof getRequest;
  cancelMining: typeof cancelMining;
  pauseMining: typeof pauseMining;
  resumeMining: typeof resumeMining;

  // Wordlists
  addWordlistPath: typeof addWordlistPath;
  removeWordlistPath: typeof removeWordlistPath;
  getWordlists: typeof getWordlists;
  clearWordlists: typeof clearWordlists;
  importWordlist: typeof importWordlist;
  toggleWordlist: typeof toggleWordlist;

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

async function startMining(
  sdk: SDK<API, BackendEvents>,
  target: Request,
  options: ParamMinerOptions
): Promise<void> {
  const miner = new ParamMiner(sdk, options);

  const wordlists = await wordlistManager?.getWordlists();
  if (!wordlists) {
    throw new Error("Wordlist not found");
  }

  await Promise.all(wordlists.map(async (wordlist) => {
    if (wordlist.enabled) {
      await miner.addWordlist(sdk, wordlist.path);
      sdk.console.log(`[WORDLIST] Added ${wordlist.path}`);
    }
  }));

  const instance = miner.setTarget(target);
  sdk.api.send(
    "paramfinder:new",
    instance.getID(),
    instance.getTotalRequests()
  );

  instance.onError((err) => {
    sdk.api.send("paramfinder:error", instance.getID(), err);
    runningSessions.delete(instance.getID());
  });

  instance.onFound((finding) => {
    sdk.api.send("paramfinder:new_finding", instance.getID(), finding);
  });

  instance.onComplete((results) => {
    sdk.api.send("paramfinder:complete", instance.getID());
    runningSessions.delete(instance.getID());
  });

  instance.onStateChange((state) => {
    sdk.api.send("paramfinder:state", instance.getID(), state);
  });

  instance.onResponseReceived((data) => {
    sdk.api.send(
      "paramfinder:response_received",
      instance.getID(),
      data.parametersCount,
      data.requestResponse,
      data.context
    );
  });

  runningSessions.set(instance.getID(), instance);
  try {
    instance.startMining();
  } catch (error) {
    sdk.api.send("paramfinder:error", instance.getID(), error);
    sdk.console.error(error);
  }
}

async function cancelMining(sdk: SDK<API>, id: string): Promise<void> {
  const miner = runningSessions.get(id);
  if (miner) {
    miner.cancel();
  }
}

async function pauseMining(sdk: SDK<API>, id: string): Promise<void> {
  const miner = runningSessions.get(id);
  if (miner) {
    miner.pause();
  }
}

async function resumeMining(sdk: SDK<API>, id: string): Promise<void> {
  const miner = runningSessions.get(id);
  if (miner) {
    miner.resume();
  }
}

async function getRequest(sdk: SDK<API>, id: string): Promise<Request> {
  const requestResponse = await sdk.requests.get(id);
  if (!requestResponse) {
    throw new Error("Request not found");
  }

  const spec = requestResponse.request.toSpec();

  return {
    host: spec.getHost(),
    port: spec.getPort(),
    tls: spec.getTls(),
    method: spec.getMethod(),
    path: spec.getPath(),
    query: spec.getQuery(),
    url: `${
      spec.getTls() ? "https" : "http"
    }://${spec.getHost()}:${spec.getPort()}${spec.getPath()}${spec.getQuery()}`,
    headers: spec.getHeaders(),
    body: spec.getBody()?.toText(),
  } as Request;
}

async function addWordlistPath(sdk: SDK<API>, path: string): Promise<void> {
  if (!wordlistManager) {
    throw new Error("Wordlist manager not initialized");
  }

  await wordlistManager.addWordlistPath(path);
}

async function removeWordlistPath(sdk: SDK<API>, path: string): Promise<void> {
  if (!wordlistManager) {
    throw new Error("Wordlist manager not initialized");
  }

  await wordlistManager.removeWordlistPath(path);
}

async function getWordlists(sdk: SDK<API>): Promise<Wordlist[]> {
  if (!wordlistManager) {
    throw new Error("Wordlist manager not initialized");
  }

  return await wordlistManager.getWordlists();
}

async function clearWordlists(sdk: SDK<API>): Promise<void> {
  if (!wordlistManager) {
    throw new Error("Wordlist manager not initialized");
  }

  await wordlistManager.clearWordlists();
}

async function toggleWordlist(sdk: SDK<API>, path: string, enabled: boolean): Promise<void> {
  if (!wordlistManager) {
    throw new Error("Wordlist manager not initialized");
  }

  await wordlistManager.toggleWordlist(path, enabled);
}

async function importWordlist(sdk: SDK<API>, data: string, filename: string): Promise<void> {
  const filePath = await writeToFile(sdk, data, filename);
  sdk.console.log(`[WORDLIST] Imported wordlist from ${filePath}`);
  await wordlistManager?.addWordlistPath(filePath);
}

async function startWordlistUpload(sdk: SDK<API>, filename: string, totalChunks: number): Promise<string> {
  return startUploadSession(filename, totalChunks);
}

async function uploadWordlistChunk(sdk: SDK<API>, sessionId: string, chunk: string, chunkIndex: number): Promise<void> {
  uploadChunk(sessionId, chunk, chunkIndex);
}

async function finalizeWordlistUpload(sdk: SDK<API>, sessionId: string): Promise<void> {
  const filePath = await finalizeUpload(sessionId, sdk);
  await wordlistManager?.addWordlistPath(filePath);
  sdk.console.log(`[WORDLIST] Imported wordlist from ${filePath}`);
}

async function cancelWordlistUpload(sdk: SDK<API>, sessionId: string): Promise<void> {
  cancelUpload(sessionId);
}

// Settings
async function getSettings(sdk: SDK<API>): Promise<Settings> {
  if (!settingsStore) {
    throw new Error("Settings store not initialized");
  }

  return settingsStore.getSettings();
}

async function updateSettings(sdk: SDK<API>, settings: Settings): Promise<void> {
  if (!settingsStore) {
    throw new Error("Settings store not initialized");
  }

  settingsStore.updateSettings(settings);
}

async function getSettingsPath(sdk: SDK<API>): Promise<string> {
  if (!settingsStore) {
    throw new Error("Settings store not initialized");
  }

  return settingsStore.getSettingsPath();
}

export function init(sdk: SDK<API>) {
  settingsStore = new SettingsStore(sdk);
  wordlistManager = new WordlistManager(sdk);
  wordlistManager.init();

  // Mining
  sdk.api.register("startMining", startMining);
  sdk.api.register("getRequest", getRequest);
  sdk.api.register("cancelMining", cancelMining);
  sdk.api.register("pauseMining", pauseMining);
  sdk.api.register("resumeMining", resumeMining);

  // Wordlists
  sdk.api.register("addWordlistPath", addWordlistPath);
  sdk.api.register("removeWordlistPath", removeWordlistPath);
  sdk.api.register("getWordlists", getWordlists);
  sdk.api.register("clearWordlists", clearWordlists);
  sdk.api.register("importWordlist", importWordlist);
  sdk.api.register("toggleWordlist", toggleWordlist);

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
