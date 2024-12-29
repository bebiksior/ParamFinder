import { Finding, MiningSessionPhase, RequestContext } from "shared";
import { MiningSessionState, RequestResponse } from "shared";
import { FrontendSDK } from "./types";
import { useSessionsStore } from "./stores/sessionsStore";

export function setupEvents(sdk: FrontendSDK) {
  const {
    newSession,
    updateSessionState,
    addRequestResponse,
    addFinding,
    addLog,
    updateTotalParametersAmount,
  } = useSessionsStore.getState();

  sdk.backend.onEvent(
    "paramfinder:new",
    (
      miningID: string,
      totalParametersAmount: number,
      totalLearnRequests: number
    ) => {
      //   console.log(
      //     "paramfinder:new",
      //     miningID,
      //     totalParametersAmount,
      //     totalLearnRequests,
      //   );
      newSession(miningID, totalParametersAmount, totalLearnRequests);
      addLog(miningID, `Starting mining session ${miningID}`);
    }
  );

  sdk.backend.onEvent("paramfinder:complete", (miningID: string) => {
    // console.log("paramfinder:complete", miningID);
  });

  sdk.backend.onEvent("paramfinder:log", (miningID: string, log: string) => {
    // console.log("paramfinder:log", miningID, log);
    addLog(miningID, log);
  });

  sdk.backend.onEvent(
    "paramfinder:state",
    (
      miningID: string,
      state: MiningSessionState,
      phase?: MiningSessionPhase
    ) => {
      //   console.log("paramfinder:state", miningID, state, phase);
      updateSessionState(miningID, state, phase);
      addLog(
        miningID,
        `Mining session ${miningID} state changed to ${state}${
          phase ? ` (phase: ${phase})` : ""
        }.`
      );
    }
  );

  sdk.backend.onEvent(
    "paramfinder:progress",
    (
      miningID: string,
      parametersSent: number,
      context: RequestContext,
      requestResponse?: RequestResponse
    ) => {
      //   console.log(
      //     "paramfinder:response_received",
      //     miningID,
      //     parametersSent,
      //     context,
      //     requestResponse == null ? "null" : "not null",
      //   );

      addRequestResponse(miningID, parametersSent, context, requestResponse);
    }
  );

  sdk.backend.onEvent(
    "paramfinder:new_finding",
    (miningID: string, finding: Finding) => {
      //   console.log("paramfinder:new_finding", miningID, finding);
      addFinding(miningID, finding);
      addLog(miningID, `New parameter discovered: ${finding.parameter.name}`);
    }
  );

  sdk.backend.onEvent(
    "paramfinder:error",
    (miningID: string, error: string) => {
      //   console.log("paramfinder:error", miningID, error);
      updateSessionState(
        miningID,
        MiningSessionState.Error,
        MiningSessionPhase.Idle
      );
      addLog(
        miningID,
        `Mining session ${miningID} error: ${JSON.stringify(error)}`
      );
    }
  );

  sdk.backend.onEvent(
    "paramfinder:adjust",
    (miningID: string, newAmount: number) => {
      //   console.log("paramfinder:adjust", miningID, newAmount);
      updateTotalParametersAmount(miningID, newAmount);
    }
  );
}
