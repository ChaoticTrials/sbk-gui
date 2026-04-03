import { create } from "zustand";
import type { SelectMode } from "@/types";

interface SelectionStore {
  selected: Set<string>;
  lastSelected: string | null;
  select: (path: string, mode: SelectMode, allPaths?: string[]) => void;
  selectAll: (paths: string[]) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  selected: new Set(),
  lastSelected: null,
  select: (path, mode, allPaths = []) => {
    const { selected, lastSelected } = get();
    if (mode === "single") {
      set({ selected: new Set([path]), lastSelected: path });
    } else if (mode === "toggle") {
      const next = new Set(selected);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      set({ selected: next, lastSelected: path });
    } else if (mode === "range" && lastSelected && allPaths.length > 0) {
      const startIdx = allPaths.indexOf(lastSelected);
      const endIdx = allPaths.indexOf(path);
      if (startIdx === -1 || endIdx === -1) {
        set({ selected: new Set([path]), lastSelected: path });
      } else {
        const [lo, hi] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        const rangeSet = new Set(allPaths.slice(lo, hi + 1));
        set({ selected: rangeSet, lastSelected: path });
      }
    }
  },
  selectAll: (paths) => set({ selected: new Set(paths), lastSelected: null }),
  clearSelection: () => set({ selected: new Set(), lastSelected: null }),
}));
