import { useSettingsStore } from "@/store/useSettingsStore";
import type { ColumnKey } from "@/types";
import styles from "./ResizeHandle.module.css";

export function ResizeHandle({ column }: { column: ColumnKey }) {
  const setColumnWidth = useSettingsStore((s) => s.setColumnWidth);

  function onPointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = useSettingsStore.getState().columnWidths[column];
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    function onMove(ev: PointerEvent) {
      const zoom = useSettingsStore.getState().uiScale;
      const delta = (ev.clientX - startX) / zoom;
      setColumnWidth(column, Math.max(50, startWidth + delta));
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      useSettingsStore.getState().saveColumnWidths();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return <div className={styles.handle} onPointerDown={onPointerDown} onClick={(e) => e.stopPropagation()} />;
}
