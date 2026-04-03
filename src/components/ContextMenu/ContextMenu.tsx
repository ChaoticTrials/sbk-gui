import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useUiStore } from "@/store/useUiStore";
import { useSelectionStore } from "@/store/useSelectionStore";
import { useArchiveStore } from "@/store/useArchiveStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useNavStore } from "@/store/useNavStore";
import { buildPatterns } from "@/utils/patterns";
import { t } from "@/i18n";
import styles from "./ContextMenu.module.css";

export function ContextMenu() {
  const { contextMenu, setContextMenu, setExtractDialog, setPropertiesEntry, setError } = useUiStore();
  const { uiScale } = useSettingsStore();
  const selected = useSelectionStore((s) => s.selected);
  const entries = useArchiveStore((s) => s.entries);
  const info = useArchiveStore((s) => s.info);
  const prettifyJson = useSettingsStore((s) => s.prettifyJson);
  const extractThreads = useSettingsStore((s) => s.extractThreads);
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (!contextMenu || !menuRef.current) return;
    const { offsetWidth, offsetHeight } = menuRef.current;
    // contextMenu.x/y are raw clientX/clientY — zoom is on a div wrapper, not html,
    // so coordinates are already in viewport CSS pixels. No zoom division needed.
    const x = Math.min(contextMenu.x / uiScale, window.innerWidth - offsetWidth - 4);
    const y = Math.min(contextMenu.y / uiScale, window.innerHeight - offsetHeight - 4);
    setAdjustedPos({ x, y });
  }, [contextMenu]);

  useEffect(() => {
    if (!contextMenu) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    function keyHandler(e: KeyboardEvent) {
      if (e.key === "Escape") setContextMenu(null);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [contextMenu]);

  if (!contextMenu) return null;

  const selectedPaths = Array.from(selected);
  const firstEntry = entries.find((e) => e.path === selectedPaths[0]);
  const isSingleFile = selected.size === 1 && firstEntry;

  async function handleExtractSelected() {
    setContextMenu(null);
    const dest = await openDialog({ directory: true, title: "Extract to..." });
    if (!dest) return;
    const patterns = selectedPaths.length > 0 ? buildPatterns(selectedPaths, entries) : ["**"];
    const { flatExtract } = useSettingsStore.getState();
    const stripPrefix = flatExtract ? useNavStore.getState().currentPath.join("/") : "";
    setExtractDialog({ phase: "running" });
    try {
      const count = await invoke<number>("extract_files", {
        patterns,
        outputDir: dest as string,
        threads: extractThreads,
        prettifyJson,
        stripPrefix,
      });
      setExtractDialog({ phase: "done", count, dest: dest as string });
    } catch (e) {
      if (String(e).includes("cancelled")) {
        setExtractDialog(null);
        return;
      }
      setExtractDialog({ phase: "error", message: String(e) });
    }
  }

  async function handleExtractAll() {
    setContextMenu(null);
    const dest = await openDialog({ directory: true, title: "Extract all to..." });
    if (!dest) return;
    const { flatExtract } = useSettingsStore.getState();
    const stripPrefix = flatExtract ? useNavStore.getState().currentPath.join("/") : "";
    setExtractDialog({ phase: "running" });
    try {
      const count = await invoke<number>("extract_files", {
        patterns: ["**"],
        outputDir: dest as string,
        threads: extractThreads,
        prettifyJson,
        stripPrefix,
      });
      setExtractDialog({ phase: "done", count, dest: dest as string });
    } catch (e) {
      if (String(e).includes("cancelled")) {
        setExtractDialog(null);
        return;
      }
      setExtractDialog({ phase: "error", message: String(e) });
    }
  }

  async function handleQuickExtract() {
    setContextMenu(null);
    if (!info) return;
    const dest = info.path.replace(/[/\\][^/\\]+$/, "");
    const patterns = selectedPaths.length > 0 ? buildPatterns(selectedPaths, entries) : ["**"];
    const { flatExtract } = useSettingsStore.getState();
    const stripPrefix = flatExtract ? useNavStore.getState().currentPath.join("/") : "";
    setExtractDialog({ phase: "running" });
    try {
      const count = await invoke<number>("extract_files", {
        patterns,
        outputDir: dest,
        threads: extractThreads,
        prettifyJson,
        stripPrefix,
      });
      setExtractDialog({ phase: "done", count, dest });
    } catch (e) {
      if (String(e).includes("cancelled")) {
        setExtractDialog(null);
        return;
      }
      setExtractDialog({ phase: "error", message: String(e) });
    }
  }

  async function handleOpenInApp() {
    setContextMenu(null);
    if (!firstEntry) return;
    document.body.style.cursor = "wait";
    try {
      await invoke("open_file_in_app", { entryPath: firstEntry.path, threads: 0, prettifyJson });
    } catch (e) {
      setError(String(e));
    } finally {
      document.body.style.cursor = "";
    }
  }

  async function handleCopyPath() {
    setContextMenu(null);
    await navigator.clipboard.writeText(selectedPaths.join("\n"));
  }

  function handleProperties() {
    setContextMenu(null);
    if (selectedPaths[0]) setPropertiesEntry(selectedPaths[0]);
  }

  return createPortal(
    <div ref={menuRef} className={styles.menu} style={{ left: adjustedPos.x, top: adjustedPos.y }}>
      {selected.size > 0 && <button onClick={handleExtractSelected}>{t("extractSelected")}</button>}
      {selected.size > 0 && <button onClick={handleQuickExtract}>{t("quickExtract")}</button>}
      <button onClick={handleExtractAll}>{t("extractAll")}</button>
      {isSingleFile && (
        <>
          <hr className={styles.sep} />
          <button onClick={handleOpenInApp}>{t("openInApp")}</button>
        </>
      )}
      <hr className={styles.sep} />
      {selected.size > 0 && <button onClick={handleCopyPath}>{t("copyPath")}</button>}
      <hr className={styles.sep} />
      {selected.size > 0 && <button onClick={handleProperties}>{t("properties")}</button>}
    </div>,
    document.body,
  );
}
