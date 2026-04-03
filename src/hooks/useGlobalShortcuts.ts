import { useEffect } from "react";
import { useArchiveStore } from "@/store/useArchiveStore";
import { useNavStore } from "@/store/useNavStore";
import { useSelectionStore } from "@/store/useSelectionStore";

export function useGlobalShortcuts() {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        import("@tauri-apps/plugin-dialog").then(({ open }) => {
          open({ filters: [{ name: "SBK Archive", extensions: ["sbk"] }] }).then((path) => {
            if (path) useArchiveStore.getState().openArchive(path as string);
          });
        });
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        const { info, closeArchive } = useArchiveStore.getState();
        if (info) {
          closeArchive();
          useNavStore.getState().reset();
          useSelectionStore.getState().clearSelection();
        }
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
