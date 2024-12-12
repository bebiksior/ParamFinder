import { Finding, Parameter } from "shared";
import { MiningSessionState, RequestResponse } from "shared";
import { FrontendSDK } from "./types";
import { miningSessionStore } from "./stores/sessionsStore";

export function setupEvents(sdk: FrontendSDK) {
  const { newSession, updateSessionState, addRequestResponse, addFinding, addLog } =
    miningSessionStore;

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
    "paramfinder:response_received",
    (
      miningID: string,
      parametersCount: number,
      requestResponse: RequestResponse,
      context: "discovery" | "narrower",
    ) => {
      console.log(
        "paramfinder:response_received",
        miningID,
        parametersCount,
        requestResponse,
        context
      );
      addRequestResponse(miningID, parametersCount, requestResponse, context);
    }
  );

  sdk.backend.onEvent(
    "paramfinder:new_finding",
    (miningID: string, finding: Finding) => {
      console.log("paramfinder:new_finding", miningID, finding);
      addFinding(miningID, finding);
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
}
