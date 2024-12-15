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
};
