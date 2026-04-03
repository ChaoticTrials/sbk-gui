import { create } from "zustand";
import type { SortColumn, ExtractDialogState, ContextMenuState, VerifyState } from "@/types";

interface UiStore {
  searchQuery: string;
  searchActive: boolean;
  coordSearchPaths: Set<string> | null;
  sortColumn: SortColumn;
  sortDir: "asc" | "desc";
  extractDialog: ExtractDialogState | null;
  propertiesEntry: string | null; // entry path
  contextMenu: ContextMenuState | null;
  errorMessage: string | null;
  verifyState: VerifyState | null;
  verifyDialogOpen: boolean;
  setVerifyState: (s: VerifyState | null) => void;
  setVerifyDialogOpen: (open: boolean) => void;
  setSearchQuery: (q: string) => void;
  setSearchActive: (a: boolean) => void;
  clearSearch: () => void;
  setCoordSearchPaths: (paths: Set<string> | null) => void;
  setSort: (col: SortColumn) => void;
  setExtractDialog: (s: ExtractDialogState | null) => void;
  setPropertiesEntry: (path: string | null) => void;
  setContextMenu: (ctx: ContextMenuState | null) => void;
  setError: (msg: string | null) => void;
}

export const useUiStore = create<UiStore>((set, get) => ({
  searchQuery: "",
  searchActive: false,
  coordSearchPaths: null,
  sortColumn: "name",
  sortDir: "asc",
  extractDialog: null,
  propertiesEntry: null,
  contextMenu: null,
  errorMessage: null,
  verifyState: null,
  verifyDialogOpen: false,
  setVerifyState: (s) => set({ verifyState: s }),
  setVerifyDialogOpen: (open) => set({ verifyDialogOpen: open }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchActive: (a) => set({ searchActive: a }),
  clearSearch: () => set({ searchQuery: "", searchActive: false }),
  setCoordSearchPaths: (paths) => set({ coordSearchPaths: paths }),
  setSort: (col) => {
    const { sortColumn, sortDir } = get();
    if (sortColumn === col) set({ sortDir: sortDir === "asc" ? "desc" : "asc" });
    else set({ sortColumn: col, sortDir: "asc" });
  },
  setExtractDialog: (s) => set({ extractDialog: s }),
  setPropertiesEntry: (path) => set({ propertiesEntry: path }),
  setContextMenu: (ctx) => set({ contextMenu: ctx }),
  setError: (msg) => set({ errorMessage: msg }),
}));
