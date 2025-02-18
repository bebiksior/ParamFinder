import { readFile } from "fs/promises";
import {
  AdditionalChecksResult,
  MiningSessionPhase,
  ParamMinerConfig,
  ParamMinerEvents,
} from "shared";
import { Request, RequestResponse } from "shared";
import { Finding, MiningSessionState } from "shared";
import { AnomalyDetector } from "./anomaly";
import { guessMaxSize } from "./features/guess-max-size";
import { Requester } from "./requester";
import { EventEmitter } from "events";
import { ParamDiscovery } from "./discovery";
import { BackendSDK } from "../types/types";
import { generateID } from "../util/helper";
import { checkForWAF } from "./features/waf-check";
import { StateManager } from "./state-manager";
import { performAdditionalChecks } from "./features/additional-checks";

export class ParamMiner {
  public sdk: BackendSDK;
  public target: Request;
  public config: ParamMinerConfig;
  public requester: Requester;
  public id: string;
  public anomalyDetector: AnomalyDetector;
  public additionalChecksResult: AdditionalChecksResult;
  public paramDiscovery: ParamDiscovery;
  public eventEmitter: EventEmitter;
  public wordlist: Set<string>;
  public initialRequestsSent: number | null;
  public stateManager: StateManager;
  public maxSize: number;
  public metadata: Map<string, boolean>;

  constructor(sdk: BackendSDK, target: Request, config: ParamMinerConfig) {
    this.sdk = sdk;
    this.id = generateID();
    this.target = target;
    this.config = config;
    this.eventEmitter = new EventEmitter();
    this.stateManager = new StateManager(this.eventEmitter);
    this.requester = new Requester(this);
    this.anomalyDetector = new AnomalyDetector(this);
    this.paramDiscovery = new ParamDiscovery(this);
    this.wordlist = new Set<string>();
    this.initialRequestsSent = null;
    this.metadata = new Map<string, boolean>();
  }

  public async addWordlist(path: string) {
    const wordlist = await readFile(path, "utf-8");
    const lines = wordlist.split(/\r?\n/);
    for (const line of lines) {
      if (line.trim() === "") continue;
      this.wordlist.add(line);
    }
  }

  public async start(): Promise<void> {
    this.stateManager.updateState(
      MiningSessionState.Learning,
      MiningSessionPhase.Learning
    );
    this.validateConfig();

    this.log("Sending learn requests...");
    try {
      await this.anomalyDetector.learnFactors();
      if (!(await this.stateManager.continueOrWait())) return;
    } catch (error) {
      if (this.stateManager.getState() !== MiningSessionState.Canceled) {
        this.eventEmitter.emit("error", (error as Error).message);
        this.stateManager.updateState(MiningSessionState.Error);
      }
      return;
    }
    this.log("Learn requests sent.");

    if (this.config.autoDetectMaxSize) {
      this.eventEmitter.emit(
        "logs",
        `Auto-detecting max ${this.config.attackType} size...`
      );
      this.maxSize = await guessMaxSize(this);
      if (!(await this.stateManager.continueOrWait())) return;
    } else {
      if (this.config.attackType === "query") {
        this.maxSize = this.config.maxQuerySize;
      } else if (this.config.attackType === "headers") {
        this.maxSize = this.config.maxHeaderSize;
      } else if (this.config.attackType === "body") {
        this.maxSize = this.config.maxBodySize;
      }
    }

    if (this.maxSize) {
      this.eventEmitter.emit(
        "logs",
        `Max ${this.config.attackType} size: ${this.maxSize}`
      );
    }

    if (this.config.wafDetection) {
      this.log("Checking for WAF...");
      const wafResponse = await checkForWAF(this);
      if (!(await this.stateManager.continueOrWait())) return;

      if (wafResponse) {
        this.log("WAF detected");
        this.anomalyDetector.setWafResponse(wafResponse);
      } else {
        this.log("No WAF detected");
      }
    }

    if (this.config.additionalChecks) {
      this.log("Performing additional learning checks...");
      this.additionalChecksResult = await performAdditionalChecks(this);
      this.log("Additional learning checks completed");

      if (!(await this.stateManager.continueOrWait())) return;

      if (!this.additionalChecksResult.handlesSpecialCharacters) {
        if (!this.additionalChecksResult.handlesEncodedSpecialCharacters) {
          // Remove words with special characters from wordlist
          this.wordlist = new Set(
            Array.from(this.wordlist).filter(
              (word) => !/[^a-zA-Z0-9-_]/.test(word)
            )
          );
        } else {
          // URL encode special characters in each word
          this.wordlist = new Set(
            Array.from(this.wordlist).map((word) =>
              word.replace(/[^a-zA-Z0-9-_]/g, (char) =>
                encodeURIComponent(char)
              )
            )
          );
        }
      }
    }

    const wordsAmount = this.extractWordsFromResponse(
      this.anomalyDetector.initialRequestResponse?.response.body || ""
    );
    this.eventEmitter.emit(
      "logs",
      `Extracted ${wordsAmount} words from initial response.`
    );

    // Adjust frontend to new wordlist size
    this.adjustTotalParameters(this.wordlist.size);

    if (await this.stateManager.continueOrWait()) {
      this.stateManager.updateState(
        MiningSessionState.Running,
        MiningSessionPhase.Discovery
      );
      await this.paramDiscovery.startDiscovery();
    }
  }

