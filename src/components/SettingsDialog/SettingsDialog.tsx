import React from "react";
import { appDataDir } from "@tauri-apps/api/path";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "@/store/useSettingsStore";
import { t } from "@/i18n";
import styles from "./SettingsDialog.module.css";

interface Props {
  onPreviewScale: (scale: number) => void;
  onCancel: () => void;
}

export function SettingsDialog({ onPreviewScale, onCancel }: Props) {
  const { setPrettifyJson, setFlatExtract, setUiScale, setExtractThreads, setSettingsOpen } = useSettingsStore();

  // Lazy init: read once from store state (not a reactive selector — avoids infinite re-renders)
  const [pending, setPending] = React.useState(() => {
    const s = useSettingsStore.getState();
    return {
      prettifyJson: s.prettifyJson,
      flatExtract: s.flatExtract,
      extractThreads: s.extractThreads,
      uiScale: s.uiScale,
    };
  });
  const [cpuCount, setCpuCount] = React.useState(0);

  React.useEffect(() => {
    invoke<number>("get_cpu_count").then((n) => setCpuCount(n));
  }, []);

  async function handleApply() {
    await setPrettifyJson(pending.prettifyJson);
    await setFlatExtract(pending.flatExtract);
    await setExtractThreads(pending.extractThreads);
    await setUiScale(pending.uiScale);
    setSettingsOpen(false);
  }

  function handleCancel() {
    onCancel();
    setSettingsOpen(false);
  }

  function handleReset() {
    const defaults = { prettifyJson: false, flatExtract: false, extractThreads: 0, uiScale: 1.0 };
    setPending(defaults);
    onPreviewScale(1.0);
  }

  async function handleOpenSettingsFolder() {
    const dir = await appDataDir();
    await revealItemInDir(dir);
  }

  const autoLabel = t("autoThreads", { n: Math.max(1, Math.floor((cpuCount || 2) / 2)) });

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{t("settings")}</h3>
          <button className={styles.closeBtn} onClick={handleCancel}>
            ✕
          </button>
        </div>
        <hr className={styles.divider} />
        <label className={styles.option}>
          <input
            type="checkbox"
            checked={pending.prettifyJson}
            onChange={(e) => setPending((p) => ({ ...p, prettifyJson: e.target.checked }))}
          />
          {t("prettifyJson")}
        </label>
        <label className={styles.option}>
          <input
            type="checkbox"
            checked={pending.flatExtract}
            onChange={(e) => setPending((p) => ({ ...p, flatExtract: e.target.checked }))}
          />
          {t("flatExtract")}
        </label>
        <div className={styles.sliderOption}>
          <span>{t("extractionThreads")}</span>
          <div className={styles.sliderRow}>
            <input
              type="range"
              min={1}
              max={cpuCount || 16}
              step={1}
              value={pending.extractThreads || Math.max(1, Math.floor((cpuCount || 2) / 2))}
              onChange={(e) => setPending((p) => ({ ...p, extractThreads: Number(e.target.value) }))}
              className={styles.slider}
            />
            <span className={styles.scaleValue}>{pending.extractThreads ? `${pending.extractThreads}` : autoLabel}</span>
          </div>
        </div>
        <div className={styles.sliderOption}>
          <span>{t("uiScale")}</span>
          <div className={styles.sliderRow}>
            <input
              type="range"
              min="0.75"
              max="3"
              step="0.05"
              value={pending.uiScale}
              onChange={(e) => {
                const v = Number(e.target.value);
                setPending((p) => ({ ...p, uiScale: v }));
                onPreviewScale(v);
              }}
              className={styles.slider}
            />
            <span className={styles.scaleValue}>{pending.uiScale.toFixed(2)}×</span>
          </div>
        </div>
        <div className={styles.footer}>
          <div>
            <button className={styles.resetBtn} onClick={handleReset}>
              {t("resetDefaults")}
            </button>
            <button onClick={handleOpenSettingsFolder}>{t("openSettingsFolder")}</button>
          </div>
          <div className={styles.footerRight}>
            <button onClick={handleCancel}>{t("cancel")}</button>
            <button onClick={handleApply}>{t("apply")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
