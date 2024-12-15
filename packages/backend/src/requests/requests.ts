import { SDK } from "caido:plugin";
import {
  RequestSpec,
  Response as CaidoResponse,
  Request as CaidoRequest,
} from "caido:utils";
import { Request, Response, RequestResponse } from "shared";

/**
 * Send a request via Caido SDK and convert the response to our type
 */
export async function sendRequest(
  sdk: SDK,
  request: Request
): Promise<RequestResponse> {
  const requestSpec = toRequestSpec(request);
  const caidoResponse = await sdk.requests.send(requestSpec);

  return {
    request: toRequest(request, caidoResponse.request),
    response: toResponse(request, caidoResponse.response),
  };
}

function toRequestSpec(request: Request): RequestSpec {
  const spec = new RequestSpec(request.url);
  spec.setTls(request.tls);
  spec.setHost(request.host);
  spec.setPort(request.port);
  spec.setMethod(request.method);
  spec.setPath(request.path);

  if (request.query) {
    spec.setQuery(request.query);
  }

  Object.entries(request.headers).forEach(([header, values]) => {
    values.forEach((value) => {
      spec.setHeader(header, value);
    });
  });

  if (request.body) {
    spec.setBody(request.body);
  }

  return spec;
}

/**
 * Convert a Caido request to our request type
 */
function toRequest(originalRequest: Request, request: CaidoRequest): Request {
  return {
    id: originalRequest.id,
    context: originalRequest.context,

    host: request.getHost(),
    port: request.getPort(),
    url: request.getUrl(),
    path: request.getPath(),
    query: request.getQuery(),
    method: request.getMethod(),
    headers: request.getHeaders(),
    body: request.getBody()?.toText() ?? "",
    tls: request.getTls(),
    raw: request.getRaw().toText(),
  };
}

/**
 * Convert a Caido response to our response type
 */
function toResponse(
  originalRequest: Request,
  response: CaidoResponse
): Response {
  return {
    requestID: originalRequest.id,

    status: response.getCode(),
    headers: response.getHeaders(),
    body: response.getBody()?.toText(),
    raw: response.getRaw().toText(),
    time: response.getRoundtripTime(),
  };
}
