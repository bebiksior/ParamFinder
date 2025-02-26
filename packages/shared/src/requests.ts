export interface Request {
  id: string;

  host: string;
  port: number;
  url: string;
  path: string;
  query: string;
  method: string;
  headers: Record<string, Array<string>>;
  body: string;
  tls: boolean;
  context: RequestContext;
  raw: string;
}

export type RequestContext =
  | "discovery"
  | "narrower"
  | "learning"
  | "autopilot";

export interface Response {
  requestID: string;

  status: number;
  headers: Record<string, Array<string>>;
  body: string | undefined;
  time: number;
  raw: string;
}

export type Parameter = {
  name: string;
  value: string;
};

export type RequestResponse = {
  request: Request;
  response: Response;
};
