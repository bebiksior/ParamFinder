import { ParamMiner } from "../param-miner";
import { randomString } from "../../util/helper";
import { Parameter } from "shared";

interface SizeConfig {
  sizes: number[];
  defaultSize: number;
  generateParams: (size: number) => Parameter[];
  getLogMessage: (size: number) => string;
}

const sizeConfigs: Record<string, SizeConfig> = {
  headers: {
    sizes: [100, 80, 50, 20],
    defaultSize: 20,
    generateParams: (size) =>
      Array.from({ length: size }, () => ({
        name: randomString(10),
        value: randomString(10),
      })),
    getLogMessage: (size) => `${size} headers`,
  },
  query: {
    sizes: [14000, 8000, 4000, 2000, 500],
    defaultSize: 500,
    generateParams: (size) => [{
      name: "test",
      value: randomString(size),
    }],
    getLogMessage: (size) => `URL size ${size}`,
  },
  body: {
    sizes: [100000, 50000, 25000, 10000],
    defaultSize: 10000,
    generateParams: (size) => [{
      name: "test",
      value: randomString(size),
    }],
    getLogMessage: (size) => `body size ${size}`,
  },
};

export async function guessMaxSize(paramMiner: ParamMiner): Promise<number> {
  const config = sizeConfigs[paramMiner.config.attackType];
  if (!config) {
    throw new Error(`Invalid attack type: ${paramMiner.config.attackType}`);
  }

  let lastSuccessfulSize = 0;
  const { sizes, defaultSize, generateParams, getLogMessage } = config;

  paramMiner.sdk.console.log(`Detecting maximum ${paramMiner.config.attackType} size...`);

  for (const size of sizes) {
    try {
      const params = generateParams(size);
      paramMiner.sdk.console.log(`Testing ${getLogMessage(size)}...`);

      const response = await paramMiner.requester.sendRequestWithParams(
        paramMiner.target,
        params,
        "discovery"
      );

      const anomaly = paramMiner.anomalyDetector.hasChanges(response.response, params);
      if (!anomaly) {
        lastSuccessfulSize = size;
        paramMiner.sdk.console.log(`${getLogMessage(size)} successful`);
        break;
      }

      paramMiner.sdk.console.log(
        `${getLogMessage(size)} failed with anomaly: ${JSON.stringify(anomaly)}`
      );
    } catch (error) {
      paramMiner.sdk.console.log(
        `${getLogMessage(size)} failed with error: ${error instanceof Error ? error.message : String(error)}`
      );
      continue;
    }
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
