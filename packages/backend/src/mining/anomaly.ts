import { MiningSessionState, Parameter, RequestResponse, Response } from "shared";
import { Anomaly, AnomalyType, StableFactors } from "shared";
import { DiffingSystem } from "../util/diffing";
import { randomString } from "../util/helper";
import { ParamMiner } from "./param-miner";

export class AnomalyDetector {
  private stableFactors: StableFactors | undefined;
  public initialRequestResponse: RequestResponse | undefined;
  private paramMiner: ParamMiner;
  private differ: DiffingSystem | undefined;

  constructor(paramMiner: ParamMiner) {
    this.paramMiner = paramMiner;
  }

  public hasChanges(
    response: Response,
    parameters: Parameter[]
  ): Anomaly | undefined {
    if (!this.stableFactors || !this.initialRequestResponse?.response) {
      return undefined;
    }

    const responseBody = response.body || "";

    // Check if status code is stable
    if (
      this.stableFactors.statusCodeStable &&
      this.stableFactors.statusCode &&
      response.status !== this.initialRequestResponse.response.status
    ) {
      return {
        type: AnomalyType.StatusCode,
        from: this.initialRequestResponse.response.status.toString(),
        to: response.status.toString(),
      };
    }

    // Check if redirect is stable
    if (this.stableFactors.redirect) {
      if (response.headers["Location"] && response.headers["Location"][0] !== this.stableFactors.redirect) {
        return {
          type: AnomalyType.Redirect,
          from: this.stableFactors.redirect,
          to: response.headers["Location"][0],
        };
      }
    }

    // Check headers if they're stable
    if (this.stableFactors.headersStable) {
      const initialHeaders = this.initialRequestResponse.response.headers;
      for (const [key, value] of Object.entries(initialHeaders)) {
        if (this.stableFactors.unstableHeaders.has(key)) {
          continue;
        }

        if (
          !response.headers[key] ||
          JSON.stringify(response.headers[key]) !== JSON.stringify(value)
        ) {
          return {
            type: AnomalyType.Headers,
            from: JSON.stringify(value),
            to: JSON.stringify(response.headers[key]),
            which: key,
          };
        }
      }
    }

    // Check if reflections are stable
    if (this.stableFactors.reflectionStable) {
      for (const param of parameters) {
        const reflectionCount = responseBody.split(param.value).length - 1;
        if (reflectionCount !== this.stableFactors.reflectionsCount) {
          return {
            type: AnomalyType.Reflection,
            from: this.stableFactors.reflectionsCount.toString(),
            to: reflectionCount.toString(),
            which: param.name,
          };
        }
      }
    }

    // Check body changes
    if (this.stableFactors.bodyStable) {
      const differChanges = this.differ?.hasChanges(responseBody);
      if (differChanges) {
        return {
          type: AnomalyType.Body,
        };
      }
    }

    return undefined;
  }

  private getParams(count: number): Parameter[] {
    const params = [];
    for (let j = 0; j < count; j++) {
      params.push({
        name: randomString(10 + count),
        value: randomString(10),
      } as Parameter);
    }
    return params;
  }

