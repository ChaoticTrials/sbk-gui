import { useUiStore } from "@/store/useUiStore";
import { t } from "@/i18n";
import styles from "./VerifyDialog.module.css";

export function VerifyDialog() {
  const verifyState = useUiStore((s) => s.verifyState);
  const setVerifyDialogOpen = useUiStore((s) => s.setVerifyDialogOpen);

  function close() {
    setVerifyDialogOpen(false);
  }

  if (!verifyState) return null;

  return (
    <div className={styles.overlay} onClick={() => verifyState !== "running" && close()}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3>{t("verifyTitle")}</h3>
        {verifyState === "running" && <p className={styles.running}>{t("verifyRunning")}</p>}
        {typeof verifyState === "object" && "ok" in verifyState && (
          <p className={verifyState.ok ? styles.ok : styles.fail}>{verifyState.ok ? t("verifyOk") : t("verifyFail")}</p>
        )}
        {typeof verifyState === "object" && "error" in verifyState && <p className={styles.fail}>{verifyState.error}</p>}
        {verifyState !== "running" && (
          <div className={styles.actions}>
            <button onClick={close}>{t("close")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
