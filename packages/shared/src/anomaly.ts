export interface ResponseFactors {
    bodyStable: boolean;
    reflectionStable: boolean;

    reflectionsCount: number;
    statusCode: number;
    unstableHeaders: Set<string>
    redirect?: string;
}

export type StableFactors = ResponseFactors & {
  bodyStable: boolean;
  statusCodeStable: boolean;
  reflectionStable: boolean;
  headersStable: boolean;
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
  Reflection = "reflection",
  Body = "body",
  Redirect = "redirect",
}
