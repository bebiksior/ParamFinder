import { AdditionalChecksResult } from "shared";
import { ParamMiner } from "../param-miner";

export async function performAdditionalChecks(
  paramMiner: ParamMiner
): Promise<AdditionalChecksResult> {
  paramMiner.sdk.console.log("Performing additional checks...");

  const result = {
    handlesSpecialCharacters: true,
    handlesEncodedSpecialCharacters: true,
  } as AdditionalChecksResult;

  let params = [
    {
      name: "paramFinder[]",
      value: "exampleValue",
    },
  ];

  let response = await paramMiner.requester.sendRequestWithParams(
    paramMiner.target,
    params,
    "learning"
  );

  paramMiner.eventEmitter.emit("responseReceived", 0, response);

  let anomaly = paramMiner.anomalyDetector.hasChanges(
    response.response,
    params
  );
  if (anomaly) {
    result.handlesSpecialCharacters = false;

    params = [
      {
        name: "paramFinder%5B%5D",
        value: "exampleValue",
      },
    ];

    response = await paramMiner.requester.sendRequestWithParams(
      paramMiner.target,
      params,
      "learning"
    );

    paramMiner.eventEmitter.emit("responseReceived", 0, response);

    anomaly = paramMiner.anomalyDetector.hasChanges(response.response, params);
    if (anomaly) {
      paramMiner.log(
        "Server doesn't handle special characters, even URL encoded. Special characters will be ignored."
      );
      result.handlesEncodedSpecialCharacters = false;
    } else {
      paramMiner.log(
        "Server doesn't handle special characters without URL encoding. Special characters in your words will get URL encoded."
      );
    }
  }

  return result;
}
