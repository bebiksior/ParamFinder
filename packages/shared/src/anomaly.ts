export interface ResponseFactors {
    bodyStable: boolean;
    reflectionStable: boolean;

    reflectionsCount: number;
    statusCode: number;
    unstableHeaders: Set<string>
    redirect?: string;
    similarity: number;
}

export type StableFactors = ResponseFactors & {
  bodyStable: boolean;
  statusCodeStable: boolean;
  reflectionStable: boolean;
  headersStable: boolean;
  similarityStable: boolean;
  redirectStable: boolean;
};

export type Anomaly = {
    type: AnomalyType;
    which?: string;
    from?: string;
    to?: string;
}

export enum AnomalyType {
  StatusCode = "status-code",
  Headers = "headers",
  ReflectionCount = "reflection_count",
  Body = "body",
  Redirect = "redirect",
  Similarity = "similarity",
}
