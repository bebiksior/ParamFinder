export interface RequestWithRaw extends Request {
  raw: string | Uint8Array;
}

export interface RequestResponse {
  id: string;
  request: RequestWithRaw;
  response: Response;
}

export interface Request {
  host: string;
  port: number;
  tls: boolean;
  method: string;
  path: string;
  query: string;
  url: string;
  headers: Record<string, Array<string>>;
  body: string | undefined;
}

export interface Response {
  status: number;
  headers: Record<string, Array<string>>;
  body: string;
  raw: string;
}
