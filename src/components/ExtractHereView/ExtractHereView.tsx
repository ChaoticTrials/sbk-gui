import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useSettingsStore } from "@/store/useSettingsStore";
import { t } from "@/i18n";
import type { ExtractionProgress } from "@/types";
import styles from "./ExtractHereView.module.css";

type Phase = "running" | "cancelling" | "done" | "error";

interface PhaseData {
  completed: number;
  total: number;
}

interface State {
  phase: Phase;
  decompress?: PhaseData;
  decode?: PhaseData;
  write?: PhaseData;
  writeStartedAt?: number;
  count?: number;
  dest?: string;
  message?: string;
}

interface Props {
  archivePath: string;
}

export function ExtractHereView({ archivePath }: Props) {
  const archiveName = archivePath.split(/[\\/]/).pop() ?? archivePath;
  const [state, setState] = useState<State>({ phase: "running" });
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    let unlistenFn: (() => void) | undefined;
    let settled = false;

    async function start() {
      await loadSettings();
      const threads = useSettingsStore.getState().extractThreads;

      unlistenFn = await listen<ExtractionProgress>("extraction-progress", (event) => {
        if (settled) return;
        const p = event.payload;
        setState((prev) => {
          if (prev.phase !== "running") return prev;
          const update: Partial<State> = {
            [p.phase]: { completed: p.completed, total: p.total },
          };
          if (p.phase === "write" && !prev.writeStartedAt) {
            update.writeStartedAt = Date.now();
          }
          return { ...prev, ...update };
        });
      });

      try {
        const [count, dest] = await invoke<[number, string]>("extract_here_with_progress", { threads });
        settled = true;
        setState({ phase: "done", count, dest });
      } catch (e: unknown) {
        settled = true;
        const msg = String(e);
        if (msg.includes("cancelled")) {
          getCurrentWebviewWindow().close();
          return;
        }
        setState({ phase: "error", message: msg });
      }
    }

    start();

    return () => {
      settled = true;
      unlistenFn?.();
    };
  }, []);

  function handleCancel() {
    setState((prev) => ({ ...prev, phase: "cancelling" }));
    invoke("cancel_extraction").catch(() => {});
  }

  const eta = (() => {
    if (state.phase !== "running") return null;
    const w = state.write;
    const startedAt = state.writeStartedAt;
    if (!w || !startedAt || w.completed === 0) return null;
    const elapsed = (Date.now() - startedAt) / 1000;
    const remaining = (elapsed * (w.total - w.completed)) / w.completed;
    if (remaining < 60) return `~${Math.ceil(remaining)}s`;
    return `~${Math.floor(remaining / 60)}m ${Math.ceil(remaining % 60)}s`;
  })();

  const isRunning = state.phase === "running";
  const isCancelling = state.phase === "cancelling";

  return (
    <div className={styles.container}>
      <div className={styles.archiveName}>{archiveName}</div>

      {(isRunning || isCancelling) && (
        <>
          <h3 className={styles.title}>{isCancelling ? t("cancelling") : t("extracting")}</h3>
          <hr className={styles.divider} />
          <div className={styles.phases}>
            {[
              { label: t("decompressing"), data: state.decompress, phaseEta: undefined as string | undefined },
              { label: "Decode", data: state.decode, phaseEta: undefined as string | undefined },
              { label: t("writing"), data: state.write, phaseEta: eta ?? undefined },
            ].map(({ label, data, phaseEta }) => (
              <div key={label} className={styles.phaseRow}>
                <div className={styles.phaseHeader}>
                  <span className={styles.phaseLabel}>{label}</span>
                  <span className={styles.phaseCount}>
                    {data ? `${data.completed}/${data.total}` : "—"}
                    {phaseEta ? ` · ${phaseEta}` : ""}
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={isCancelling ? styles.progressFillMuted : styles.progressFill}
                    style={{ width: data && data.total > 0 ? `${(data.completed / data.total) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
          <hr className={styles.divider} />
          <div className={styles.actions}>
            <button onClick={handleCancel} disabled={isCancelling}>
              {isCancelling ? t("cancelling") : t("cancel")}
            </button>
          </div>
        </>
      )}

      {state.phase === "done" && (
        <>
          <h3 className={styles.title}>{t("extractedFiles", { n: state.count ?? 0 })}</h3>
          <hr className={styles.divider} />
          <div className={styles.dest}>{state.dest}</div>
          <hr className={styles.divider} />
          <div className={styles.actions}>
            <button
              onClick={() => {
                if (state.dest) revealItemInDir(state.dest);
              }}
            >
              {t("openFolder")}
            </button>
            <button onClick={() => getCurrentWebviewWindow().close()}>{t("close")}</button>
          </div>
        </>
      )}

      {state.phase === "error" && (
        <>
          <h3 className={`${styles.title} ${styles.errorTitle}`}>{t("error")}</h3>
          <hr className={styles.divider} />
          <p className={styles.errorMsg}>{state.message}</p>
          <hr className={styles.divider} />
          <div className={styles.actions}>
            <button onClick={() => getCurrentWebviewWindow().close()}>{t("close")}</button>
          </div>
        </>
      )}
    </div>
  );
}
