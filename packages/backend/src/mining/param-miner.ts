import { readFile } from "fs/promises";
import { ParamMinerConfig, ParamMinerEvents } from "shared";
import { Request, RequestResponse } from "shared";
import { Finding, MiningSessionState } from "shared";
import { AnomalyDetector } from "./anomaly";
import { guessMaxSize, sizeConfigs } from "./features/guess-max-size";
import { Requester } from "./requester";
import { EventEmitter } from "events";
import { ParamDiscovery } from "./discovery";
import { CaidoBackendSDK } from "../types/types";
import { generateID } from "../util/helper";
import { checkForWAF } from "./features/waf-check";
import { StateManager } from "./state-manager";

export class ParamMiner {
  public sdk: CaidoBackendSDK;
  public target: Request;
  public config: ParamMinerConfig;
  public requester: Requester;
  public id: string;
  public anomalyDetector: AnomalyDetector;
  public paramDiscovery: ParamDiscovery;
  public eventEmitter: EventEmitter;
  public wordlist: Set<string>;
  public initialRequestsSent: number | null;
  public stateManager: StateManager;

  constructor(sdk: CaidoBackendSDK, target: Request, config: ParamMinerConfig) {
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
  }

  public async addWordlist(path: string) {
    const wordlist = await readFile(path, "utf-8");
    const lines = wordlist.split("\n");
    for (const line of lines) {
      this.wordlist.add(line);
    }
  }

  public async start(): Promise<void> {
    this.stateManager.updateState(MiningSessionState.Learning, "learning");
    this.validateConfig();

    this.eventEmitter.emit("logs", "Sending learn requests...");
    try {
      await this.anomalyDetector.learnFactors();
      if (!await this.stateManager.continueOrWait()) return;
    } catch (error) {
      if (this.stateManager.getState() !== MiningSessionState.Canceled) {
        this.eventEmitter.emit("error", (error as Error).message);
        this.stateManager.updateState(MiningSessionState.Error);
      }
      return;
    }
    this.eventEmitter.emit("logs", "Learn requests sent.");

    if (this.config.autoDetectMaxSize) {
      this.eventEmitter.emit(
        "logs",
        `Auto-detecting max ${this.config.attackType} size...`
      );
      this.config.maxSize = await guessMaxSize(this);
      if (!await this.stateManager.continueOrWait()) return;
    } else {
      if (this.config.attackType === "query") {
        this.config.maxSize = this.config.maxQuerySize;
      } else if (this.config.attackType === "headers") {
        this.config.maxSize = this.config.maxHeaderSize;
      } else if (this.config.attackType === "body") {
        this.config.maxSize = this.config.maxBodySize;
      }
    }

    if (this.config.maxSize) {
      this.eventEmitter.emit(
        "logs",
        `Max ${this.config.attackType} size: ${this.config.maxSize}`
      );
    }

    if (this.config.wafDetection) {
      this.eventEmitter.emit("logs", "Checking for WAF...");
      const wafResponse = await checkForWAF(this);
      if (!await this.stateManager.continueOrWait()) return;

      if (wafResponse) {
        this.eventEmitter.emit("logs", "WAF detected");
        this.anomalyDetector.setWafResponse(wafResponse);
      } else {
        this.eventEmitter.emit("logs", "No WAF detected");
      }
    }

    const words = this.extractWordsFromResponse(
      this.anomalyDetector.initialRequestResponse?.response.body || ""
    );
    this.eventEmitter.emit(
      "logs",
      `Extracted ${words} words from initial response.`
    );

    if (await this.stateManager.continueOrWait()) {
      this.stateManager.updateState(MiningSessionState.Running, "discovery");
      this.sdk.api.send(
        "paramfinder:adjust",
        this.id,
        this.paramDiscovery.calculateTotalRequests()
      );

      await this.paramDiscovery.startDiscovery();
    }
  }

  private extractWordsFromResponse(response: string): number {
    const words = response.split(/\s+/);
    const uniqueWords = new Set(words);
    for (const word of uniqueWords) {
      this.wordlist.add(word);
    }
    return uniqueWords.size;
  }

  private validateConfig() {
    if (this.config.learnRequestsCount < 3) {
      throw new Error("Learn requests count must be at least 3");
    }

    if (this.config.maxSize && this.config.maxSize < 0) {
      throw new Error("Max Request size must be greater than 0");
    }

    if (this.config.maxSize && this.config.autoDetectMaxSize) {
      throw new Error("Cannot set both maxSize and autoDetectMaxSize");
    }
  }

  public getState(): MiningSessionState {
    return this.stateManager.getState();
  }

  public updateState(state: MiningSessionState, phase?: "learning" | "discovery" | "idle") {
    this.stateManager.updateState(state, phase);
  }

  public initialRequestAmount(): number {
    if (this.initialRequestsSent) {
      return this.initialRequestsSent;
    }

    let learnRequestsCount = this.config.learnRequestsCount;
    if (this.config.wafDetection) {
      learnRequestsCount += 3;
    }

    if (this.config.autoDetectMaxSize) {
      learnRequestsCount += sizeConfigs[this.config.attackType].sizes.length;
    }

    this.initialRequestsSent = learnRequestsCount;
    return this.initialRequestsSent;
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
    callback: (stateChange: ParamMinerEvents["onStateChange"]) => void
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
}
