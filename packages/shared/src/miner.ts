import { RequestResponse } from "./requests";
import { Finding, MiningSessionState } from "./sessions";

export interface ParamMinerEvents {
  onFinding: (finding: Finding) => void;
  onResponseReceived: (
    parametersSent: number,
    requestResponse: RequestResponse
  ) => void;
  onComplete: () => void;
  onError: (error: MiningError) => void;
  onStateChange: (state: MiningSessionState) => void;
  onLogs: (logs: string) => void;
}

export type MiningError = {
  message: string;
};

export type AttackType = "query" | "body" | "headers";

export type ParamMinerConfig = {
  attackType: AttackType;
  learnRequestsCount: number;
  autoDetectMaxSize: boolean;
  maxSize?: number;
  maxQuerySize?: number;
  maxHeaderSize?: number;
  maxBodySize?: number;
  timeout: number;
  delayBetweenRequests: number;
  concurrency: number;
  performanceMode: boolean;
  wafDetection: boolean;
};
