import { readFile } from "fs/promises";
import { ParamMinerConfig, ParamMinerEvents } from "shared";
import { Request, RequestResponse } from "shared";
import { Finding, MiningSessionState } from "shared";
import { AnomalyDetector } from "./anomaly";
import { guessMaxSize } from "./features/guess-max-size";
import { Requester } from "./requester";
import { EventEmitter } from "events";
import { ParamDiscovery } from "./discovery";
import { CaidoBackendSDK } from "../types/types";
import { generateID } from "../util/helper";

export class ParamMiner {
  public sdk: CaidoBackendSDK;
  public target: Request;
  public state: MiningSessionState;
  public config: ParamMinerConfig;
  public requester: Requester;
  public id: string;
  public anomalyDetector: AnomalyDetector;
  public paramDiscovery: ParamDiscovery;
  public eventEmitter: EventEmitter;
  public wordlist: Set<string>;
  public lastStateChange: MiningSessionState;

  constructor(sdk: CaidoBackendSDK, target: Request, config: ParamMinerConfig) {
    this.sdk = sdk;
    this.id = generateID();
    this.target = target;
    this.state = MiningSessionState.Pending;
    this.lastStateChange = MiningSessionState.Pending;
    this.config = config;
    this.requester = new Requester(this);
    this.anomalyDetector = new AnomalyDetector(this);
    this.paramDiscovery = new ParamDiscovery(this);
    this.eventEmitter = new EventEmitter();
    this.wordlist = new Set<string>();
  }

  public async addWordlist(path: string) {
    const wordlist = await readFile(path, "utf-8");
    const lines = wordlist.split("\n");
    for (const line of lines) {
      this.wordlist.add(line);
    }
  }

  public async start(): Promise<void> {
    this.updateState(MiningSessionState.Learning);
    this.validateConfig();

    this.eventEmitter.emit("logs", "Sending learn requests...");
    try {
      await this.anomalyDetector.learnFactors();
    } catch (error) {
      this.eventEmitter.emit("error", (error as Error).message);
      this.updateState(MiningSessionState.Error);
      return;
    }
    this.eventEmitter.emit("logs", "Learn requests sent.");

    if (this.state === MiningSessionState.Canceled) {
      return;
    }

    this.updateState(MiningSessionState.Running);

    if (this.config.autoDetectMaxSize) {
      this.eventEmitter.emit(
        "logs",
        `Auto-detecting max ${this.config.attackType} size...`
      );
      this.config.maxSize = await guessMaxSize(this);
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

    const words = this.extractWordsFromResponse(
      this.anomalyDetector.initialRequestResponse?.response.body || ""
    );
    this.eventEmitter.emit(
      "logs",
      `Extracted ${words} words from initial response.`
    );

    this.sdk.api.send(
      "paramfinder:adjust",
      this.id,
      this.paramDiscovery.calculateTotalRequests()
    );

    this.paramDiscovery.startDiscovery();
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
      throw new Error("Max URL size must be greater than 0");
    }

    if (this.config.maxSize && this.config.autoDetectMaxSize) {
      throw new Error("Cannot set both maxSize and autoDetectMaxSize");
    }
  }

  public updateState(state: MiningSessionState) {
    this.lastStateChange = this.state;
    this.state = state;
    this.eventEmitter.emit("stateChange", state);
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

  public getID() {
    return this.id;
  }
}
