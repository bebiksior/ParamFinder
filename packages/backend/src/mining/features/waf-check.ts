import { ParamMiner } from "../param-miner";
import { Parameter, Response } from "shared";

// Common WAF trigger patterns
const WAF_PATTERNS = ["/etc/passwd", ".htaccess", "javascript:alert", "onload=alert"];

export async function checkForWAF(
  paramMiner: ParamMiner,
  wafTriggerStrings?: string[],
): Promise<Response | null> {
  paramMiner.sdk.console.log("Checking for WAF...");

  if (!wafTriggerStrings) wafTriggerStrings = WAF_PATTERNS;

  for (const pattern of wafTriggerStrings) {
    try {
      const params: Parameter[] = [
        {
          name: "test",
          value: pattern,
        },
      ];

      paramMiner.sdk.console.log(`Testing WAF pattern: ${pattern}`);

      const response = await paramMiner.requester.sendRequestWithParams(
        paramMiner.target,
        params,
        "learning",
      );

      paramMiner.eventEmitter.emit("responseReceived", 0, response);

      const anomaly = paramMiner.anomalyDetector.hasChanges(
        response.response,
        params,
      );
      if (anomaly) {
        paramMiner.sdk.console.log(
          `WAF detected - Pattern "${pattern}" triggered anomaly: ${anomaly.type}`,
        );

        return response.response;
      }

      paramMiner.sdk.console.log(`Pattern "${pattern}" did not trigger WAF`);
      await new Promise((resolve) =>
        setTimeout(resolve, paramMiner.config.delayBetweenRequests),
      );
    } catch (error) {
      paramMiner.sdk.console.log(
        `WAF check failed with error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  paramMiner.sdk.console.log("No WAF detected");
  return null;
}
