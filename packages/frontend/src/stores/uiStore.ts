import { create } from 'zustand';

export const VIEW_CATEGORIES = {
  FINDINGS: "findings",
  REQUESTS: "requests",
} as const;

export type ViewCategory = (typeof VIEW_CATEGORIES)[keyof typeof VIEW_CATEGORIES];

interface SessionsUIState {
  selectedRequestId: string | null;
  activeCategory: ViewCategory;
}

interface UIStore extends SessionsUIState {
  setSelectedRequest: (requestId: string | null) => void;
  setActiveCategory: (category: ViewCategory) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  selectedRequestId: null,
  activeCategory: VIEW_CATEGORIES.FINDINGS,

  setSelectedRequest: (requestId) => {
    set({ selectedRequestId: requestId });
  },

  setActiveCategory: (category) => {
    set({ activeCategory: category });
  },
}));
