import { AnomalyType } from "./anomaly";
import { Parameter, RequestContext, RequestResponse } from "./requests";

export enum MiningSessionState {
  Pending = "pending",
  Learning = "learning",
  Running = "running",
  Completed = "completed",
  Error = "error",
  Paused = "paused",
  Canceled = "canceled",
  Timeout = "timeout",
}

export interface MiningSession {
  id: string;
  state: MiningSessionState;
  sentRequests: {
    parametersSent: number;
    context: RequestContext;
    requestResponse?: RequestResponse;
  }[];
  findings: Finding[];
  logs: string[];
  totalRequests: number;
}

export type Finding = {
  requestResponse: RequestResponse;
  parameter: Parameter;
  anomalyType: AnomalyType;
};
