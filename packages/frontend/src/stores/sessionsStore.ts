import { map, atom, computed } from "nanostores";
import { Finding, MiningSessionState, Parameter, RequestResponse } from "shared";
import { MiningSession } from "shared";

export const VIEW_CATEGORIES = {
  FINDINGS: "findings",
  REQUESTS: "requests",
} as const;

export type ViewCategory = typeof VIEW_CATEGORIES[keyof typeof VIEW_CATEGORIES];

interface SessionsUIState {
  selectedRequestId: string | null;
  activeCategory: ViewCategory;
}

export const sessions = map<Record<string, MiningSession>>({});
export const activeSessionId = atom<string | null>(null);
export const sessionsUIState = atom<SessionsUIState>({
  selectedRequestId: null,
  activeCategory: VIEW_CATEGORIES.FINDINGS,
});

export const miningSessionStore = {
  sessions,
  activeSessionId,
  uiState: sessionsUIState,

  newSession: (id: string, totalRequests: number): string => {
    sessions.setKey(id, {
      id,
      findings: [],
      requests: [],
      state: MiningSessionState.Pending,
      totalRequests,
      logs: [],
    });
    activeSessionId.set(id);
    return id;
  },

  updateSessionState: (id: string, state: MiningSessionState) => {
    const session = sessions.get()[id];
    if (session) {
      sessions.setKey(id, { ...session, state });
    }
  },

  addFinding: (id: string, finding: Finding) => {
    const session = sessions.get()[id];
    if (session) {
      sessions.setKey(id, {
        ...session,
        findings: [...session.findings, finding],
      });
    }
  },

  addLog: (id: string, log: string) => {
    const session = sessions.get()[id];
    if (session) {
      sessions.setKey(id, { ...session, logs: [...session.logs, log] });
    }
  },

  addRequestResponse: (
    id: string,
    parametersCount: number,
    requestResponse: RequestResponse,
    context: "discovery" | "narrower",
  ) => {
    const session = sessions.get()[id];
    if (session) {
      sessions.setKey(id, {
        ...session,
        requests: [
          ...session.requests,
          {
            parametersCount,
            requestResponse,
            context,
          },
        ],
      });
    }
  },

  getRequest: (sessionId: string, requestId: string) => {
    const session = sessions.get()[sessionId];
    if (!session) return null;

    const request = session.requests.find((request) => request.requestResponse.id === requestId);
    if (request) return request;

    return session.findings.find((finding) => finding.requestResponse.id === requestId);
  },

  setActiveSession: (id: string) => {
    const session = sessions.get()[id];
    if (!session) return;

    activeSessionId.set(id);
  },

  getActiveSession: () => {
    const id = activeSessionId.get();
    return id ? sessions.get()[id] : null;
  },

  deleteSession: (id: string) => {
    const currentSessions = { ...sessions.get() };
    delete currentSessions[id];
    sessions.set(currentSessions);
    if (activeSessionId.get() === id) {
      activeSessionId.set(null);
    }

    if (sessionsUIState.get().selectedRequestId === id) {
      sessionsUIState.set({
        ...sessionsUIState.get(),
        selectedRequestId: null,
      });
    }
  },

  setSelectedRequest: (requestId: string | null) => {
    sessionsUIState.set({
      ...sessionsUIState.get(),
      selectedRequestId: requestId,
    });
  },

  setActiveCategory: (category: ViewCategory) => {
    sessionsUIState.set({
      ...sessionsUIState.get(),
      activeCategory: category,
    });
  },

  getSession: (sessionId: string | null) =>
    computed(miningSessionStore.sessions, (sessions) =>
      sessionId ? sessions[sessionId] : undefined
    )
};
