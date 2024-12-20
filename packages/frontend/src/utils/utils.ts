import { FrontendSDK } from "@/types";
import { Result } from "shared";

export async function handleBackendCall<T>(
  promise: Promise<Result<T>>,
  sdk: FrontendSDK
) {
  const result = await promise;

  if (result.kind === "Error") {
    sdk?.window.showToast(result.error, {
      variant: "error",
    });
    throw new Error(result.error);
  }

  return result.value;
}

export const uint8ArrayToString = (uint8Array: Uint8Array | undefined) => {
  if (!uint8Array) return "";
  return new TextDecoder().decode(uint8Array);
};

/* Request parser */
export function parseRequest(raw: string): {
  host: string;
  path: string;
  query?: string;
  method: string;
  headers: Record<string, Array<string>>;
  body: string;
} {
  if (!raw.trim()) {
    return {
      host: "",
      path: "",
      method: "",
      headers: {},
      body: "",
    };
  }

  const lines = raw.split("\n");
  const firstLine = lines[0].trim();

  if (!firstLine) {
    return {
      host: "",
      path: "",
      method: "",
      headers: {},
      body: lines.slice(1).join("\n").trim(),
    };
  }

  const [method, fullPath] = firstLine.split(" ");

  if (!method || !fullPath) {
    throw new Error("Invalid request start-line");
  }

  const urlParts = fullPath.split("?");
  const path = urlParts[0];
  const query = urlParts[1];

  const headers: Record<string, Array<string>> = {};
  let i = 1;
  while (i < lines.length && lines[i].trim() !== "") {
    const headerLine = lines[i].trim();
    const [key, ...values] = headerLine.split(":");
    if (key && values.length > 0) {
      const value = values.join(":").trim();
      if (!headers[key]) {
        headers[key] = [];
      }
      headers[key].push(value);
    }
    i++;
  }

  const host = headers["Host"]?.[0] ?? "";
  const body = lines
    .slice(i + 1)
    .join("\n")
    .trim();

  return {
    host,
    path,
    ...(query && { query }),
    method,
    headers,
    body,
  };
}

/* ID generator */
export function generateID() {
  return Date.now().toString(36) + randomString(5);
}

/* random string generator */
export function randomString(length: number) {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function getSelectedRequest(sdk: FrontendSDK) {
  function getPortAndTLS(url: string) {
    const isSecure = url.startsWith("https://");
    let portNumber = isSecure ? 443 : 80;

    try {
      const urlObj = new URL(url);
      if (urlObj.port) {
        portNumber = parseInt(urlObj.port);
      }
    } catch {}

    return {
      isTLS: isSecure,
      port: portNumber
    };
  }

  switch (location.hash) {
    case "#/http-history": {
      const { innerText: historyRaw } = document.querySelector(
        "[data-language='http-request']"
      ) as HTMLElement;

      const { innerText: historyUrl } = document.querySelector(
        ".c-request-header__label"
      ) as HTMLElement;

      const { isTLS, port } = getPortAndTLS(historyUrl);

      return {
        raw: historyRaw,
        isTLS,
        port,
      };
    }

    case "#/replay": {
      const { value: replayUrl } = document.querySelector(
        ".c-replay-session-toolbar__connection-info input"
      ) as HTMLInputElement;

      const { innerText: replayRaw } = document.querySelector(
        "[data-language='http-request']"
      ) as HTMLElement;

      const { isTLS, port } = getPortAndTLS(replayUrl);

      return {
        raw: replayRaw,
        isTLS,
        port,
      };
    }

    default:
      console.error(`Can't obtain selected request from ${location.hash}`);
      throw new Error("Can't obtain selected request");
  }
}
