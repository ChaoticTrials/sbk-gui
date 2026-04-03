import { create } from "zustand";
import { LazyStore } from "@tauri-apps/plugin-store";

const store = new LazyStore("settings.json");

const DEFAULT_COLUMN_WIDTHS = { name: 340, type: 60, size: 90, modified: 150, coords: 190 };

interface SettingsStore {
  // Persisted settings
  prettifyJson: boolean;
  searchGlobal: boolean;
  flatExtract: boolean;
  columnWidths: Record<string, number>;
  uiScale: number;
  extractThreads: number;
  // UI state (not persisted)
  settingsOpen: boolean;
  loaded: boolean;
  // Actions
  loadSettings: () => Promise<void>;
  setPrettifyJson: (v: boolean) => Promise<void>;
  setSearchGlobal: (v: boolean) => Promise<void>;
  setFlatExtract: (v: boolean) => Promise<void>;
  setColumnWidth: (col: string, width: number) => void;
  saveColumnWidths: () => Promise<void>;
  setUiScale: (v: number) => Promise<void>;
  setExtractThreads: (v: number) => Promise<void>;
  setSettingsOpen: (v: boolean) => void;
  resetSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  prettifyJson: false,
  searchGlobal: false,
  flatExtract: false,
  columnWidths: { ...DEFAULT_COLUMN_WIDTHS },
  uiScale: 1.0,
  extractThreads: 0,
  settingsOpen: false,
  loaded: false,

  loadSettings: async () => {
    const prettifyJson = (await store.get<boolean>("prettifyJson")) ?? false;
    const searchGlobal = (await store.get<boolean>("searchGlobal")) ?? false;
    const flatExtract = (await store.get<boolean>("flatExtract")) ?? false;
    const storedWidths = (await store.get<Record<string, number>>("columnWidths")) ?? {};
    const columnWidths = { ...DEFAULT_COLUMN_WIDTHS, ...storedWidths };
    const rawScale = (await store.get<number>("uiScale")) ?? 1.0;
    const uiScale = Number.isFinite(rawScale) ? Math.min(3.0, Math.max(0.75, rawScale)) : 1.0;
    const extractThreads = (await store.get<number>("extractThreads")) ?? 0;
    set({ prettifyJson, searchGlobal, flatExtract, columnWidths, uiScale, extractThreads, loaded: true });
  },

  setPrettifyJson: async (v) => {
    set({ prettifyJson: v });
    await store.set("prettifyJson", v);
    await store.save();
  },

  setSearchGlobal: async (v) => {
    set({ searchGlobal: v });
    await store.set("searchGlobal", v);
    await store.save();
  },

  setFlatExtract: async (v) => {
    set({ flatExtract: v });
    await store.set("flatExtract", v);
    await store.save();
  },

  setColumnWidth: (col, width) => {
    set((s) => ({ columnWidths: { ...s.columnWidths, [col]: width } }));
  },

  saveColumnWidths: async () => {
    const { columnWidths } = get();
    await store.set("columnWidths", columnWidths);
    await store.save();
  },

  setUiScale: async (v) => {
    const clamped = Math.min(3.0, Math.max(0.75, v));
    set({ uiScale: clamped });
    await store.set("uiScale", clamped);
    await store.save();
  },

  setExtractThreads: async (v) => {
    set({ extractThreads: v });
    await store.set("extractThreads", v);
    await store.save();
  },

  setSettingsOpen: (v) => set({ settingsOpen: v }),

  resetSettings: async () => {
    const defaults = {
      prettifyJson: false,
      searchGlobal: false,
      flatExtract: false,
      columnWidths: { ...DEFAULT_COLUMN_WIDTHS },
      uiScale: 1.0,
      extractThreads: 0,
    };
    set(defaults);
    for (const [k, v] of Object.entries(defaults)) {
      await store.set(k, v);
    }
    await store.save();
  },
}));
