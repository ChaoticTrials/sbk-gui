import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { ArchiveInfo, EntryInfo, OpenArchiveResult } from "@/types";
import { buildTree } from "@/utils/virtualFs";
import type { VirtualDir } from "@/utils/virtualFs";
import { useUiStore } from "./useUiStore";

interface ArchiveStore {
  info: ArchiveInfo | null;
  entries: EntryInfo[];
  tree: VirtualDir | null;
  openArchive: (path: string) => Promise<void>;
  closeArchive: () => void;
}

export const useArchiveStore = create<ArchiveStore>((set) => ({
  info: null,
  entries: [],
  tree: null,
  openArchive: async (path: string) => {
    const result = await invoke<OpenArchiveResult>("open_archive", { path });
    set({
      info: result.info,
      entries: result.entries,
      tree: buildTree(result.entries),
    });
    // Kick off background verification immediately; do not block the UI.
    useUiStore.getState().setVerifyState("running");
    invoke<boolean>("verify_archive")
      .then((ok) => {
        // Discard result if the archive was closed before verification finished.
        if (useArchiveStore.getState().info !== null) {
          useUiStore.getState().setVerifyState({ ok });
        }
      })
      .catch((e) => {
        if (useArchiveStore.getState().info !== null) {
          useUiStore.getState().setVerifyState({ error: String(e) });
        }
      });
  },
  closeArchive: () => {
    invoke("close_archive").catch(() => {});
    set({ info: null, entries: [], tree: null });
    useUiStore.getState().setVerifyState(null);
    useUiStore.getState().setVerifyDialogOpen(false);
  },
}));
