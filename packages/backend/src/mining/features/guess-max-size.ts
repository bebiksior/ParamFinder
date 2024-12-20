import { ParamMiner } from "../param-miner";
import { randomString } from "../../util/helper";
import { Parameter } from "shared";

interface SizeConfig {
  sizes: number[];
  defaultSize: number;
  generateParams: (size: number) => Parameter[];
}

export const sizeConfigs: Record<string, SizeConfig> = {
  headers: {
    sizes: [100, 80, 50, 20],
    defaultSize: 20,
    generateParams: (size) =>
      Array.from({ length: size }, () => ({
        name: randomString(10),
        value: randomString(10),
      })),
  },
  query: {
    sizes: [14000, 8000, 4000, 2000, 500],
    defaultSize: 500,
    generateParams: (size) => [
      {
        name: "test",
        value: randomString(size),
      },
    ],
  },
  body: {
    sizes: [100000, 50000, 25000, 10000],
    defaultSize: 10000,
    generateParams: (size) => [
      {
        name: "test",
        value: randomString(size),
      },
    ],
  },
};

// Can send up to sizeConfigs[paramMiner.config.attackType].sizes.length requests for max size detection
export async function guessMaxSize(paramMiner: ParamMiner): Promise<number> {
  const config = sizeConfigs[paramMiner.config.attackType];
  if (!config) {
    throw new Error(`Invalid attack type: ${paramMiner.config.attackType}`);
  }

  let lastSuccessfulSize = 0;
  let requestsSent = 0;
  const { sizes, defaultSize, generateParams } = config;

  paramMiner.sdk.console.log(
    `Detecting maximum ${paramMiner.config.attackType} size...`
  );

  for (const size of sizes) {
    try {
      const params = generateParams(size);

      const response = await paramMiner.requester.sendRequestWithParams(
        paramMiner.target,
        params,
        "learning"
      );

      requestsSent++;
      paramMiner.eventEmitter.emit("responseReceived", 0, response);

      const anomaly = paramMiner.anomalyDetector.hasChanges(
        response.response,
        params
      );
      if (!anomaly) {
        lastSuccessfulSize = size;
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, paramMiner.config.delayBetweenRequests));
    } catch (error) {
      requestsSent++;
      continue;
    }
  }

  // We need to adjust the remaining requests if we used less than expected
  const remainingRequests = sizes.length - requestsSent;
  if (remainingRequests > 0) {
    const newAmount = paramMiner.initialRequestAmount() - remainingRequests;
    paramMiner.initialRequestsSent = newAmount;
    paramMiner.sdk.api.send("paramfinder:adjust", paramMiner.id, newAmount);
  }

  if (lastSuccessfulSize === 0) {
    paramMiner.sdk.console.log(
      `Could not determine maximum ${paramMiner.config.attackType} size, using default of ${defaultSize}`
    );
    return defaultSize;
  }

  paramMiner.sdk.console.log(
    `Maximum ${paramMiner.config.attackType} size detected: ${lastSuccessfulSize}`
  );
  return lastSuccessfulSize;
}
