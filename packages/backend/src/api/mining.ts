import { BackendSDK } from "../types/types";
import { error, ok, ParamMinerConfig, Request, Result } from "shared";
import { ParamMiner } from "../mining/param-miner";
import { getWordlistManager } from "../wordlists/wordlists";
import { getSettingsStore } from "../settings/settings";

const runningSessions: Map<string, ParamMiner> = new Map();

export async function startMining(
  sdk: BackendSDK,
  target: Request,
  config: ParamMinerConfig,
): Promise<Result<void>> {
  const wordlistManager = getWordlistManager();
  const settingsStore = getSettingsStore();

  try {
    const wordlists = await wordlistManager?.getWordlists();
    if (!wordlists) {
      return error("Wordlist not found");
    }

    const settings = settingsStore?.getSettings();
    if (!settings) {
      return error("Settings not found");
    }

    if (wordlists.filter((wordlist) => wordlist.enabled && wordlist.attackTypes.includes(config.attackType)).length === 0) {
      return error(
        "No enabled wordlists found. Please upload a wordlist first.",
      );
    }

    const paramMiner = new ParamMiner(sdk, target, config);
    await Promise.all(
      wordlists.map(async (wordlist) => {
        if (wordlist.enabled && wordlist.attackTypes.includes(config.attackType)) {
          await paramMiner.addWordlist(wordlist.path);
          sdk.console.log(`[WORDLIST] Added ${wordlist.path}`);
        }
      }),
    );

    const sessionID = paramMiner.getID();
    sdk.api.send(
      "paramfinder:new",
      sessionID,
      paramMiner.totalParametersAmount(),
      paramMiner.config.learnRequestsCount,
    );

    paramMiner.onError((err) => {
      sdk.api.send("paramfinder:error", sessionID, err);
      runningSessions.delete(sessionID);
    });

    paramMiner.onFinding((finding) => {
      sdk.api.send("paramfinder:new_finding", sessionID, finding);
    });

    paramMiner.onComplete(() => {
      sdk.api.send("paramfinder:complete", sessionID);
      runningSessions.delete(sessionID);
    });

    paramMiner.onStateChange((state, phase) => {
      sdk.api.send("paramfinder:state", sessionID, state, phase);
    });

    paramMiner.onProgress((parametersSent, requestResponse) => {
      const isPerformanceMode = paramMiner.config.performanceMode;

      sdk.api.send(
        "paramfinder:progress",
        sessionID,
        parametersSent,
        requestResponse?.request.context,
        isPerformanceMode ? undefined : requestResponse,
      );
    });

    paramMiner.onLogs((logs) => {
      sdk.api.send("paramfinder:log", sessionID, logs);
    });

    paramMiner.onDebug((debug) => {
      if (settings.debug) {
        sdk.api.send("paramfinder:log", sessionID, `[DEBUG] ${debug}`);
      }
    });

    runningSessions.set(paramMiner.getID(), paramMiner);
    paramMiner.start().catch((err) => {
      sdk.api.send("paramfinder:error", sessionID, err);
    });

    return ok(void 0);
  } catch (err) {
    sdk.console.error(err);
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function cancelMining(
  sdk: BackendSDK,
  id: string,
): Promise<Result<void>> {
  try {
    const miner = runningSessions.get(id);
    if (miner) {
      miner.paramDiscovery.cancel();
    }
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function pauseMining(
  sdk: BackendSDK,
  id: string,
): Promise<Result<void>> {
  try {
    const miner = runningSessions.get(id);
    if (miner) {
      miner.paramDiscovery.pause();
    }
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function resumeMining(
  sdk: BackendSDK,
  id: string,
): Promise<Result<void>> {
  try {
    const miner = runningSessions.get(id);
    if (miner) {
      miner.paramDiscovery.resume();
    }
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function deleteSession(
  sdk: BackendSDK,
  id: string,
): Promise<Result<void>> {
  try {
    const miner = runningSessions.get(id);
    if (miner) {
      miner.paramDiscovery.cancel();
    }
    runningSessions.delete(id);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}
