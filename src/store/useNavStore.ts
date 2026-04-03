import { create } from "zustand";

interface NavStore {
  currentPath: string[];
  historyBack: string[][];
  historyFwd: string[][];
  navigateTo: (path: string[]) => void;
  navigateUp: () => void;
  navigateBack: () => void;
  navigateFwd: () => void;
  reset: () => void;
}

export const useNavStore = create<NavStore>((set, get) => ({
  currentPath: [],
  historyBack: [],
  historyFwd: [],
  navigateTo: (path) => {
    const { currentPath, historyBack } = get();
    set({ currentPath: path, historyBack: [...historyBack, currentPath], historyFwd: [] });
  },
  navigateUp: () => {
    const { currentPath, historyBack } = get();
    if (currentPath.length === 0) return;
    const parent = currentPath.slice(0, -1);
    set({ currentPath: parent, historyBack: [...historyBack, currentPath], historyFwd: [] });
  },
  navigateBack: () => {
    const { historyBack, currentPath, historyFwd } = get();
    if (historyBack.length === 0) return;
    const prev = historyBack[historyBack.length - 1];
    set({
      currentPath: prev,
      historyBack: historyBack.slice(0, -1),
      historyFwd: [currentPath, ...historyFwd],
    });
  },
  navigateFwd: () => {
    const { historyFwd, currentPath, historyBack } = get();
    if (historyFwd.length === 0) return;
    const next = historyFwd[0];
    set({
      currentPath: next,
      historyFwd: historyFwd.slice(1),
      historyBack: [...historyBack, currentPath],
    });
  },
  reset: () => set({ currentPath: [], historyBack: [], historyFwd: [] }),
}));
