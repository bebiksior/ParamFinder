import { create } from "zustand";
import {
  MiningSession,
  MiningSessionState,
  Finding,
  RequestResponse,
  RequestContext,
  MiningSessionPhase,
} from "shared";
import { FrontendSDK } from "@/types";

interface SessionsState {
  sessions: Record<string, MiningSession>;
  activeSessionId: string | null;
  newSession: (
    id: string,
    totalParametersAmount: number,
    totalLearnRequests: number,
  ) => string;
  addFinding: (id: string, finding: Finding) => void;
  addRequestResponse: (
    id: string,
    parametersSent: number,
    context: RequestContext,
    requestResponse?: RequestResponse,
  ) => void;
  setActiveSession: (id: string | null) => void;
  deleteSession: (id: string, sdk: FrontendSDK) => void;
  updateSessionState: (
    id: string,
    sessionState: MiningSessionState,
    phase: MiningSessionPhase,
  ) => void;
  addLog: (id: string, log: string) => void;
  updateTotalParametersAmount: (miningID: string, newAmount: number) => void;
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: {},
  activeSessionId: null,

  newSession: (
    id: string,
    totalParametersAmount: number,
    totalLearnRequests: number,
  ) => {
    set((state) => ({
      sessions: {
        ...state.sessions,
        [id]: {
          id,
          findings: [],
          sentRequests: [],
          state: MiningSessionState.Pending,
          phase: MiningSessionPhase.Idle,
          totalParametersAmount,
          totalLearnRequests,
          logs: [],
        },
      },
      activeSessionId: id,
    }));
    return id;
  },

  addLog: (id: string, log: string) => {
    set((state) => {
      const session = state.sessions[id];
      if (!session) return {};
      return {
        sessions: {
          ...state.sessions,
          [id]: { ...session, logs: [...session.logs, log] },
        },
      };
    });
  },

  addFinding: (id: string, finding: Finding) => {
    set((state) => {
      const session = state.sessions[id];
      if (!session) return {};
      return {
        sessions: {
          ...state.sessions,
          [id]: {
            ...session,
            findings: [...session.findings, finding],
          },
        },
      };
    });
  },

  updateSessionState: (
    id: string,
    sessionState: MiningSessionState,
    sessionPhase?: MiningSessionPhase,
  ) => {
    set((state) => {
      const session = state.sessions[id];
      if (!session) return {};
      return {
        sessions: {
          ...state.sessions,
          [id]: {
            ...session,
            state: sessionState,
            phase: sessionPhase ?? session.phase,
          },
        },
      };
    });
  },

  updateTotalParametersAmount: (miningID: string, newAmount: number) => {
    set((state) => {
      const session = state.sessions[miningID];
      if (!session) return {};
      return {
        sessions: {
          ...state.sessions,
          [miningID]: {
            ...session,
            totalParametersAmount: newAmount,
          },
        },
      };
    });
  },

  addRequestResponse: (
    id: string,
    parametersSent: number,
    context: RequestContext,
    requestResponse?: RequestResponse,
  ) => {
    set((state) => {
      const session = state.sessions[id];
      if (!session) return {};

      return {
        sessions: {
          ...state.sessions,
          [id]: {
            ...session,
            sentRequests: [
              ...session.sentRequests,
              { parametersSent, context, requestResponse },
            ],
          },
        },
      };
    });
  },

  setActiveSession: (id: string | null) => {
    set({ activeSessionId: id });
  },

  deleteSession: (id: string, sdk: FrontendSDK) => {
    sdk.backend.cancelMining(id);
    set((state) => {
      const { [id]: _, ...sessions } = state.sessions;
      return {
        sessions,
        activeSessionId:
          state.activeSessionId === id ? null : state.activeSessionId,
      };
    });
  },
}));
