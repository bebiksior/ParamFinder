import { create } from "zustand";
import {
  MiningSession,
  MiningSessionState,
  Finding,
  RequestResponse,
  RequestContext,
} from "shared";

interface SessionsState {
  sessions: Record<string, MiningSession>;
  activeSessionId: string | null;
  newSession: (id: string, totalRequests: number) => string;
  addFinding: (id: string, finding: Finding) => void;
  addRequestResponse: (
    id: string,
    parametersSent: number,
    context: RequestContext,
    requestResponse?: RequestResponse
  ) => void;
  setActiveSession: (id: string | null) => void;
  deleteSession: (id: string) => void;
  updateSessionState: (id: string, sessionState: MiningSessionState) => void;
  addLog: (id: string, log: string) => void;
  updateSessionTotalRequests: (id: string, totalRequests: number) => void;
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: {},
  activeSessionId: null,

  newSession: (id: string, totalRequests: number) => {
    set((state) => ({
      sessions: {
        ...state.sessions,
        [id]: {
          id,
          findings: [],
          sentRequests: [],
          state: MiningSessionState.Pending,
          totalRequests,
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

  updateSessionTotalRequests: (id: string, totalRequests: number) => {
    set((state) => {
      const session = state.sessions[id];
      if (!session) return {};
      return {
        sessions: { ...state.sessions, [id]: { ...session, totalRequests } },
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

  updateSessionState: (id: string, sessionState: MiningSessionState) => {
    set((state) => {
      const session = state.sessions[id];
      if (!session) return {};
      return {
        sessions: {
          ...state.sessions,
          [id]: { ...session, state: sessionState },
        },
      };
    });
  },

  addRequestResponse: (
    id: string,
    parametersSent: number,
    context: RequestContext,
    requestResponse?: RequestResponse
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

  deleteSession: (id: string) => {
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
