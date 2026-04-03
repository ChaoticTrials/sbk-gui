import { useUiStore } from "@/store/useUiStore";
import { ResizeHandle } from "./ResizeHandle";
import type { ColumnKey, SortColumn } from "@/types";
import styles from "./ColumnHeader.module.css";

interface Props {
  col: ColumnKey;
  label: string;
}

export function ColumnHeader({ col, label }: Props) {
  const { sortColumn, sortDir, setSort } = useUiStore();
  const isActive = sortColumn === col;

  return (
    <div className={styles.header} onClick={() => setSort(col as SortColumn)}>
      <span>{label}</span>
      {isActive && <span className={styles.arrow}>{sortDir === "asc" ? " ▲" : " ▼"}</span>}
      <ResizeHandle column={col} />
    </div>
  );
}
