import { DefineEvents, SDK } from "caido:plugin";
import {
  Finding,
  MiningSessionPhase,
  MiningSessionState,
  RequestContext,
  RequestResponse,
} from "shared";

export type BackendEvents = DefineEvents<{
  /**
   * Notifies client about a new ParamFinder session
   * @param miningID - Session ID
   * @param totalParametersAmount - Total number of parameters that will be tested (used for progress tracking)
   * @param totalLearnRequests - Total number of requests that will be sent to learn target behavior (used for progress tracking)
   */
  "paramfinder:new": (
    miningID: string,
    totalParametersAmount: number,
    totalLearnRequests: number,
  ) => void;

  /**
   * Notifies client that a ParamFinder session has completed
   * @param miningID - Session ID
   */
  "paramfinder:complete": (miningID: string) => void;

  /**
   * Updates client on session progress and sends request/response data
   * @param miningID - Session ID
   * @param parametersSent - Number of parameters tested in this request
   * @param context - Context information for the request
   * @param requestResponse - Request and response data (omitted in performance mode)
   */
  "paramfinder:progress": (
    miningID: string,
    parametersSent: number,
    context: RequestContext,
    requestResponse?: RequestResponse,
  ) => void;

  /**
   * Notifies client about new parameter findings discovered
   * @param miningID - Session ID
   * @param finding - Details of the discovered finding
   */
  "paramfinder:new_finding": (miningID: string, finding: Finding) => void;

  /**
   * Notifies client about errors during parameter finding
   * @param miningID - Session ID
   * @param error - Error message details
   */
  "paramfinder:error": (miningID: string, error: string) => void;

  /**
   * Updates client about changes in session state
   * @param miningID - Session ID
   * @param state - New session state
   * @param phase - Optional, new session phase
   */
  "paramfinder:state": (
    miningID: string,
    state: MiningSessionState,
    phase?: MiningSessionPhase,
  ) => void;

  /**
   * Sends a log message to the client
   * @param miningID - Session ID
   * @param log - Log message content
   */
  "paramfinder:log": (miningID: string, log: string) => void;
}>;

export type BackendSDK = SDK<never, BackendEvents>;
