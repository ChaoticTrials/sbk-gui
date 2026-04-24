import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useArchiveStore } from "./store/useArchiveStore";
import { useSettingsStore } from "./store/useSettingsStore";
import { EmptyState } from "./components/EmptyState/EmptyState";
import { ArchiveView } from "./components/ArchiveView/ArchiveView";
import { SettingsDialog } from "./components/SettingsDialog/SettingsDialog";
import { ExtractHereView } from "./components/ExtractHereView/ExtractHereView";
import { useMouseButtons } from "./hooks/useMouseButtons";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";

export default function App() {
  const info = useArchiveStore((s) => s.info);
  const { loadSettings, uiScale } = useSettingsStore();
  const settingsOpen = useSettingsStore((s) => s.settingsOpen);
  const [previewScale, setPreviewScale] = useState(uiScale);
  const [extractHerePath, setExtractHerePath] = useState<string | null | undefined>(undefined);
  useMouseButtons();
  useGlobalShortcuts();

  useEffect(() => {
    invoke<string | null>("get_extract_here_path").then((path) => {
      setExtractHerePath(path);
      if (!path) {
        // Normal mode: load settings and open CLI-provided archive
        loadSettings();
        invoke<string | null>("get_cli_path").then((cliPath) => {
          if (cliPath) useArchiveStore.getState().openArchive(cliPath);
        });
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--ui-scale", String(previewScale));
  }, [previewScale]);

  useEffect(() => {
    setPreviewScale(uiScale);
  }, [uiScale]);

  useEffect(() => {
    const suppress = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", suppress);
    return () => document.removeEventListener("contextmenu", suppress);
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const current = useSettingsStore.getState().uiScale;
      const next = Math.round(Math.min(3.0, Math.max(0.75, current + delta)) * 100) / 100;
      useSettingsStore.getState().setUiScale(next);
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // Still detecting mode
  if (extractHerePath === undefined) return null;

  // Extract-here mode: show only the progress window
  if (extractHerePath !== null) return <ExtractHereView archivePath={extractHerePath} />;

  // Normal mode
  return (
    <>
      {info ? <ArchiveView /> : <EmptyState />}
      {settingsOpen && (
        <SettingsDialog
          onPreviewScale={setPreviewScale}
          onCancel={() => setPreviewScale(uiScale)}
        />
      )}
    </>
  );
}
