import { sendRequest } from "../requests/requests";
import { Request, Parameter, RequestContext } from "shared";
import { ParamMiner } from "./param-miner";
import { generateID } from "../util/helper";

export class Requester {
  private paramMiner: ParamMiner;
  public bodyType: "json" | "query" | null = null;

  constructor(paramMiner: ParamMiner) {
    this.paramMiner = paramMiner;
  }

  private isJSONBody(body: string): boolean {
    try {
      JSON.parse(body);
      return true;
    } catch {
      return false;
    }
  }

  private isQueryBody(body: string): boolean {
    // Check if body follows key=value&key2=value2 format
    const queryRegex = /^(?:[^=&]*=[^=&]*&?)*$/;
    return queryRegex.test(body);
  }

  public async sendRequestWithParams(
    request: Request,
    parameters: Parameter[],
    context?: RequestContext
  ) {
    const attackType = this.paramMiner.config.attackType;

    const requestCopy = {
      ...request,
      id: generateID(),
      context: context ?? "discovery",
      headers: { ...request.headers }
    };

    switch (attackType) {
      case "query":
        // Add parameters to query string with URL encoding
        const queryParams = parameters
          .map(
            (p) =>
              `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`
          )
          .join("&");
        requestCopy.query = requestCopy.query
          ? `${requestCopy.query}&${queryParams}`
          : queryParams;
        break;

      case "headers":
        parameters.forEach((p) => {
          requestCopy.headers[p.name] = [p.value];
        });
        break;

      case "body": {
        const originalBody = request.body || "";
        const contentType = request.headers["content-type"]?.[0]?.toLowerCase();

        if (!this.bodyType) {
          const isJSON = this.isJSONBody(originalBody) || contentType?.includes("/json");
          const isQuery = this.isQueryBody(originalBody) || contentType?.includes("/x-www-form-urlencoded");

          if (!isJSON && !isQuery) {
            throw new Error("Body must be either JSON or URL-encoded query string");
          }

          this.bodyType = isJSON ? "json" : "query";
          this.paramMiner.sdk.api.send("paramfinder:log", this.paramMiner.id, `Determined body format: ${this.bodyType}`);
        }

        if (this.bodyType === "json") {
          let bodyObj = originalBody ? JSON.parse(originalBody) : {};
          parameters.forEach((p) => {
            bodyObj[p.name] = p.value;
          });
          requestCopy.body = JSON.stringify(bodyObj);
          requestCopy.headers["content-type"] = ["application/json"];
        } else {
          const existingParams = originalBody ? originalBody + "&" : "";
          const newParams = parameters
            .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`)
            .join("&");
          requestCopy.body = existingParams + newParams;
          requestCopy.headers["content-type"] = ["application/x-www-form-urlencoded"];
        }
        break;
      }
    }

    const requestResponse = await sendRequest(this.paramMiner.sdk, requestCopy);
    return requestResponse;
  }
}
