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

export type ParsedRequest = {
  path: string;
  query: string;
  method: string;
  headers: Record<string, Array<string>>;
  body: string;
};

/* Request parser */
export function parseRequest(raw: string): ParsedRequest {
  if (!raw.trim()) {
    return {
      path: "",
      method: "",
      headers: {},
      body: "",
      query: "",
    };
  }

  const lines = raw.split("\n");
  const firstLine = lines[0].trim();

  if (!firstLine) {
    return {
      path: "",
      method: "",
      headers: {},
      body: lines.slice(1).join("\n").trim(),
      query: "",
    };
  }

  const [method, fullPath] = firstLine.split(" ");

  if (!method || !fullPath) {
    throw new Error("Invalid request start-line");
  }

  const urlParts = fullPath.split("?");
  const path = urlParts[0];
  const query = urlParts[1] ?? "";

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

  const body = lines
    .slice(i + 1)
    .join("\n")
    .trim();

  return {
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
      port: portNumber,
    };
  }

  function getHost(url: string) {
    const urlObj = new URL(url);
    return urlObj.host.split(":")[0];
  }

  switch (location.hash) {
    case "#/automate":
    case "#/http-history": {
      const { innerText: historyRaw } = document.querySelector(
        "[data-language='http-request']"
      ) as HTMLElement;
      let historyUrl: string;
      const historyUrlElement = document.querySelector(
        ".c-request-header__label"
      );
      const automateUrlElement = document.querySelector(
        ".c-automate-session-toolbar__connection-info input"
      ) as HTMLInputElement;

      if (historyUrlElement) {
        historyUrl = (historyUrlElement as HTMLElement).innerText;
      } else if (automateUrlElement) {
        historyUrl = automateUrlElement.value;
      } else {
        throw new Error("Could not find URL element");
      }

      const { isTLS, port } = getPortAndTLS(historyUrl);

      return {
        raw: historyRaw,
        isTLS,
        port,
        host: getHost(historyUrl),
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
        host: getHost(replayUrl),
      };
    }

    default:
      console.error(`Can't obtain selected request from ${location.hash}`);
      throw new Error("Can't obtain selected request");
  }
}

export function formatTimeout(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds} milliseconds`;
  }

  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const remainingMilliseconds = milliseconds % 1000;

  const parts: string[] = [];

  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  }
  if (seconds > 0) {
    parts.push(`${seconds} second${seconds > 1 ? "s" : ""}`);
  }
  if (remainingMilliseconds > 0) {
    parts.push(`${remainingMilliseconds} milliseconds`);
  }

  return parts.join(" and ");
}

export function validateJSONBody(parsedRequest: any): boolean {
  try {
    if (!parsedRequest.body) return false;
    JSON.parse(parsedRequest.body);
    return true;
  } catch (e) {
    return false;
  }
}

export function printDebugData() {
  console.log("Debug Information:");
  console.log(`Current location hash: ${location.hash}`);
  console.log(`Current URL: ${window.location.href}`);
}
