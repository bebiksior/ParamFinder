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
      newSession(miningID, totalParametersAmount, totalLearnRequests);
      addLog(miningID, `Starting mining session ${miningID}`);
    }
  );

  sdk.backend.onEvent("paramfinder:log", (miningID: string, log: string) => {
    addLog(miningID, log);
  });

  sdk.backend.onEvent(
    "paramfinder:state",
    (
      miningID: string,
      state: MiningSessionState,
      phase?: MiningSessionPhase
    ) => {
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
      addRequestResponse(miningID, parametersSent, context, requestResponse);
    }
  );

  sdk.backend.onEvent(
    "paramfinder:new_finding",
    (miningID: string, finding: Finding) => {
      addFinding(miningID, finding);
      addLog(miningID, `New parameter discovered: ${finding.parameter.name}`);
    }
  );

  sdk.backend.onEvent(
    "paramfinder:error",
    (miningID: string, error: string) => {
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
      updateTotalParametersAmount(miningID, newAmount);
    }
  );

  sdk.backend.onEvent("paramfinder:update_available", () => {
    sdk.window.showToast(
      "You are using an outdated version of ParamFinder. Please update to the latest version on the Plugins page.",
      { variant: "info" }
    );
  });
}
