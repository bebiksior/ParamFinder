import { SDK } from "caido:plugin";
import {
  RequestSpec,
  RequestResponse as CaidoRequestResponse,
} from "caido:utils";
import { Request, Response, RequestResponse, RequestWithRaw } from "shared";
import { randomString } from "../util/helper";

/**
 * Convert a Caido Request to our Request type
 */
function convertRequest(request: CaidoRequestResponse["request"]): RequestWithRaw {
  return {
    host: request.getHost(),
    port: request.getPort(),
    tls: request.getTls(),
    method: request.getMethod(),
    path: request.getPath(),
    query: request.getQuery(),
    url: request.getUrl(),
    headers: request.getHeaders(),
    body: request.getBody()?.toText(),
    raw: request.getRaw().toText(),
  };
}

/**
 * Convert a Caido Response to our Response type
 */
function convertResponse(response: CaidoRequestResponse["response"]): Response {
  return {
    status: response.getCode(),
    headers: response.getHeaders(),
    body: response.getBody()?.toText() || "",
    raw: response.getRaw().toText(),
  };
}

/**
 * Convert our Request type to a Caido RequestSpec
 */
function convertRequestSpec(request: Request): RequestSpec {
  const spec = new RequestSpec(request.url);
  spec.setTls(request.tls);
  spec.setHost(request.host);
  spec.setPort(request.port);
  spec.setMethod(request.method);
  spec.setPath(request.path);
  spec.setQuery(request.query);

  Object.entries(request.headers).forEach(([header, values]) => {
    values.forEach(value => {
      spec.setHeader(header, value);
    });
  });

  if (request.body) {
    spec.setBody(request.body);
  }

  return spec;
}

/**
 * Send a request via Caido SDK and convert the response to our type
 */
export async function sendRequest(
  sdk: SDK,
  request: Request
): Promise<RequestResponse> {
  const convertedRequest = convertRequestSpec(request);
  const caidoResponse = await sdk.requests.send(convertedRequest);

  return {
    id: randomString(16),
    request: convertRequest(caidoResponse.request),
    response: convertResponse(caidoResponse.response),
  };
}
