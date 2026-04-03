import { useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavStore } from "@/store/useNavStore";
import { useSelectionStore } from "@/store/useSelectionStore";
import { useUiStore } from "@/store/useUiStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatDate, groupLabel, humanSize, parseMcaCoords } from "@/utils/format";
import type { VirtualNode } from "@/utils/virtualFs";
import styles from "./FileRow.module.css";
import folderIcon from "@/assets/icons/folder.svg";
import fileMcaIcon from "@/assets/icons/file_mca.svg";
import fileNbtIcon from "@/assets/icons/file_nbt.svg";
import fileJsonIcon from "@/assets/icons/file_json.svg";
import fileRawIcon from "@/assets/icons/file_raw.svg";

interface Props {
  node: VirtualNode;
  allPaths: string[];
  gridTemplate: string;
  showCoordsColumn: boolean;
}

function getNodeIcon(node: VirtualNode): string {
  if (node.kind === "dir") return folderIcon;
  switch (node.entry.groupId) {
    case 0:
      return fileMcaIcon;
    case 1:
      return fileNbtIcon;
    case 2:
      return fileJsonIcon;
    default:
      return fileRawIcon;
  }
}

export function FileRow({ node, allPaths, gridTemplate, showCoordsColumn }: Props) {
  const navigateTo = useNavStore((s) => s.navigateTo);
  const currentPath = useNavStore((s) => s.currentPath);
  const { selected, select, clearSelection } = useSelectionStore();
  const setContextMenu = useUiStore((s) => s.setContextMenu);
  const setError = useUiStore((s) => s.setError);
  const prettifyJson = useSettingsStore((s) => s.prettifyJson);
  const isSelected = selected.has(node.path);

  function handleClick(e: React.MouseEvent) {
    const mode = e.ctrlKey || e.metaKey ? "toggle" : e.shiftKey ? "range" : "single";
    select(node.path, mode, allPaths);
  }

  async function handleDoubleClick() {
    if (node.kind === "dir") {
      navigateTo([...currentPath, node.name]);
    } else {
      document.body.style.cursor = "wait";
      try {
        await invoke("open_file_in_app", { entryPath: node.path, threads: 0, prettifyJson });
      } catch (e) {
        setError(`Could not open file: ${e}`);
      } finally {
        document.body.style.cursor = "";
      }
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    if (!isSelected) {
      clearSelection();
      select(node.path, "single");
    }
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  const coords = useMemo(
    () => (node.kind === "file" && showCoordsColumn ? parseMcaCoords(node.name) : null),
    [node.kind, node.name, showCoordsColumn],
  );

  const typeLabel = node.kind === "dir" ? "DIR" : groupLabel(node.entry.groupId);
  const sizeLabel = node.kind === "dir" ? "" : humanSize(node.entry.originalSize);
  const dateLabel = node.kind === "file" ? formatDate(node.entry.mtimeMs) : "";
  return (
    <div
      className={`${styles.row} ${isSelected ? styles.selected : ""}`}
      style={{ gridTemplateColumns: gridTemplate }}
      data-path={node.path}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.nameCell}>
        <img src={getNodeIcon(node)} className={styles.icon} alt="" draggable={false} />
        <span className={styles.name}>{node.name}</span>
      </div>
      <div className={styles.cell}>{typeLabel}</div>
      <div className={`${styles.cell} ${styles.right}`}>{sizeLabel}</div>
      <div className={styles.cell}>{dateLabel}</div>
      {showCoordsColumn && (
        <div className={`${styles.cell} ${styles.coords}`}>
          {coords && (
            <>
              <span className={styles.axisLabel}>X</span>
              <span className={styles.coordVal}>{coords.x1}</span>
              <span className={styles.coordSep}>–</span>
              <span className={styles.coordVal}>{coords.x2}</span>
              <span className={styles.axisLabel}>Z</span>
              <span className={styles.coordVal}>{coords.z1}</span>
              <span className={styles.coordSep}>–</span>
              <span className={styles.coordVal}>{coords.z2}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
