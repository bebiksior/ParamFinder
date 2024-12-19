import { Parameter } from "shared";
import { Finding, MiningSessionState } from "shared";
import { randomString } from "../util/helper";
import { ParamMiner } from "./param-miner";

export class ParamDiscovery {
  private paramMiner: ParamMiner;
  private lastWordlistIndex: number;

  private readonly PARAMS_VALUES_SIZE = 8;

  constructor(paramMiner: ParamMiner) {
    this.paramMiner = paramMiner;
    this.lastWordlistIndex = 0;
  }

  public async waitWhilePaused(): Promise<void> {
    while (this.paramMiner.state === MiningSessionState.Paused) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  public async startDiscovery() {
    const timeout = this.paramMiner.config.timeout * 1000;
    const startTime = Date.now();

    this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Starting discovery with timeout ${timeout}ms`);

    while (this.hasMoreParameters()) {
      if (this.paramMiner.state === MiningSessionState.Canceled) {
        this.paramMiner.eventEmitter.emit("debug", "[discovery.ts] Discovery canceled");
        return;
      }

      if (this.paramMiner.state === MiningSessionState.Paused) {
        this.paramMiner.eventEmitter.emit("debug", "[discovery.ts] Discovery paused");
        await this.waitWhilePaused();
      }

      const currentTime = Date.now();
      if (currentTime - startTime > timeout) {
        this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Discovery timed out after ${timeout}ms`);
        this.paramMiner.eventEmitter.emit(
          "logs",
          `Discovery timed out after ${timeout}ms`
        );
        this.paramMiner.updateState(MiningSessionState.Timeout);
        return;
      }

      const chunk = this.getNextWordlistChunk();
      if (chunk.length === 0) {
        this.paramMiner.eventEmitter.emit("debug", "[discovery.ts] No more parameters to process");
        break;
      }

