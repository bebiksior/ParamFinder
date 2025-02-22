import { AnomalyType } from "./anomaly";
import { RequestResponse } from "./requests";
import { Finding } from "./sessions";

export interface ParamMinerEvents {
  onFinding: (finding: Finding) => void;
  onResponseReceived: (
    parametersSent: number,
    requestResponse: RequestResponse,
  ) => void;
  onComplete: () => void;
  onError: (error: MiningError) => void;
  onLogs: (logs: string) => void;
  onDebug: (debug: string) => void;
}

export type MiningError = {
  message: string;
};

export type AttackType = "query" | "body" | "headers" | "targeted";

export type ParamMinerConfig = {
  attackType: AttackType;
  learnRequestsCount: number;
  autoDetectMaxSize: boolean;
  maxQuerySize?: number;
  maxHeaderSize?: number;
  maxBodySize?: number;
  updateContentLength: boolean;
  autopilotEnabled: boolean;
  timeout: number;
  delayBetweenRequests: number;
  concurrency: number;
  performanceMode: boolean;
  wafDetection: boolean;
  additionalChecks: boolean;
  debug: boolean;
  ignoreAnomalyTypes: AnomalyType[];
};
