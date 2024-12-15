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
    const timeout = this.paramMiner.config.timeout;
    const startTime = Date.now();

    while (this.hasMoreParameters()) {
      if (this.paramMiner.state === MiningSessionState.Canceled) {
        return;
      }

      if (this.paramMiner.state === MiningSessionState.Paused) {
        await this.waitWhilePaused();
      }

      const currentTime = Date.now();
      if (currentTime - startTime > timeout) {
        this.paramMiner.eventEmitter.emit(
          "logs",
          `Discovery timed out after ${timeout}ms`
        );
        this.paramMiner.updateState(MiningSessionState.Timeout);
        return;
      }

      const chunk = this.getNextWordlistChunk();
      if (chunk.length === 0) {
        break;
      }

      const requestResponse =
        await this.paramMiner.requester.sendRequestWithParams(
          this.paramMiner.target,
          chunk,
          "discovery"
        );

      this.paramMiner.eventEmitter.emit("responseReceived", chunk.length, requestResponse);

      if (requestResponse.response.status === 429) {
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
        // Send a verification request
        const verifyRequestResponse = await this.paramMiner.requester.sendRequestWithParams(
          this.paramMiner.target,
          chunk,
          "narrower"
        );
        this.paramMiner.eventEmitter.emit("responseReceived", chunk.length, verifyRequestResponse);

        const verifyAnomaly = this.paramMiner.anomalyDetector.hasChanges(
          verifyRequestResponse.response,
          chunk
        );

        if (verifyAnomaly) {
          this.paramMiner.eventEmitter.emit(
            "logs",
            `Anomaly ${verifyAnomaly.type.toUpperCase()} detected, narrowing down ${chunk.length} parameters`
          );

          const narrowedDownChunk = await this.narrowDownWordlist(chunk);
          narrowedDownChunk.forEach((finding) => {
            this.paramMiner.eventEmitter.emit("finding", finding);
          });
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
      this.paramMiner.eventEmitter.emit(
        "logs",
        `Discovery complete in ${endTime - startTime}ms`
      );
    }
  }

  private async narrowDownWordlist(chunk: Parameter[]): Promise<Finding[]> {
    const findings: Finding[] = [];
    const chunksToProcess: Parameter[][] = [chunk];

    while (chunksToProcess.length > 0) {
      const currentChunk = chunksToProcess.pop();
      if (!currentChunk || currentChunk.length === 0) continue;

      if (this.paramMiner.state === MiningSessionState.Canceled) {
        return findings;
      }

      if (this.paramMiner.state === MiningSessionState.Paused) {
        await this.waitWhilePaused();
      }

      const { response } = await this.paramMiner.requester.sendRequestWithParams(
        this.paramMiner.target,
        currentChunk,
        "narrower"
      );

      const anomaly = this.paramMiner.anomalyDetector.hasChanges(
        response,
        currentChunk
      );

      if (anomaly) {
        if (currentChunk.length === 1) {
          const parameter = currentChunk[0];
          if (!parameter) continue;

          const { request, response: verifyResponse } = await this.paramMiner.requester.sendRequestWithParams(
            this.paramMiner.target,
            currentChunk,
            "narrower"
          );

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
            findings.push({
              requestResponse: { request, response: verifyResponse },
              parameter,
              anomalyType: verifyAnomaly.type
            });
          }
        } else {
          const mid = Math.floor(currentChunk.length / 2);
          const firstHalf = currentChunk.slice(0, mid);
          const secondHalf = currentChunk.slice(mid);

          chunksToProcess.push(secondHalf);
          chunksToProcess.push(firstHalf);
        }
      }

      await new Promise((resolve) =>
        setTimeout(resolve, this.paramMiner.config.delayBetweenRequests)
      );
    }

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

      const paramSize = attackType === "body"
        ? 6 + word.length + this.PARAMS_VALUES_SIZE // "key":"value",
        : 2 + word.length + this.PARAMS_VALUES_SIZE; // key=value&

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
      const paramSize = attackType === "body"
        ? 6 + word.length + this.PARAMS_VALUES_SIZE
        : 2 + word.length + this.PARAMS_VALUES_SIZE;

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
