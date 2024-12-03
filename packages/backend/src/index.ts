import { Body } from "caido:utils";
import { SDK, DefineAPI } from "caido:plugin";

export type { BackendEvents } from "./types";

export type API = DefineAPI<{
  generateNumber: typeof generateNumber;
}>;

function generateNumber(sdk: SDK, min: number, max: number): number {
  sdk.console.log(new Body("test"));
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function init(sdk: SDK<API>) {
  sdk.api.register("generateNumber", generateNumber);
}
