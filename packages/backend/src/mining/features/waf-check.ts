import { ParamMiner } from "../param-miner";
import { Parameter, Response } from "shared";

// Common WAF trigger patterns
const WAF_PATTERNS = [
  "/etc/passwd",
  ".htaccess",
  "javascript:alert",
];
// Can send up to 3 requests for WAF detection
export async function checkForWAF(paramMiner: ParamMiner): Promise<Response | null> {
  paramMiner.sdk.console.log("Checking for WAF...");

  let requestsSent = 0;

  for (const pattern of WAF_PATTERNS) {
    try {
      const params: Parameter[] = [{
        name: "test",
        value: pattern
      }];

      paramMiner.sdk.console.log(`Testing WAF pattern: ${pattern}`);

      const response = await paramMiner.requester.sendRequestWithParams(
        paramMiner.target,
        params,
        "learning"
      );

      requestsSent++;
      paramMiner.eventEmitter.emit("responseReceived", 0, response);

      const anomaly = paramMiner.anomalyDetector.hasChanges(response.response, params);
      if (anomaly) {
        paramMiner.sdk.console.log(`WAF detected - Pattern "${pattern}" triggered anomaly: ${anomaly.type}`);

        // We need to adjust the remaining requests if we used less than expected
        const remainingRequests = WAF_PATTERNS.length - requestsSent;
        if (remainingRequests > 0) {
          const newAmount = paramMiner.initialRequestAmount() - remainingRequests;
          paramMiner.initialRequestsSent = newAmount;
          paramMiner.sdk.api.send("paramfinder:adjust", paramMiner.id, newAmount);
        }

        return response.response;
      }

      paramMiner.sdk.console.log(`Pattern "${pattern}" did not trigger WAF`);
      await new Promise((resolve) => setTimeout(resolve, paramMiner.config.delayBetweenRequests));
    } catch (error) {
      requestsSent++;
      paramMiner.sdk.console.log(
        `WAF check failed with error: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  const remainingRequests = WAF_PATTERNS.length - requestsSent;
  if (remainingRequests > 0) {
    const newAmount = paramMiner.initialRequestAmount() - remainingRequests;
    paramMiner.sdk.api.send("paramfinder:adjust", paramMiner.id, newAmount);
  }

  paramMiner.sdk.console.log("No WAF detected");
  return null;
}
