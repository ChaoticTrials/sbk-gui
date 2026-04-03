import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavStore } from "@/store/useNavStore";
import { useSelectionStore } from "@/store/useSelectionStore";
import { useUiStore } from "@/store/useUiStore";
import { useArchiveStore } from "@/store/useArchiveStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { listDir } from "@/utils/virtualFs";
import { buildPatterns } from "@/utils/patterns";

export function useKeyboard() {
  const { navigateUp, currentPath } = useNavStore();
  const { selected, selectAll, clearSelection } = useSelectionStore();
  const { setPropertiesEntry, setContextMenu } = useUiStore();
  const tree = useArchiveStore((s) => s.tree);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ignore when typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        navigateUp();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        if (tree) {
          const rows = listDir(tree, currentPath);
          selectAll(rows.map((r) => r.path));
        }
      }
      if (e.key === "Escape") {
        clearSelection();
        setContextMenu(null);
      }
      if (e.altKey && e.key === "Enter") {
        e.preventDefault();
        const first = Array.from(selected)[0];
        if (first) setPropertiesEntry(first);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        const { info, entries } = useArchiveStore.getState();
        const { selected: sel } = useSelectionStore.getState();
        const { setExtractDialog } = useUiStore.getState();
        const { prettifyJson, flatExtract, extractThreads } = useSettingsStore.getState();
        const stripPrefix = flatExtract ? useNavStore.getState().currentPath.join("/") : "";
        if (!info || sel.size === 0) return;
        const dest = info.path.replace(/[/\\][^/\\]+$/, "");
        const patterns = buildPatterns(Array.from(sel), entries);
        setExtractDialog({ phase: "running" });
        invoke<number>("extract_files", { patterns, outputDir: dest, threads: extractThreads, prettifyJson, stripPrefix })
          .then((count) => setExtractDialog({ phase: "done", count, dest }))
          .catch((err) => {
            if (String(err).includes("cancelled")) {
              setExtractDialog(null);
            } else {
              setExtractDialog({ phase: "error", message: String(err) });
            }
          });
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigateUp, tree, currentPath, selected, selectAll, clearSelection]);
}
