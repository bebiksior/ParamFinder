import { RequestResponse } from "@/requests";

export interface ParamMinerOptions {
  paramsLocation: ParamLocation;
}

export interface MiningProgress {
  completed: number;
  total: number;
}

export interface MiningResults {
  elapsedTime: number;
}

export interface MiningError {
  message: string;
  code?: number;
}

export interface ParamMinerEvents {
  onProgress: (progress: MiningProgress) => void;
  onFound: (parameter: FoundParameter) => void;
  onResponseReceived: (data: {
    parametersCount: number;
    requestResponse: RequestResponse;
    context: "discovery" | "narrower";
  }) => void;
  onComplete: (results: MiningResults) => void;
  onError: (error: MiningError) => void;
  onStateChange: (state: MiningSessionState) => void;
}

export type ParamLocation = "query" | "body" | "headers" | "cookie";

export interface FoundParameter extends Parameter {
  location: ParamLocation;
  responseImpact: string;
  evidence?: string;
}

export interface Parameter {
  name: string;
  value: string;
}

export interface Finding {
  parameter: FoundParameter;
  requestResponse: RequestResponse;
}

export interface RequestWithParameters {
  parametersCount: number;
  requestResponse: RequestResponse;
  context: "discovery" | "narrower";
}

export type MiningSession = {
  id: string;
  totalRequests: number;
  findings: Finding[];
  requests: RequestWithParameters[];
  state: MiningSessionState;
  error?: string;
  logs: string[];
};

export enum MiningSessionState {
  Pending = "pending",
  Running = "running",
  Completed = "completed",
  Error = "error",
  Paused = "paused",
  Canceled = "canceled",
  Timeout = "timeout",
}
