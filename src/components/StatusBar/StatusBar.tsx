import { useMemo } from "react";
import { useArchiveStore } from "@/store/useArchiveStore";
import { useSelectionStore } from "@/store/useSelectionStore";
import { humanSize } from "@/utils/format";
import { sizeOf } from "@/utils/virtualFs";
import styles from "./StatusBar.module.css";

export function StatusBar() {
  const { info, entries } = useArchiveStore();
  const selected = useSelectionStore((s) => s.selected);

  const selectedSize = useMemo(() => [...selected].reduce((s, path) => s + sizeOf(entries, path), 0), [entries, selected]);

  if (!info) return null;

  return (
    <div className={styles.bar}>
      <span>
        {info.fileCount.toLocaleString()} files · {humanSize(info.totalOriginalSize)} original · {humanSize(info.totalCompressedSize)}{" "}
        compressed
      </span>
      <span className={styles.selection} style={{ visibility: selected.size > 0 ? "visible" : "hidden" }}>
        │ {selected.size} selected · {humanSize(selectedSize)}
      </span>
    </div>
  );
}
