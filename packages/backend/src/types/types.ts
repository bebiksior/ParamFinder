import { DefineEvents, SDK } from "caido:plugin";
import {
  Finding,
  MiningSessionState,
  RequestContext,
  RequestResponse,
} from "shared";

export type BackendEvents = DefineEvents<{
  "paramfinder:new": (miningID: string, totalRequests: number) => void;
  "paramfinder:adjust": (miningID: string, totalRequests: number) => void;
  "paramfinder:complete": (miningID: string) => void;
  "paramfinder:progress": (
    miningID: string,
    parametersSent: number,
    context: RequestContext,
    requestResponse?: RequestResponse,
  ) => void;
  "paramfinder:new_finding": (
    miningID: string,
    finding: Finding,
  ) => void;
  "paramfinder:error": (miningID: string, error: string) => void;
  "paramfinder:state": (miningID: string, state: MiningSessionState) => void;
  "paramfinder:log": (miningID: string, log: string) => void;
}>;
export type CaidoBackendSDK = SDK<never, BackendEvents>;
