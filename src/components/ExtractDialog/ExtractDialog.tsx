import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { useUiStore } from "@/store/useUiStore";
import { useArchiveStore } from "@/store/useArchiveStore";
import { t } from "@/i18n";
import type { ExtractionProgress, ExtractDialogState } from "@/types";
import styles from "./ExtractDialog.module.css";

export function ExtractDialog() {
  const { extractDialog, setExtractDialog } = useUiStore();
  const info = useArchiveStore((s) => s.info);
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (extractDialog?.phase !== "running") return;
    let cancelled = false;
    listen<ExtractionProgress>("extraction-progress", (event) => {
      if (cancelled) return;
      const prev = useUiStore.getState().extractDialog;
      if (!prev || prev.phase !== "running") return;
      const p = event.payload;
      const update: Partial<ExtractDialogState> = {
        [p.phase]: { completed: p.completed, total: p.total },
      };
      if (p.phase === "write" && !prev.writeStartedAt) {
        update.writeStartedAt = Date.now();
      }
      setExtractDialog({ ...prev, ...update });
    }).then((unlisten) => {
      unlistenRef.current = unlisten;
    });
    return () => {
      cancelled = true;
      unlistenRef.current?.();
      unlistenRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractDialog?.phase === "running"]);

  if (!extractDialog) return null;

  const decodeLabel = info?.algorithm === "zstd" ? "ZSTD Decode" : "XZ Decode";

  const eta = (() => {
    if (extractDialog.phase !== "running") return null;
    const w = extractDialog.write;
    const startedAt = extractDialog.writeStartedAt;
    if (!w || !startedAt || w.completed === 0) return null;
    const elapsed = (Date.now() - startedAt) / 1000;
    const remaining = (elapsed * (w.total - w.completed)) / w.completed;
    if (remaining < 60) return `~${Math.ceil(remaining)}s`;
    return `~${Math.floor(remaining / 60)}m ${Math.ceil(remaining % 60)}s`;
  })();

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {extractDialog.phase === "running" && (
          <>
            <h3>{t("extracting")}</h3>
            <div className={styles.phases}>
              {[
                { label: t("decompressing"), data: extractDialog.decompress, eta: undefined },
                { label: decodeLabel, data: extractDialog.decode, eta: undefined },
                { label: t("writing"), data: extractDialog.write, eta },
              ].map(({ label, data, eta }) => (
                <div key={label} className={styles.phaseRow}>
                  <div className={styles.phaseHeader}>
                    <span className={styles.phaseLabel}>{label}</span>
                    <span className={styles.phaseCount}>
                      {data ? `${data.completed}/${data.total}` : "—"}
                      {eta ? ` · ${eta}` : ""}
                    </span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: data && data.total > 0 ? `${(data.completed / data.total) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.actions}>
              <button
                onClick={() => {
                  invoke("cancel_extraction").catch(() => {});
                }}
              >
                {t("cancel")}
              </button>
            </div>
          </>
        )}
        {extractDialog.phase === "done" && (
          <>
            <h3>{t("extractedFiles", { n: extractDialog.count ?? 0 })}</h3>
            <div className={styles.dest}>{extractDialog.dest}</div>
            <div className={styles.actions}>
              <button
                onClick={() => {
                  if (extractDialog.dest) revealItemInDir(extractDialog.dest);
                }}
              >
                {t("openFolder")}
              </button>
              <button onClick={() => setExtractDialog(null)}>{t("close")}</button>
            </div>
          </>
        )}
        {extractDialog.phase === "error" && (
          <>
            <h3 className={styles.error}>{t("error")}</h3>
            <p>{extractDialog.message}</p>
            <div className={styles.actions}>
              <button onClick={() => setExtractDialog(null)}>{t("close")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
