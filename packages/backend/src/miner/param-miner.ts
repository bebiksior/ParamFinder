import {
  ParamMinerOptions,
  MiningProgress,
  MiningError,
  ParamMinerEvents,
  ParamLocation,
  ResponseComparison,
  Finding,
  Request,
  MiningSessionState,
  Parameter,
} from "shared";

import { EventEmitter } from "events";
import { generateID, randomString, readWordlist } from "../util/helper";
import { SDK } from "caido:plugin";
import { analyzeResponse, defineFactors } from "./anomaly";
import { BackendEvents } from "../types/types";
import { API } from "..";
import { SettingsStore } from "../settings/settings";
import { sendRequest } from "../requests/requests";

export class ParamMiner {
  private options: ParamMinerOptions;
  private originalTarget: Request | null = null;
  private target: Request | null = null;
  private wordlist: string[] = [];
  private chunks: string[][] = [];
  private eventEmitter: EventEmitter;
  private sdk: SDK<API, BackendEvents>;
  private miningSessionID = generateID();
  private state: MiningSessionState = MiningSessionState.Running;

  private factors?: ResponseComparison;

  constructor(sdk: SDK<API, BackendEvents>, options: ParamMinerOptions) {
    this.sdk = sdk;
    this.options = options;
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Set the target for the mining operation
   */
  setTarget(target: Request): this {
    this.target = target;
    this.originalTarget = JSON.parse(JSON.stringify(target));
    return this;
  }

  /**
   * Get the total number of requests
   */
  getTotalRequests(): number {
    return this.chunks.length;
  }

  /**
   * Figure out the chunk size
   */
  private figureOutChunkSize(): number {
    if (this.wordlist.length < 200) {
      return 1;
    }

    if (this.options.paramsLocation === "headers") {
      return 30;
    }

    return 200;
  }

  /**
   * Add a wordlist for parameter bruteforcing
   */
  async addWordlist(sdk: SDK, path: string): Promise<number> {
    const wordlist = await readWordlist(path);

    const chunkSize = 10000;
    for (let i = 0; i < wordlist.length; i += chunkSize) {
      const chunk = wordlist.slice(i, i + chunkSize);
      this.wordlist.push(...chunk);
    }

    const miningChunkSize = this.figureOutChunkSize();
    this.chunks = Array.from(
      { length: Math.ceil(this.wordlist.length / miningChunkSize) },
      (_, index) =>
        this.wordlist.slice(
          index * miningChunkSize,
          (index + 1) * miningChunkSize
        )
    );

    return wordlist.length;
  }

  /**
   * Clear wordlist
   */
  clearWordlists(): this {
    this.wordlist = [];
    return this;
  }

  /**
   * Get mining session ID
   */
  getID(): string {
    return this.miningSessionID;
  }

  pause(): void {
    if (this.state === MiningSessionState.Running) {
      this.updateState(MiningSessionState.Paused);
      this.sdk.console.log("Mining paused.");
    }
  }

  resume(): void {
    if (this.state === MiningSessionState.Paused) {
      this.updateState(MiningSessionState.Running);
      this.sdk.console.log("Mining resumed.");
    }
  }

  cancel(): void {
    if (this.state !== MiningSessionState.Canceled) {
      this.updateState(MiningSessionState.Canceled);
      this.sdk.console.log("Mining canceled.");
    }
  }

  private async waitWhilePaused(): Promise<void> {
    while (this.state === MiningSessionState.Paused) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  private updateState(state: MiningSessionState): void {
    this.state = state;
    this.eventEmitter.emit("state_change", this.state);
  }

  startMining(): EventEmitter {
    if (!this.target) {
      const error: MiningError = { message: "No target set for mining." };
      this.updateState(MiningSessionState.Error);
      this.eventEmitter.emit("error", error);
      return this.eventEmitter;
    }

    this.updateState(MiningSessionState.Running);

    const totalRequests = this.wordlist.length;
    const progress: MiningProgress = { completed: 0, total: totalRequests };
    this.eventEmitter.emit("progress", progress);

    const settings = SettingsStore.get().getSettings();
    const delay = settings.delay;

    setTimeout(() => {
      if (this.state === MiningSessionState.Running) {
        this.updateState(MiningSessionState.Timeout);
      }
    }, settings.timeout);

    const findings: Finding[] = [];

    const processQueue = async () => {
      try {
        await this.initialize();
        await this.processChunks(findings, progress, delay);
      } catch (err) {
        this.updateState(MiningSessionState.Error);
        this.eventEmitter.emit("error", {
          message: `Mining error: ${err}`,
        });
        return;
      }

      if (this.state === MiningSessionState.Running) {
        this.updateState(MiningSessionState.Completed);
        this.eventEmitter.emit("complete", {
          state: this.state,
          parameters: findings,
          elapsedTime: Date.now(),
        });
      }
    };

    processQueue();
    return this.eventEmitter;
  }

  private setParameters(params: Parameter[]): void {
    if (!this.target || !this.originalTarget) {
      throw new Error("Target not set");
    }

    if (this.options.paramsLocation === "query") {
      this.target.query = params
        .map(
          (param) =>
            `${encodeURIComponent(param.name)}=${encodeURIComponent(
              param.value
            )}`
        )
        .join("&");
    }

    if (this.options.paramsLocation === "headers") {
      this.target.headers = params.reduce(
        (acc, param) => ({
          ...(this.originalTarget?.headers || {}),
          ...acc,
          [param.name]: [param.value],
        }),
        {} as Record<string, string[]>
      );
    }

    if (this.options.paramsLocation === "body") {
      this.target.body = this.addBodyParameters(
        this.originalTarget.body || "",
        params
      );
    }
  }

  private addBodyParameters(bodyStr: string, params: Parameter[]): string {
    const isJson = (str: string): boolean =>
      /^\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*$/.test(str);
    const isUrlEncoded = (str: string): boolean =>
      /^[^=&]+=[^=&]+(&[^=&]+=[^=&]+)*$/.test(str);

    if (!bodyStr) {
      // Default to JSON if body is empty
      const jsonBody: Record<string, any> = {};
      params.forEach(({ name, value }) => {
        jsonBody[name] = value;
      });
      return JSON.stringify(jsonBody);
    }

    if (isJson(bodyStr)) {
      try {
        const jsonBody: Record<string, any> = JSON.parse(bodyStr);
        params.forEach(({ name, value }) => {
          jsonBody[name] = value;
        });
        return JSON.stringify(jsonBody);
      } catch {
        // If parsing fails, default to JSON structure
        const jsonBody: Record<string, any> = {};
        params.forEach(({ name, value }) => {
          jsonBody[name] = value;
        });
        return JSON.stringify(jsonBody);
      }
    } else if (isUrlEncoded(bodyStr)) {
      const urlEncodedParams = params
        .map(
          ({ name, value }) =>
            `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
        )
        .join("&");
      return bodyStr.length > 0
        ? `${bodyStr}&${urlEncodedParams}`
        : urlEncodedParams;
    } else {
      // Default to JSON if type is unrecognized
      const jsonBody: Record<string, any> = {};
      params.forEach(({ name, value }) => {
        jsonBody[name] = value;
      });
      return JSON.stringify(jsonBody);
    }
  }

  private async initialize(): Promise<void> {
    if (!this.target) {
      throw new Error("Target not set");
    }

    // Generate a random parameter to test stability
    const fuzzKey = "z" + randomString(6);
    const fuzzValue = randomString(7);

    this.setParameters([{ name: fuzzKey, value: fuzzValue }]);

    // Send two identical requests
    const requestResponse1 = await sendRequest(this.sdk, this.target);
    const requestResponse2 = await sendRequest(this.sdk, this.target);

    // Define initial factors
    this.factors = defineFactors(
      requestResponse1.response,
      requestResponse2.response,
      { key: fuzzKey, value: fuzzValue },
      this.wordlist,
      false
    );

    // Send a third request with a different random param to refine factors
    const fuzzKey2 = "z" + randomString(6);
    const fuzzValue2 = randomString(7);
    this.setParameters([{ name: fuzzKey2, value: fuzzValue2 }]);

    const requestResponse3 = await sendRequest(this.sdk, this.target);

    // Check for unstable factors
    const anomalyCheck = analyzeResponse(
      requestResponse3.response,
      this.factors,
      [{ name: fuzzKey2, value: fuzzValue2 }],
      false
    );

    if (anomalyCheck?.rule) {
      (this.factors as any)[anomalyCheck.rule] = null;
      this.sdk.console.log(
        `Factor "${anomalyCheck.rule}" proved unstable. Removing it from baseline.`
      );
    }
  }

  private async processChunks(
    findings: Finding[],
    progress: MiningProgress,
    delay: number
  ): Promise<void> {
    for (let i = 0; i < this.chunks.length; i++) {
      if (
        this.state === MiningSessionState.Canceled ||
        this.state === MiningSessionState.Timeout
      ) {
        this.sdk.console.log(
          "Mining canceled or timed out before completing all requests."
        );
        return;
      }

      await this.waitWhilePaused();

      const chunk = this.chunks[i];
      if (!chunk) {
        throw new Error(`Wordlist is empty at index ${i}`);
      }

      this.sdk.console.log(`Testing chunk: ${chunk.length} parameters`);
      await this.processParameters(
        chunk,
        this.options.paramsLocation,
        findings
      );

      progress.completed++;
      this.eventEmitter.emit("progress", progress);

      if (delay > 0) {
        await this.sleep(delay);
      }
    }
  }

  private async processParameters(
    words: string[],
    location: ParamLocation,
    findings: Finding[]
  ): Promise<void> {
    const finding = await this.bruteforceParameters(words, location);
    if (finding) {
      findings.push(finding);
      this.eventEmitter.emit("found", finding);
    }
  }

  private async bruteforceParameters(
    words: string[],
    location: ParamLocation
  ): Promise<Finding | null> {
    if (!this.target || !this.factors) {
      throw new Error("Target or factors not set");
    }

    const settings = SettingsStore.get().getSettings();
    const delay = settings.delay;

    const params: Parameter[] = words.map((word) => ({
      name: word,
      value: randomString(8),
    }));

    this.setParameters(params);

    // Send request with the inserted parameter
    const requestResponse = await sendRequest(this.sdk, this.target);
    this.eventEmitter.emit("response_received", {
      parametersCount: params.length,
      requestResponse,
      context: "discovery",
    });

    // Analyze the response against the stable factors
    const anomaly = analyzeResponse(
      requestResponse.response,
      this.factors,
      params,
      false
    );

    if (!anomaly) {
      return null;
    }

    this.sdk.api.send(
      "paramfinder:log",
      this.miningSessionID,
      `Anomaly detected: ${anomaly.anomaly} (${anomaly.rule}). Testing parameters...`
    );

    // Use binary search to find the parameter causing the anomaly
    let start = 0;
    let end = params.length - 1;

    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const testParams = params.slice(start, mid + 1);

      // Reset target to original state and set test parameters
      this.target = JSON.parse(JSON.stringify(this.originalTarget));
      if (!this.target) {
        throw new Error("Target not set");
      }

      this.setParameters(testParams);

      const testResponse = await sendRequest(this.sdk, this.target);
      this.eventEmitter.emit("response_received", {
        parametersCount: testParams.length,
        requestResponse: testResponse,
        context: "narrower",
      });

      const testAnomaly = analyzeResponse(
        testResponse.response,
        this.factors,
        testParams,
        false
      );

      if (testAnomaly) {
        if (testParams.length === 1) {
          const foundParam = testParams[0];
          if (!foundParam) {
            throw new Error("Expected single parameter but got none");
          }

          this.sdk.api.send(
            "paramfinder:log",
            this.miningSessionID,
            `Individual parameter anomaly found: ${foundParam.name}=${foundParam.value}`
          );

          return {
            requestResponse: testResponse,
            parameter: {
              name: foundParam.name,
              value: foundParam.value,
              location,
              responseImpact: testAnomaly.anomaly,
              evidence: testAnomaly.rule,
            },
          };
        }
        end = mid;
      } else {
        start = mid + 1;
      }

      if (delay > 0) {
        await this.sleep(delay);
      }
    }

    return null;
  }

  // Utility to pause for a given time
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Event Listener - onProgress
   */
  onProgress(callback: ParamMinerEvents["onProgress"]): this {
    this.eventEmitter.on("progress", callback);
    return this;
  }

  /**
   * Event Listener - onFound
   */
  onFound(callback: ParamMinerEvents["onFound"]): this {
    this.eventEmitter.on("found", callback);
    return this;
  }

  /**
   * Event Listener - onResponseReceived
   */
  onResponseReceived(callback: ParamMinerEvents["onResponseReceived"]): this {
    this.eventEmitter.on("response_received", callback);
    return this;
  }

  /**
   * Event Listener - onComplete
   */
  onComplete(callback: ParamMinerEvents["onComplete"]): this {
    this.eventEmitter.on("complete", callback);
    return this;
  }

  /**
   * Event Listener - onError
   */
  onError(callback: ParamMinerEvents["onError"]): this {
    this.eventEmitter.on("error", callback);
    return this;
  }

  /**
   * Event Listener - onStateChange
   */
  onStateChange(callback: ParamMinerEvents["onStateChange"]): this {
    this.eventEmitter.on("state_change", callback);
    return this;
  }
}
