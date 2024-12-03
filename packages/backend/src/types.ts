import { DefineEvents, SDK } from "caido:plugin";

export type BackendEvents = DefineEvents<{}>;
export type CaidoBackendSDK = SDK<never, BackendEvents>;
