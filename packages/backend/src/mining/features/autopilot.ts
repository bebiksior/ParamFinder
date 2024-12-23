import { RequestResponse } from "packages/shared/src";
import { ParamMiner } from "../param-miner";
import { guessMaxSize } from "./guess-max-size";

/**
 * Actions:
 * autopilot-url-adjust: if we receive `414 URI Too Long` then autopilot will try to guess max URL size again and adjust
 *
 * Returns if any action has been taken
 */
export async function autopilotCheckResponse(
  paramMiner: ParamMiner,
  requestResponse: RequestResponse,
): Promise<boolean> {
  let anyActionTaken = false;

  if (
    requestResponse.response.status === 414 &&
    paramMiner.config.attackType === "query" &&
    !paramMiner.metadata.has("autopilot-url-adjust")
  ) {
    paramMiner.metadata.set("autopilot-url-adjust", true);
    anyActionTaken = true;

    paramMiner.log(
      "[AUTOPILOT] Received 414: URI Too Long, adjusting max URL size.",
    );
    const newMaxURLSize = await guessMaxSize(paramMiner);
    if (paramMiner.maxSize === newMaxURLSize) {
      paramMiner.log(
        "[AUTOPILOT] Guessed the same max URL size as before, ignoring.",
      );
    } else if (paramMiner.maxSize > newMaxURLSize) {
      paramMiner.log(
        `[AUTOPILOT] Adjusting max URL size to ${newMaxURLSize} (old: ${paramMiner.maxSize})`,
      );
      paramMiner.maxSize = newMaxURLSize;
    } else {
      paramMiner.log(
        "[AUTOPILOT] Guessed greater max URL size than before, ignoring.",
      );
    }
  }

  return anyActionTaken;
}
