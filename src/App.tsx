import { useEffect, useState } from "react";
import { useArchiveStore } from "./store/useArchiveStore";
import { useSettingsStore } from "./store/useSettingsStore";
import { EmptyState } from "./components/EmptyState/EmptyState";
import { ArchiveView } from "./components/ArchiveView/ArchiveView";
import { SettingsDialog } from "./components/SettingsDialog/SettingsDialog";
import { useMouseButtons } from "./hooks/useMouseButtons";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";

export default function App() {
  const info = useArchiveStore((s) => s.info);
  const { loadSettings, uiScale } = useSettingsStore();
  const settingsOpen = useSettingsStore((s) => s.settingsOpen);
  const [previewScale, setPreviewScale] = useState(uiScale);
  useMouseButtons();
  useGlobalShortcuts();

  useEffect(() => {
    loadSettings();
  }, []);

  // Apply zoom via CSS variable on html element
  useEffect(() => {
    document.documentElement.style.setProperty("--ui-scale", String(previewScale));
  }, [previewScale]);

  // Sync previewScale when the store changes externally (e.g. Ctrl+wheel)
  useEffect(() => {
    setPreviewScale(uiScale);
  }, [uiScale]);

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

  return (
    <>
      {info ? <ArchiveView /> : <EmptyState />}
      {settingsOpen && (
        <SettingsDialog
          onPreviewScale={setPreviewScale}
          onCancel={() => {
            setPreviewScale(uiScale);
          }}
        />
      )}
    </>
  );
}
