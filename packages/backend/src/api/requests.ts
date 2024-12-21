import { error, ok, Request, Result } from "shared";
import { BackendSDK } from "../types/types";
import { generateID } from "../util/helper";

export async function getRequest(
  sdk: BackendSDK,
  id: string,
): Promise<Result<Request>> {
  try {
    const requestResponse = await sdk.requests.get(id);
    if (!requestResponse) {
      return error("Request not found");
    }

    const spec = requestResponse.request.toSpec();

    const url = `${spec.getTls() ? "https" : "http"}://${spec.getHost()}:${spec.getPort()}${spec.getPath()}${spec.getQuery()}`;

    return ok({
      id: generateID(),
      host: spec.getHost(),
      port: spec.getPort(),
      url,
      path: spec.getPath(),
      query: spec.getQuery(),
      method: spec.getMethod(),
      headers: spec.getHeaders(),
      body: spec.getBody()?.toText() ?? "",
      tls: spec.getTls(),
      context: "discovery",
      raw: requestResponse.request.getRaw().toText(),
    } as Request);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}