  public async learnFactors() {
    const learnRequestsCount = this.paramMiner.config.learnRequestsCount;
    if (learnRequestsCount <= 2) {
      throw new Error("Learn requests count must be at least 3");
    }

    const learnResponses: {
      requestResponse: RequestResponse;
      parameters: Parameter[];
    }[] = [];

    for (let i = 0; i < learnRequestsCount; i++) {
      if (this.paramMiner.state === MiningSessionState.Paused) {
        await this.paramMiner.paramDiscovery.waitWhilePaused();
      }

      if (this.paramMiner.state === MiningSessionState.Canceled) {
        break;
      }

      const params = this.getParams(i + 1);

      const requestResponse =
        await this.paramMiner.requester.sendRequestWithParams(
          this.paramMiner.target,
          params,
          "learning"
        );

      this.paramMiner.eventEmitter.emit(
        "responseReceived",
        0,
        requestResponse
      );

      learnResponses.push({
        requestResponse,
        parameters: params,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    this.initialRequestResponse = learnResponses[0]?.requestResponse;

    const initialResponse = this.initialRequestResponse?.response;
    const secondResponse = learnResponses[1]?.requestResponse.response;
    if (!initialResponse || !secondResponse) {
      throw new Error("Initial response or second response is undefined");
    }

    this.differ = new DiffingSystem(
      this.paramMiner.sdk,
      initialResponse?.body || "",
      secondResponse?.body || ""
    );

    const stable = this.checkFactors(
      secondResponse,
      learnResponses[1]?.parameters ?? []
    );

    for (let i = 2; i < learnRequestsCount; i++) {
      const learnResponse = learnResponses[i];
      if (!learnResponse) {
        continue;
      }

      const response = learnResponse.requestResponse.response;
      const parameters = learnResponse.parameters;
      const newFactors = this.checkFactors(response, parameters);

      stable.bodyStable = stable.bodyStable && newFactors.bodyStable;
      stable.statusCodeStable =
        stable.statusCodeStable && newFactors.statusCodeStable;
      stable.reflectionStable =
        stable.reflectionStable && newFactors.reflectionStable;
      stable.headersStable = stable.headersStable && newFactors.headersStable;
      stable.unstableHeaders = new Set([
        ...stable.unstableHeaders,
        ...newFactors.unstableHeaders,
      ]);
      stable.redirect = newFactors.redirect;

      if (stable.reflectionsCount != newFactors.reflectionsCount) {
        this.paramMiner.sdk.console.log(
          "[!!!] Looks like reflections are not stable."
        );
        stable.reflectionStable = false;
      }
    }

    if (stable.bodyStable) {
      this.paramMiner.sdk.console.log("[!!!] Body is stable.");
    }

    this.stableFactors = stable;
    this.paramMiner.sdk.console.log(
      JSON.stringify(
        {
          ...stable,
          unstableHeaders: Array.from(stable.unstableHeaders),
        },
        null,
        2
      )
    );
  }

  private checkFactors(
    response: Response,
    parameters: Parameter[]
  ): StableFactors {
    const stable = {
      bodyStable: true,
      headersStable: true,
      statusCodeStable: true,
      reflectionStable: true,
      reflectionsCount: 0,
      statusCode: response.status,
      unstableHeaders: new Set<string>(),
    } as StableFactors;

    const locationHeader = response.headers["Location"];
    if (locationHeader) {
      stable.redirect = locationHeader[0];
    }

    const responseBody = response.body || "";

    const hasChanges = this.differ?.hasChanges(responseBody);
    if (hasChanges) {
      this.paramMiner.sdk.console.log("[!!!] Looks like body is not stable.");
      stable.bodyStable = false;
    }

    if (response.status !== this.initialRequestResponse?.response.status) {
      this.paramMiner.sdk.console.log("[!!!] Looks like status is not stable.");
      stable.statusCodeStable = false;
    }

    for (const param of parameters) {
      if (responseBody.includes(param.value)) {
        stable.reflectionsCount =
          responseBody.split(param.value).length - 1;
      }
    }

    if (
      Object.keys(response.headers).length !==
      Object.keys(this.initialRequestResponse!.response.headers).length
    ) {
      this.paramMiner.sdk.console.log(
        "[!!!] Looks like headers are not stable."
      );
      stable.headersStable = false;
    } else {
      // Compare each header value
      for (const [headerName, headerValues] of Object.entries(
        response.headers
      )) {
        const initialHeaderValues =
          this.initialRequestResponse!.response.headers[headerName];

        // Check if header exists in initial response and values match
        if (
          !initialHeaderValues ||
          headerValues.length !== initialHeaderValues.length ||
          !headerValues.every((val, idx) => val === initialHeaderValues[idx])
        ) {
          stable.unstableHeaders.add(headerName);
        }
      }

      if (stable.unstableHeaders.size > 0) {
        this.paramMiner.sdk.console.log(
          "[!!!] Found unstable headers: " +
            Array.from(stable.unstableHeaders).join(", ")
        );
      }
    }

    return stable;
  }
}
