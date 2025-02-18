import { AnomalyType } from "./anomaly";

export type Settings = {
  delay: number; // delay between requests in milliseconds
  concurrency: number; // number of concurrent requests
  timeout: number; // timeout for requests in milliseconds
  autoDetectMaxSize: boolean;
  maxQuerySize?: number;
  maxHeaderSize?: number;
  maxBodySize?: number;
  performanceMode: boolean;
  learnRequestsCount: number;
  wafDetection: boolean;
  additionalChecks: boolean;
  debug: boolean;
  autopilotEnabled: boolean;
  updateContentLength: boolean;
  ignoreAnomalyTypes: AnomalyType[];
};
