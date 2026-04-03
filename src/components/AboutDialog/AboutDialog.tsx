import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { APP_NAME, t } from "@/i18n";
import styles from "./AboutDialog.module.css";

interface Props {
  onClose: () => void;
}

export function AboutDialog({ onClose }: Props) {
  const [versions, setVersions] = React.useState<{ app: string; sbk: string }>({ app: "...", sbk: "..." });
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    invoke<[string, string]>("get_version_info").then(([app, sbk]) => setVersions({ app, sbk }));
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(`sbk: ${versions.sbk}\nsbk-gui: ${versions.app}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3>{APP_NAME}</h3>
        <table className={styles.versionsTable}>
          <tbody>
            <tr>
              <td className={styles.vLabel}>sbk-gui</td>
              <td className={styles.vValue}>{versions.app}</td>
            </tr>
            <tr>
              <td className={styles.vLabel}>sbk</td>
              <td className={styles.vValue}>{versions.sbk}</td>
            </tr>
          </tbody>
        </table>
        <p className={styles.desc}>{t("aboutDesc")}</p>
        <div className={styles.actions}>
          <button className={styles.iconBtn} onClick={handleCopy} title={copied ? t("copied") : t("copyVersions")}>
            {copied ? "✓" : "📋"}
          </button>
          <button onClick={onClose}>{t("close")}</button>
        </div>
      </div>
    </div>
  );
}
