import { Finding, Parameter, RequestContext } from "shared";
import { MiningSessionState, RequestResponse } from "shared";
import { FrontendSDK } from "./types";
import { useSessionsStore } from "./stores/sessionsStore";

export function setupEvents(sdk: FrontendSDK) {
  const { newSession, updateSessionState, addRequestResponse, addFinding, addLog, updateSessionTotalRequests } =
    useSessionsStore.getState();

  sdk.backend.onEvent("paramfinder:new", (miningID: string, totalRequests: number) => {
    console.log("paramfinder:new", miningID, totalRequests);
    newSession(miningID, totalRequests);
    addLog(miningID, `Starting mining session ${miningID}`);
  });

  sdk.backend.onEvent("paramfinder:complete", (miningID: string) => {
    console.log("paramfinder:complete", miningID);
    updateSessionState(miningID, MiningSessionState.Completed);
    addLog(miningID, `Mining session ${miningID} completed`);
  });

  sdk.backend.onEvent("paramfinder:log", (miningID: string, log: string) => {
    console.log("paramfinder:log", miningID, log);
    addLog(miningID, log);
  });

  sdk.backend.onEvent(
    "paramfinder:state",
    (miningID: string, state: MiningSessionState) => {
      console.log("paramfinder:state", miningID, state);
      updateSessionState(miningID, state);
      addLog(miningID, `Mining session ${miningID} state changed to ${state}`);
    }
  );

  sdk.backend.onEvent(
    "paramfinder:progress",
    (
      miningID: string,
      parametersSent: number,
      context: RequestContext,
      requestResponse?: RequestResponse,
    ) => {
      console.log(
        "paramfinder:response_received",
        miningID,
        parametersSent,
        context,
        JSON.stringify(requestResponse),
      );

      addRequestResponse(miningID, parametersSent, context, requestResponse);
    }
  );

  sdk.backend.onEvent(
    "paramfinder:new_finding",
    (miningID: string, finding: Finding) => {
      console.log("paramfinder:new_finding", miningID, finding);
      addFinding(miningID, finding);
      addLog(miningID, `New parameter discovered: ${finding.parameter.name}`);
    }
  );

  sdk.backend.onEvent(
    "paramfinder:error",
    (miningID: string, error: string) => {
      console.log("paramfinder:error", miningID, error);
      updateSessionState(miningID, MiningSessionState.Error);
      addLog(miningID, `Mining session ${miningID} error: ${JSON.stringify(error)}`);
    }
  );

  sdk.backend.onEvent(
    "paramfinder:adjust",
    (miningID: string, totalRequests: number) => {
      console.log("paramfinder:adjust", miningID, totalRequests);
      updateSessionTotalRequests(miningID, totalRequests);
    }
  );
}
