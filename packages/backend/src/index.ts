import { SDK, DefineAPI } from "caido:plugin";
import { ParamMiner } from "./miner/param-miner";
import { ParamMinerOptions, Request, Settings, Wordlist } from "shared";
import { BackendEvents } from "./types/types";
import WordlistManager from "./wordlists/wordlists";
import { writeToFile } from "./helper/helper";
import { startUploadSession, uploadChunk, finalizeUpload, cancelUpload } from "./wordlists/uploader";
import { SettingsStore } from "./settings/settings";
import { Result, ok, error } from "shared";

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
): Promise<Result<void>> {
  let instanceID: string | null = null;

  try {
    const wordlists = await wordlistManager?.getWordlists();
    if (!wordlists) {
      return error("Wordlist not found");
    }

    if (wordlists.length === 0) {
      return error("No wordlists found. Please upload a wordlist first.");
    }

    const miner = new ParamMiner(sdk, options);

    await Promise.all(wordlists.map(async (wordlist) => {
      if (wordlist.enabled) {
        await miner.addWordlist(sdk, wordlist.path);
        sdk.console.log(`[WORDLIST] Added ${wordlist.path}`);
      }
    }));

    const instance = miner.setTarget(target);
    instanceID = instance.getID();

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
    instance.startMining();
    return ok(void 0);
  } catch (err) {
    if (instanceID) {
      sdk.api.send("paramfinder:error", instanceID, err);
    }
    sdk.console.error(err);
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function cancelMining(sdk: SDK<API>, id: string): Promise<Result<void>> {
  try {
    const miner = runningSessions.get(id);
    if (miner) {
      miner.cancel();
    }
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function pauseMining(sdk: SDK<API>, id: string): Promise<Result<void>> {
  try {
    const miner = runningSessions.get(id);
    if (miner) {
      miner.pause();
    }
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function resumeMining(sdk: SDK<API>, id: string): Promise<Result<void>> {
  try {
    const miner = runningSessions.get(id);
    if (miner) {
      miner.resume();
    }
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function getRequest(sdk: SDK<API>, id: string): Promise<Result<Request>> {
  try {
    const requestResponse = await sdk.requests.get(id);
    if (!requestResponse) {
      return error("Request not found");
    }

    const spec = requestResponse.request.toSpec();

    return ok({
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
    } as Request);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function addWordlistPath(sdk: SDK<API>, path: string): Promise<Result<void>> {
  try {
    if (!wordlistManager) {
      return error("Wordlist manager not initialized");
    }
    await wordlistManager.addWordlistPath(path);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function removeWordlistPath(sdk: SDK<API>, path: string): Promise<Result<void>> {
  try {
    if (!wordlistManager) {
      return error("Wordlist manager not initialized");
    }
    await wordlistManager.removeWordlistPath(path);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function getWordlists(sdk: SDK<API>): Promise<Result<Wordlist[]>> {
  try {
    if (!wordlistManager) {
      return error("Wordlist manager not initialized");
    }
    const wordlists = await wordlistManager.getWordlists();
    return ok(wordlists);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function clearWordlists(sdk: SDK<API>): Promise<Result<void>> {
  try {
    if (!wordlistManager) {
      return error("Wordlist manager not initialized");
    }
    await wordlistManager.clearWordlists();
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function toggleWordlist(sdk: SDK<API>, path: string, enabled: boolean): Promise<Result<void>> {
  try {
    if (!wordlistManager) {
      return error("Wordlist manager not initialized");
    }
    await wordlistManager.toggleWordlist(path, enabled);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function importWordlist(sdk: SDK<API>, data: string, filename: string): Promise<Result<void>> {
  try {
    const filePath = await writeToFile(sdk, data, filename);
    sdk.console.log(`[WORDLIST] Imported wordlist from ${filePath}`);
    await wordlistManager?.addWordlistPath(filePath);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function startWordlistUpload(sdk: SDK<API>, filename: string, totalChunks: number): Promise<Result<string>> {
  try {
    const sessionId = startUploadSession(filename, totalChunks);
    return ok(sessionId);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function uploadWordlistChunk(sdk: SDK<API>, sessionId: string, chunk: string, chunkIndex: number): Promise<Result<void>> {
  try {
    uploadChunk(sessionId, chunk, chunkIndex);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function finalizeWordlistUpload(sdk: SDK<API>, sessionId: string): Promise<Result<void>> {
  try {
    const filePath = await finalizeUpload(sessionId, sdk);
    await wordlistManager?.addWordlistPath(filePath);
    sdk.console.log(`[WORDLIST] Imported wordlist from ${filePath}`);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function cancelWordlistUpload(sdk: SDK<API>, sessionId: string): Promise<Result<void>> {
  try {
    cancelUpload(sessionId);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

// Settings
async function getSettings(sdk: SDK<API>): Promise<Result<Settings>> {
  try {
    if (!settingsStore) {
      return error("Settings store not initialized");
    }
    const settings = await settingsStore.getSettings();
    return ok(settings);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

async function updateSettings(sdk: SDK<API>, settings: Settings): Promise<Result<void>> {
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

async function getSettingsPath(sdk: SDK<API>): Promise<Result<string>> {
  try {
    if (!settingsStore) {
      return error("Settings store not initialized");
    }
    const path = await settingsStore.getSettingsPath();
    return ok(path);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
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