      this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Processing chunk of ${chunk.length} parameters`);
      const requestStartTime = Date.now();

      this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Sending request with ${chunk.length} parameters...`);
      const query = chunk.map(param => `${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`).join("&");
      this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Built query string of length ${query.length}`);
      const requestResponse =
        await this.paramMiner.requester.sendRequestWithParams(
          this.paramMiner.target,
          chunk,
          "discovery"
        );

      const requestTime = Date.now() - requestStartTime;
      this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Request completed in ${requestTime}ms`);

      this.paramMiner.eventEmitter.emit("responseReceived", chunk.length, requestResponse);

      if (requestResponse.response.status === 429) {
        this.paramMiner.eventEmitter.emit("debug", "[discovery.ts] Rate limit detected (429)");
        this.paramMiner.eventEmitter.emit("logs", "Rate limited, cancelling discovery. Please adjust delay between requests.");
        this.paramMiner.updateState(MiningSessionState.Canceled);
        return;
      }

      // First verify the anomaly with a second request
      const anomaly = this.paramMiner.anomalyDetector.hasChanges(
        requestResponse.response,
        chunk
      );
      if (anomaly) {
        this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Initial anomaly detected: ${anomaly.type}`);

        // Send a verification request
        const verifyStartTime = Date.now();
        const verifyRequestResponse = await this.paramMiner.requester.sendRequestWithParams(
          this.paramMiner.target,
          chunk,
          "narrower"
        );
        const verifyTime = Date.now() - verifyStartTime;
        this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Verification request completed in ${verifyTime}ms`);

        this.paramMiner.eventEmitter.emit("responseReceived", chunk.length, verifyRequestResponse);

        const verifyAnomaly = this.paramMiner.anomalyDetector.hasChanges(
          verifyRequestResponse.response,
          chunk
        );

        if (verifyAnomaly) {
          this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Anomaly verified: ${verifyAnomaly.type}`);
          this.paramMiner.eventEmitter.emit(
            "logs",
            `Anomaly ${verifyAnomaly.type.toUpperCase()} detected in response. ` +
            `Narrowing down ${chunk.length} parameters. ` +
            `${verifyAnomaly.from ? `Changed from "${verifyAnomaly.from}" ` : ''}` +
            `${verifyAnomaly.to ? `to "${verifyAnomaly.to}"` : ''}`
          );

          const narrowedDownChunk = await this.narrowDownWordlist([...chunk]);
          this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Narrowed down to ${narrowedDownChunk.length} parameters`);

          narrowedDownChunk.forEach((finding) => {
            this.paramMiner.eventEmitter.emit("finding", finding);
          });

          if (narrowedDownChunk.length === 0) {
            this.paramMiner.eventEmitter.emit("debug", "[discovery.ts] False positive detected");
            this.paramMiner.eventEmitter.emit("logs", "False positive - no parameters could be isolated");
          }
        } else {
          this.paramMiner.eventEmitter.emit("debug", "[discovery.ts] Anomaly not verified in second request");
        }
      }

      await new Promise((resolve) =>
        setTimeout(resolve, this.paramMiner.config.delayBetweenRequests)
      );
    }

    if (this.paramMiner.state !== MiningSessionState.Canceled) {
      this.paramMiner.updateState(MiningSessionState.Completed);
      this.paramMiner.eventEmitter.emit("complete");

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Discovery completed in ${totalTime}ms`);
      this.paramMiner.eventEmitter.emit(
        "logs",
        `Discovery complete in ${totalTime}ms`
      );
    }
  }

  private async narrowDownWordlist(chunk: Parameter[]): Promise<Finding[]> {
    const findings: Finding[] = [];
    const chunksToProcess: Parameter[][] = [chunk];

    this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Starting narrowDownWordlist with ${chunk.length} parameters`);

    while (chunksToProcess.length > 0) {
      const currentChunk = chunksToProcess.pop();
      if (!currentChunk || currentChunk.length === 0) continue;

      if (this.paramMiner.state === MiningSessionState.Canceled) {
        return findings;
      }

      if (this.paramMiner.state === MiningSessionState.Paused) {
        await this.waitWhilePaused();
      }

      this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Processing chunk of ${currentChunk.length} parameters`);
      const startTime = Date.now();

      const { request, response } = await this.paramMiner.requester.sendRequestWithParams(
        this.paramMiner.target,
        currentChunk,
        "narrower"
      );

      this.paramMiner.eventEmitter.emit("responseReceived", currentChunk.length, { request, response });

      const requestTime = Date.now() - startTime;
      this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Request completed in ${requestTime}ms`);

      const anomaly = this.paramMiner.anomalyDetector.hasChanges(
        response,
        currentChunk
      );

      if (anomaly) {
        this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Anomaly detected: ${anomaly.type}`);

        if (currentChunk.length === 1) {
          const parameter = currentChunk[0];
          if (!parameter) continue;

          this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Verifying single parameter: ${parameter.name}`);
          const verifyStartTime = Date.now();

          const { request, response: verifyResponse } = await this.paramMiner.requester.sendRequestWithParams(
            this.paramMiner.target,
            currentChunk,
            "narrower"
          );

          const verifyRequestTime = Date.now() - verifyStartTime;
          this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Verification request completed in ${verifyRequestTime}ms`);

          this.paramMiner.eventEmitter.emit(
            "responseReceived",
            currentChunk.length,
            { request, response: verifyResponse }
          );

          const verifyAnomaly = this.paramMiner.anomalyDetector.hasChanges(
            verifyResponse,
            currentChunk
          );

          if (verifyAnomaly) {
            this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Parameter verified: ${parameter.name} (${verifyAnomaly.type})`);
            findings.push({
              requestResponse: { request, response: verifyResponse },
              parameter,
              anomalyType: verifyAnomaly.type
            });
          } else {
            this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Parameter verification failed: ${parameter.name}`);
          }
        } else {
          const mid = Math.floor(currentChunk.length / 2);
          const firstHalf = currentChunk.slice(0, mid);
          const secondHalf = currentChunk.slice(mid);

          this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Splitting chunk into ${firstHalf.length} and ${secondHalf.length} parameters`);
          chunksToProcess.push(secondHalf);
          chunksToProcess.push(firstHalf);
        }
      } else {
        this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] No anomaly detected for chunk of ${currentChunk.length} parameters`);
      }

      await new Promise((resolve) =>
        setTimeout(resolve, this.paramMiner.config.delayBetweenRequests)
      );
    }

    this.paramMiner.eventEmitter.emit("debug", `[discovery.ts] Narrowing complete - found ${findings.length} parameters`);
    return findings;
  }

  /**
   * Calculates next chunk of parameters to test based on attack type and size limits
   */
  private getNextWordlistChunk(): Parameter[] {
    if (!this.paramMiner) {
      throw new Error("ParamMiner is not initialized");
    }

    const wordlist = Array.from(this.paramMiner.wordlist ?? []);
    const attackType = this.paramMiner.config.attackType;
    const maxSize = this.paramMiner.config?.maxSize;

    if (attackType === "headers") {
      const chunkSize = Math.min(
        maxSize ?? 20,
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

  /**
   * Calculates total number of requests needed to test all parameters
   */
  public calculateTotalRequests(): number {
    if (!this.paramMiner) {
      throw new Error("ParamMiner is not initialized");
    }

    const wordlist = Array.from(this.paramMiner.wordlist ?? []);
    const attackType = this.paramMiner.config.attackType;
    const maxSize = this.paramMiner.config?.maxSize;

    if (attackType === "headers") {
      return Math.ceil(wordlist.length / (maxSize ?? 20));
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

    return totalRequests + this.paramMiner.config.learnRequestsCount;
  }

  private randomParameterValue(): string {
    return randomString(this.PARAMS_VALUES_SIZE);
  }

  private hasMoreParameters(): boolean {
    return this.lastWordlistIndex < this.paramMiner.wordlist.size;
  }

  public cancel() {
    this.paramMiner.updateState(MiningSessionState.Canceled);
  }

  public pause() {
    this.paramMiner.updateState(MiningSessionState.Paused);
  }

  public resume() {
    this.paramMiner.updateState(this.paramMiner.lastStateChange);
  }
}
