import { useMemo, useRef, useState, useEffect } from "react";
import { useArchiveStore } from "@/store/useArchiveStore";
import { useNavStore } from "@/store/useNavStore";
import { useUiStore } from "@/store/useUiStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSelectionStore } from "@/store/useSelectionStore";
import { listDir } from "@/utils/virtualFs";
import { ColumnHeader } from "./ColumnHeader";
import { FileRow } from "./FileRow";
import styles from "./FileTable.module.css";
import type { VirtualNode } from "@/utils/virtualFs";
import { groupLabel } from "@/utils/format";
import { ResizeHandle } from "./ResizeHandle";
import { t } from "@/i18n";

export function FileTable() {
  const { entries, tree } = useArchiveStore();
  const currentPath = useNavStore((s) => s.currentPath);
  const { searchQuery, searchActive, coordSearchPaths, sortColumn, sortDir } = useUiStore();
  const columnWidths = useSettingsStore((s) => s.columnWidths);
  const searchGlobal = useSettingsStore((s) => s.searchGlobal);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const [rubberBand, setRubberBand] = useState<{ startX: number; startY: number; curX: number; curY: number } | null>(null);
  const preDragSelection = useRef<Set<string>>(new Set());
  const rubberBandModifiers = useRef<{ shift: boolean; ctrl: boolean }>({ shift: false, ctrl: false });
  const rubberBandStart = useRef<{ startX: number; startY: number } | null>(null);

  const rows: VirtualNode[] = useMemo(() => {
    let items: VirtualNode[];

    if (searchActive && searchGlobal && searchQuery.trim() !== "") {
      // Flat global search
      const q = searchQuery.toLowerCase();
      items = entries
        .filter((e) => e.path.toLowerCase().includes(q))
        .map((e) => ({ kind: "file" as const, name: e.path, path: e.path, entry: e }));
    } else if (tree) {
      items = listDir(tree, currentPath);
      if (searchActive && searchQuery) {
        const q = searchQuery.toLowerCase();
        items = items.filter((n) => n.name.toLowerCase().includes(q));
      }
      if (coordSearchPaths) {
        items = items.filter((n) => coordSearchPaths.has(n.name));
      }
    } else {
      items = [];
    }

    // Sort: dirs first, then by column
    return [...items].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
      let cmp = 0;
      if (sortColumn === "name") cmp = a.name.localeCompare(b.name);
      else if (sortColumn === "type") {
        const typeA = a.kind === "file" ? groupLabel(a.entry.groupId) : "DIR";
        const typeB = b.kind === "file" ? groupLabel(b.entry.groupId) : "DIR";
        cmp = typeA.localeCompare(typeB);
      } else if (sortColumn === "size") {
        const sA = a.kind === "file" ? a.entry.originalSize : 0;
        const sB = b.kind === "file" ? b.entry.originalSize : 0;
        cmp = sA - sB;
      } else if (sortColumn === "modified") {
        const mA = a.kind === "file" ? a.entry.mtimeMs : 0;
        const mB = b.kind === "file" ? b.entry.mtimeMs : 0;
        cmp = mA - mB;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [entries, tree, currentPath, searchActive, searchGlobal, searchQuery, coordSearchPaths, sortColumn, sortDir]);

  const allPaths = useMemo(() => rows.map((r) => r.path), [rows]);

  // Show coords column when any file in the current (non-search) view is an .mca file
  const showCoordsColumn = !searchActive && rows.some((r) => r.kind === "file" && r.name.toLowerCase().endsWith(".mca"));

  const coordsColWidth = columnWidths.coords ?? 190;
  const gridTemplate = showCoordsColumn
    ? `${columnWidths.name}px ${columnWidths.type}px ${columnWidths.size}px ${columnWidths.modified}px ${coordsColWidth}px`
    : `${columnWidths.name}px ${columnWidths.type}px ${columnWidths.size}px ${columnWidths.modified}px`;

  // Task 4: deselect on click on empty space in the body
  function handleBodyMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-path]")) return; // row handles its own click
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
      clearSelection();
    }
  }

  // Task 5: rubber band selection — start drag on the wrapper (but not on a row or header)
  function handleWrapperMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-path]")) return; // starting on a row = not rubber band
    if (target.closest("[data-no-rubber]")) return; // starting on the header = not rubber band

    // Snapshot current selection for Shift/Ctrl compat
    preDragSelection.current = new Set(useSelectionStore.getState().selected);
    rubberBandModifiers.current = { shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey };

    const scale = useSettingsStore.getState().uiScale;
    const wrapperRect = tableWrapperRef.current!.getBoundingClientRect();
    const scrollTop = tableWrapperRef.current!.scrollTop;
    const startX = e.clientX / scale - wrapperRect.left;
    const startY = e.clientY / scale - wrapperRect.top + scrollTop;

    rubberBandStart.current = { startX, startY };
    setRubberBand({
      startX,
      startY,
      curX: startX,
      curY: startY,
    });
    e.preventDefault(); // prevent text selection
  }

  // Task 5: document-level handlers while rubber band is active
  useEffect(() => {
    if (!rubberBand) return;

    function onMouseMove(e: MouseEvent) {
      if (!tableWrapperRef.current || !rubberBandStart.current) return;
      const scale = useSettingsStore.getState().uiScale;
      const wrapperRect = tableWrapperRef.current.getBoundingClientRect();
      const scrollTop = tableWrapperRef.current.scrollTop;
      const curX = e.clientX / scale - wrapperRect.left;
      const curY = e.clientY / scale - wrapperRect.top + scrollTop;

      setRubberBand((prev) => (prev ? { ...prev, curX, curY } : null));

      // Compute intersecting rows
      const { startX, startY } = rubberBandStart.current!;
      const selLeft = Math.min(startX, curX);
      const selTop = Math.min(startY, curY);
      const selRight = Math.max(startX, curX);
      const selBottom = Math.max(startY, curY);

      const inRect: string[] = [];
      const rowEls = tableWrapperRef.current.querySelectorAll<HTMLElement>("[data-path]");
      rowEls.forEach((rowEl) => {
        const rowRect = rowEl.getBoundingClientRect();
        const rowTop = rowRect.top - wrapperRect.top + scrollTop;
        const rowBottom = rowRect.bottom - wrapperRect.top + scrollTop;
        const rowLeft = rowRect.left - wrapperRect.left;
        const rowRight = rowRect.right - wrapperRect.left;
        // Intersection check
        if (rowRight > selLeft && rowLeft < selRight && rowBottom > selTop && rowTop < selBottom) {
          const path = rowEl.getAttribute("data-path");
          if (path) inRect.push(path);
        }
      });

      // Apply selection based on modifiers
      const { shift, ctrl } = rubberBandModifiers.current;
      const pre = preDragSelection.current;
      let newSelected: Set<string>;
      if (shift) {
        newSelected = new Set([...pre, ...inRect]);
      } else if (ctrl) {
        newSelected = new Set(pre);
        inRect.forEach((p) => {
          if (newSelected.has(p)) newSelected.delete(p);
          else newSelected.add(p);
        });
      } else {
        newSelected = new Set(inRect);
      }
      // Update selection store directly
      useSelectionStore.setState({ selected: newSelected });
    }

    function onMouseUp() {
      setRubberBand(null);
      rubberBandStart.current = null;
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [rubberBand]);

  const rbHeaderHeight = rubberBand ? (tableWrapperRef.current?.querySelector<HTMLElement>("[data-no-rubber]")?.offsetHeight ?? 0) : 0;
  const rbScrollTop = rubberBand ? (tableWrapperRef.current?.scrollTop ?? 0) : 0;
  const rbLeft = rubberBand ? Math.min(rubberBand.startX, rubberBand.curX) : 0;
  const rbRawTop = rubberBand ? Math.min(rubberBand.startY, rubberBand.curY) - rbScrollTop : 0;
  const rbRawBottom = rubberBand ? Math.max(rubberBand.startY, rubberBand.curY) - rbScrollTop : 0;
  const rbTop = rubberBand ? Math.max(rbHeaderHeight, rbRawTop) : 0;
  const rubberBandStyle = rubberBand
    ? { left: rbLeft, top: rbTop, width: Math.abs(rubberBand.curX - rubberBand.startX), height: Math.max(0, rbRawBottom - rbTop) }
    : null;

  return (
    <div className={styles.tableWrapper} ref={tableWrapperRef} onMouseDown={handleWrapperMouseDown}>
      <div className={styles.table}>
        <div className={styles.headerRow} style={{ gridTemplateColumns: gridTemplate }} data-no-rubber="true">
          <ColumnHeader col="name" label={searchActive && searchGlobal ? t("colPath") : t("colName")} />
          <ColumnHeader col="type" label={t("colType")} />
          <ColumnHeader col="size" label={t("colSize")} />
          <ColumnHeader col="modified" label={t("colModified")} />
          {showCoordsColumn && (
            <div className={styles.coordsHeader}>
              {t("colCoords")}
              <ResizeHandle column="coords" />
            </div>
          )}
        </div>
        <div className={styles.body} onMouseDown={handleBodyMouseDown}>
          {rows.map((row) => (
            <FileRow key={row.path} node={row} allPaths={allPaths} gridTemplate={gridTemplate} showCoordsColumn={showCoordsColumn} />
          ))}
          {rows.length === 0 && <div className={styles.empty}>{t("noFiles")}</div>}
        </div>
      </div>
      {/* Rubber band rectangle — clamped below the sticky header */}
      {rubberBandStyle && <div className={styles.rubberBand} style={rubberBandStyle} />}
    </div>
  );
}
