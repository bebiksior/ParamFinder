import { Parameter, RequestResponse } from "shared";
import { Finding, MiningSessionState } from "shared";
import { randomString } from "../util/helper";
import { ParamMiner } from "./param-miner";

interface ChunkResult {
  requestResponse: RequestResponse;
  parameters: Parameter[];
  anomalyType?: string;
}

export class ParamDiscovery {
  private readonly paramMiner: ParamMiner;
  private lastWordlistIndex: number;
  private static readonly PARAMS_VALUES_SIZE = 8;
  private static readonly DEFAULT_HEADER_CHUNK_SIZE = 20;

  constructor(paramMiner: ParamMiner) {
    this.paramMiner = paramMiner;
    this.lastWordlistIndex = 0;
  }

  private emit(event: string, ...args: any[]): void {
    this.paramMiner.eventEmitter.emit(event, ...args);
  }

  private emitDebug(message: string): void {
    this.emit("debug", `[discovery.ts] ${message}`);
  }

  private emitLog(message: string): void {
    this.emit("logs", message);
  }

  public async startDiscovery(): Promise<void> {
    const timeout = this.paramMiner.config.timeout * 1000;
    const startTime = Date.now();

    this.emitDebug(`Starting discovery with timeout ${timeout}ms`);

    try {
      await this.processParameters(timeout, startTime);
    } catch (error) {
      this.emitDebug(`Discovery error: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }

    if (await this.paramMiner.stateManager.continueOrWait()) {
      this.completeDiscovery(startTime);
    }
  }

  private async processParameters(timeout: number, startTime: number): Promise<void> {
    while (this.hasMoreParameters()) {
      if (!await this.paramMiner.stateManager.continueOrWait()) {
        this.emitDebug("Discovery canceled or errored");
        return;
      }

      if (this.isTimedOut(startTime, timeout)) {
        this.handleTimeout(timeout);
        return;
      }

      const chunk = this.getNextWordlistChunk();
      if (chunk.length === 0) {
        this.emitDebug("No more parameters to process");
        break;
      }

      await this.processChunk(chunk);
    }
  }

  private isTimedOut(startTime: number, timeout: number): boolean {
    return Date.now() - startTime > timeout;
  }

  private handleTimeout(timeout: number): void {
    const message = `Discovery timed out after ${timeout}ms`;
    this.emitDebug(message);
    this.emitLog(message);
    this.paramMiner.updateState(MiningSessionState.Timeout);
  }

  private async processChunk(chunk: Parameter[]): Promise<void> {
    this.emitDebug(`Processing chunk of ${chunk.length} parameters`);
    const requestStartTime = Date.now();

    const result = await this.sendRequest(chunk);
    if (!result) return;

    if (!await this.paramMiner.stateManager.continueOrWait()) {
      this.emitDebug("Discovery canceled after request");
      return;
    }

    this.emitRequest(requestStartTime, chunk, result);

    if (this.isRateLimited(result.requestResponse.response)) {
      this.handleRateLimit();
      return;
    }

    const anomaly = this.paramMiner.anomalyDetector.hasChanges(
      result.requestResponse.response,
      chunk
    );

    if (anomaly) {
      await this.handleAnomaly(chunk, anomaly);
    }

    await this.delay();
  }

  private async sendRequest(chunk: Parameter[]): Promise<ChunkResult | undefined> {
    this.emitDebug(`Sending request with ${chunk.length} parameters...`);
    const query = this.buildQueryString(chunk);
    this.emitDebug(`Built query string of length ${query.length}`);

    const requestResponse = await this.paramMiner.requester.sendRequestWithParams(
      this.paramMiner.target,
      chunk,
      "discovery"
    );

    return { requestResponse, parameters: chunk };
  }

  private buildQueryString(parameters: Parameter[]): string {
    return parameters
      .map(param => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`)
      .join("&");
  }

  private emitRequest(startTime: number, chunk: Parameter[], result: ChunkResult): void {
    const requestTime = Date.now() - startTime;
    this.emitDebug(`Request completed in ${requestTime}ms`);
    this.emit("responseReceived", chunk.length, result.requestResponse);
  }

  private isRateLimited(response: any): boolean {
    return response.status === 429;
  }

  private handleRateLimit(): void {
    this.emitDebug("Rate limit detected (429)");
    this.emitLog("Rate limited, cancelling discovery. Please adjust delay between requests.");
    this.paramMiner.updateState(MiningSessionState.Canceled);
  }

  private async handleAnomaly(chunk: Parameter[], anomaly: any): Promise<void> {
    this.emitDebug(`Initial anomaly detected: ${anomaly.type}`);
    const verifyResult = await this.verifyAnomaly(chunk);

    if (!verifyResult) return;

    if (verifyResult.anomalyType) {
      await this.processVerifiedAnomaly(chunk, verifyResult);
    } else {
      this.emitDebug("Anomaly not verified in second request");
    }
  }

  private async verifyAnomaly(chunk: Parameter[]): Promise<ChunkResult | undefined> {
    const verifyStartTime = Date.now();
    const verifyRequestResponse = await this.paramMiner.requester.sendRequestWithParams(
      this.paramMiner.target,
      chunk,
      "narrower"
    );

    if (!await this.paramMiner.stateManager.continueOrWait()) {
      this.emitDebug("Discovery canceled during verification");
      return;
    }

    const verifyTime = Date.now() - verifyStartTime;
    this.emitDebug(`Verification request completed in ${verifyTime}ms`);
    this.emit("responseReceived", chunk.length, verifyRequestResponse);

    const verifyAnomaly = this.paramMiner.anomalyDetector.hasChanges(
      verifyRequestResponse.response,
      chunk
    );

    return verifyAnomaly ? {
      requestResponse: verifyRequestResponse,
      parameters: chunk,
      anomalyType: verifyAnomaly.type
    } : undefined;
  }

  private async processVerifiedAnomaly(chunk: Parameter[], verifyResult: ChunkResult): Promise<void> {
    this.emitDebug(`Anomaly verified: ${verifyResult.anomalyType}`);
    this.emitAnomalyLog(chunk.length, verifyResult);

    const narrowedDownChunk = await this.narrowDownWordlist([...chunk]);
    this.emitDebug(`Narrowed down to ${narrowedDownChunk.length} parameters`);

    narrowedDownChunk.forEach(finding => {
      this.emit("finding", finding);
    });

    if (narrowedDownChunk.length === 0) {
      this.emitDebug("False positive detected");
      this.emitLog("False positive - no parameters could be isolated");
    }
  }

  private emitAnomalyLog(chunkLength: number, result: ChunkResult): void {
    const anomaly = result.anomalyType;
    this.emitLog(
      `Anomaly ${anomaly.toUpperCase()} detected in response. ` +
      `Narrowing down ${chunkLength} parameters.`
    );
  }

  private async delay(): Promise<void> {
    await new Promise(resolve =>
      setTimeout(resolve, this.paramMiner.config.delayBetweenRequests)
    );
  }

  private completeDiscovery(startTime: number): void {
    this.paramMiner.updateState(MiningSessionState.Completed);
    this.emit("complete");

    const totalTime = Date.now() - startTime;
    this.emitDebug(`Discovery completed in ${totalTime}ms`);
    this.emitLog(`Discovery complete in ${totalTime}ms`);
  }

  private async narrowDownWordlist(chunk: Parameter[]): Promise<Finding[]> {
    const findings: Finding[] = [];
    const chunksToProcess: Parameter[][] = [chunk];

    this.emitDebug(`Starting narrowDownWordlist with ${chunk.length} parameters`);

    while (chunksToProcess.length > 0) {
      const currentChunk = chunksToProcess.pop();
      if (!currentChunk || currentChunk.length === 0) continue;

      if (!await this.paramMiner.stateManager.continueOrWait()) {
        this.emitDebug("Narrowing canceled");
        return findings;
      }

      this.emitDebug(`Processing chunk of ${currentChunk.length} parameters`);
      const startTime = Date.now();

      const { request, response } = await this.paramMiner.requester.sendRequestWithParams(
        this.paramMiner.target,
        currentChunk,
        "narrower"
      );

      if (!await this.paramMiner.stateManager.continueOrWait()) {
        this.emitDebug("Narrowing canceled after request");
        return findings;
      }

      this.emit("responseReceived", currentChunk.length, { request, response });

      const requestTime = Date.now() - startTime;
      this.emitDebug(`Request completed in ${requestTime}ms`);

      const anomaly = this.paramMiner.anomalyDetector.hasChanges(
        response,
        currentChunk
      );

      if (anomaly) {
        this.emitDebug(`Anomaly detected: ${anomaly.type}`);

        if (currentChunk.length === 1) {
          const parameter = currentChunk[0];
          if (!parameter) continue;

          this.emitDebug(`Verifying single parameter: ${parameter.name}`);
          const verifyStartTime = Date.now();

          const { request, response: verifyResponse } = await this.paramMiner.requester.sendRequestWithParams(
            this.paramMiner.target,
            currentChunk,
            "narrower"
          );

          if (!await this.paramMiner.stateManager.continueOrWait()) {
            this.emitDebug("Narrowing canceled during verification");
            return findings;
          }

          const verifyRequestTime = Date.now() - verifyStartTime;
          this.emitDebug(`Verification request completed in ${verifyRequestTime}ms`);

          this.emit(
            "responseReceived",
            currentChunk.length,
            { request, response: verifyResponse }
          );

          const verifyAnomaly = this.paramMiner.anomalyDetector.hasChanges(
            verifyResponse,
            currentChunk
          );

          if (verifyAnomaly) {
            this.emitDebug(`Parameter verified: ${parameter.name} (${verifyAnomaly.type})`);
            findings.push({
              requestResponse: { request, response: verifyResponse },
              parameter,
              anomalyType: verifyAnomaly.type
            });
          } else {
            this.emitDebug(`Parameter verification failed: ${parameter.name}`);
          }
        } else {
          const mid = Math.floor(currentChunk.length / 2);
          const firstHalf = currentChunk.slice(0, mid);
          const secondHalf = currentChunk.slice(mid);

          this.emitDebug(`Splitting chunk into ${firstHalf.length} and ${secondHalf.length} parameters`);
          chunksToProcess.push(secondHalf);
          chunksToProcess.push(firstHalf);
        }
      } else {
        this.emitDebug(`No anomaly detected for chunk of ${currentChunk.length} parameters`);
      }

      await new Promise((resolve) =>
        setTimeout(resolve, this.paramMiner.config.delayBetweenRequests)
      );
    }

    this.emitDebug(`Narrowing complete - found ${findings.length} parameters`);
    return findings;
  }

  private getNextWordlistChunk(): Parameter[] {
    if (!this.paramMiner) {
      throw new Error("ParamMiner is not initialized");
    }

    const wordlist = Array.from(this.paramMiner.wordlist ?? []);
    const attackType = this.paramMiner.config.attackType;
    const maxSize = this.paramMiner.config?.maxSize;

    if (attackType === "headers") {
      const chunkSize = Math.min(
        maxSize ?? ParamDiscovery.DEFAULT_HEADER_CHUNK_SIZE,
        wordlist.length - this.lastWordlistIndex
      );

      const chunk = wordlist
        .slice(this.lastWordlistIndex, this.lastWordlistIndex + chunkSize)
        .map(word => ({
          name: word,
          value: this.randomParameterValue()
        }));

      this.lastWordlistIndex += chunkSize;
      return chunk;
    }

    const parameterChunk: Parameter[] = [];
    let currentSize = attackType === "body" ? 2 : this.paramMiner.target.url.length; // Start with {} for JSON body or URL length for query

    while (this.lastWordlistIndex < wordlist.length) {
      const word = wordlist[this.lastWordlistIndex];
      if (!word) {
        this.lastWordlistIndex++;
        continue;
      }

      const encodedWord = encodeURIComponent(word);
      const encodedValue = encodeURIComponent(this.randomParameterValue());

      const paramSize = attackType === "body"
        ? 6 + encodedWord.length + encodedValue.length // "key":"value",
        : 2 + encodedWord.length + encodedValue.length; // key=value&

      // Check if adding this parameter would exceed maxSize
      if (maxSize && currentSize + paramSize > maxSize) {
        break;
      }

      parameterChunk.push({
        name: word,
        value: this.randomParameterValue()
      });

      currentSize += paramSize;
      this.lastWordlistIndex++;
    }

    return parameterChunk;
  }

  public calculateTotalRequests(): number {
    if (!this.paramMiner) {
      throw new Error("ParamMiner is not initialized");
    }

    const wordlist = Array.from(this.paramMiner.wordlist ?? []);
    const attackType = this.paramMiner.config.attackType;
    const maxSize = this.paramMiner.config?.maxSize;

    if (attackType === "headers") {
      return Math.ceil(wordlist.length / (maxSize ?? ParamDiscovery.DEFAULT_HEADER_CHUNK_SIZE));
    }

    let totalRequests = 0;
    let currentSize = attackType === "body" ? 2 : this.paramMiner.target.url.length;
    let currentChunkSize = 0;

    for (const word of wordlist) {
      const encodedWord = encodeURIComponent(word);
      const encodedValue = encodeURIComponent(this.randomParameterValue());

      const paramSize = attackType === "body"
        ? 6 + encodedWord.length + encodedValue.length
        : 2 + encodedWord.length + encodedValue.length;

      if (maxSize && currentSize + paramSize > maxSize) {
        if (currentChunkSize > 0) {
          totalRequests++;
        }
        currentSize = attackType === "body" ? 2 : this.paramMiner.target.url.length;
        currentChunkSize = 0;
      }

      currentSize += paramSize;
      currentChunkSize++;
    }

    if (currentChunkSize > 0) {
      totalRequests++;
    }

    return totalRequests + this.paramMiner.initialRequestAmount();
  }

  private randomParameterValue(): string {
    return randomString(ParamDiscovery.PARAMS_VALUES_SIZE);
  }

  private hasMoreParameters(): boolean {
    return this.lastWordlistIndex < this.paramMiner.wordlist.size;
  }

  public cancel(): void {
    this.paramMiner.updateState(MiningSessionState.Canceled);
  }

  public pause(): void {
    this.paramMiner.updateState(MiningSessionState.Paused);
  }

  public resume(): void {
    const phase = this.paramMiner.stateManager.getPhase();
    const newState = phase === "learning" ? MiningSessionState.Learning : MiningSessionState.Running;
    this.paramMiner.updateState(newState, phase);
  }
}
