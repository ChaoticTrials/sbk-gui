import { useMemo } from "react";
import { useNavStore } from "@/store/useNavStore";
import { useUiStore } from "@/store/useUiStore";
import { useArchiveStore } from "@/store/useArchiveStore";
import { listDir } from "@/utils/virtualFs";
import { HamburgerMenu } from "@/components/HamburgerMenu/HamburgerMenu";
import { PathBar } from "./PathBar";
import { t } from "@/i18n";
import styles from "./Toolbar.module.css";

interface Props {
  coordSearchOpen: boolean;
  onToggleCoordSearch: () => void;
}

export function Toolbar({ coordSearchOpen, onToggleCoordSearch }: Props) {
  const { historyBack, historyFwd, currentPath, navigateBack, navigateFwd, navigateUp } = useNavStore();
  const { searchActive, setSearchActive, verifyState, setVerifyDialogOpen } = useUiStore();
  const tree = useArchiveStore((s) => s.tree);

  const hasMca = useMemo(() => {
    if (!tree) return false;
    const items = listDir(tree, currentPath);
    return items.some((item) => item.name.toLowerCase().endsWith(".mca"));
  }, [tree, currentPath]);

  return (
    <>
      <div className={styles.toolbar}>
        <button title={t("back")} onClick={navigateBack} disabled={historyBack.length === 0}>
          ←
        </button>
        <button title={t("forward")} onClick={navigateFwd} disabled={historyFwd.length === 0}>
          →
        </button>
        <button title={t("up")} onClick={navigateUp} disabled={currentPath.length === 0}>
          ↑
        </button>
        <PathBar />
        <button title={t("search")} onClick={() => setSearchActive(!searchActive)} className={searchActive ? styles.active : ""}>
          🔍
        </button>
        <button title={t("coordSearch")} onClick={onToggleCoordSearch} className={coordSearchOpen ? styles.active : ""} disabled={!hasMca}>
          📍
        </button>
        {verifyState !== null &&
          (() => {
            const isRunning = verifyState === "running";
            const isOk = typeof verifyState === "object" && "ok" in verifyState && verifyState.ok;
            const title = isRunning
              ? t("verifyRunning")
              : typeof verifyState === "object" && "ok" in verifyState
                ? verifyState.ok
                  ? t("verifyOk")
                  : t("verifyFail")
                : t("error");
            return (
              <button
                className={`${styles.verifyBtn} ${isRunning ? styles.verifyRunning : isOk ? styles.verifyOk : styles.verifyFail}`}
                onClick={() => setVerifyDialogOpen(true)}
                title={title}
              >
                {isRunning ? <span className={styles.spinner} /> : isOk ? "✓" : "✗"}
              </button>
            );
          })()}
        <HamburgerMenu />
      </div>
    </>
  );
}