  private extractWordsFromResponse(response: string): number {
    const cleanText = response
      .replace(/[^a-zA-Z0-9\s-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const words = cleanText.split(" ").filter((word) => word.length > 2);

    const uniqueWords = new Set(words);
    for (const word of uniqueWords) {
      if (word) {
        this.wordlist.add(word);
      }
    }

    return uniqueWords.size;
  }

  private validateConfig() {
    if (this.config.learnRequestsCount < 3) {
      throw new Error("Learn requests count must be at least 3");
    }

    if (this.config.maxBodySize && this.config.maxBodySize < 0) {
      throw new Error("Max Body Size size must be greater than 0");
    }

    if (this.config.maxQuerySize && this.config.maxQuerySize < 0) {
      throw new Error("Max Query Size size must be greater than 0");
    }

    if (this.config.maxHeaderSize && this.config.maxHeaderSize < 0) {
      throw new Error("Max Headers Size size must be greater than 0");
    }

    if (
      (this.config.maxBodySize ||
        this.config.maxQuerySize ||
        this.config.maxHeaderSize) &&
      this.config.autoDetectMaxSize
    ) {
      throw new Error("Cannot set both maxSize and autoDetectMaxSize");
    }
  }

  public getState(): MiningSessionState {
    return this.stateManager.getState();
  }

  public updateState(state: MiningSessionState, phase?: MiningSessionPhase) {
    this.stateManager.updateState(state, phase);

    if (
      state === MiningSessionState.Canceled ||
      state === MiningSessionState.Timeout
    ) {
      this.eventEmitter.emit("complete");
    }
  }

  public totalParametersAmount() {
    return this.wordlist.size;
  }

  onLogs(callback: (logs: ParamMinerEvents["onLogs"]) => void) {
    this.eventEmitter.on("logs", callback);
  }

  onFinding(callback: (finding: Finding) => void) {
    this.eventEmitter.on("finding", callback);
  }

  onComplete(callback: (complete: ParamMinerEvents["onComplete"]) => void) {
    this.eventEmitter.on("complete", callback);
  }

  onStateChange(
    callback: (state: MiningSessionState, phase?: MiningSessionPhase) => void
  ) {
    this.eventEmitter.on("stateChange", callback);
  }

  onError(callback: (error: ParamMinerEvents["onError"]) => void) {
    this.eventEmitter.on("error", callback);
  }

  onProgress(
    callback: (parametersSent: number, requestResponse: RequestResponse) => void
  ) {
    this.eventEmitter.on("responseReceived", callback);
  }

  onDebug(callback: (debug: ParamMinerEvents["onDebug"]) => void) {
    this.eventEmitter.on("debug", callback);
  }

  public getID() {
    return this.id;
  }

  public log(message: string) {
    this.eventEmitter.emit("logs", message);
  }

  public adjustTotalParameters(newAmount: number) {
    this.sdk.api.send("paramfinder:adjust", this.id, newAmount);
  }
}
