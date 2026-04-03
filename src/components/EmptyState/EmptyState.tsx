import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useArchiveStore } from "../../store/useArchiveStore";
import { useUiStore } from "../../store/useUiStore";
import { HamburgerMenu } from "../HamburgerMenu/HamburgerMenu";
import { t } from "../../i18n";
import styles from "./EmptyState.module.css";

export function EmptyState() {
  const openArchive = useArchiveStore((s) => s.openArchive);
  const setError = useUiStore((s) => s.setError);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    const unlistenPromise = getCurrentWebview().onDragDropEvent(async (event) => {
      if (event.payload.type === "over") {
        setHighlight(true);
      } else if (event.payload.type === "leave" || (event.payload.type as string) === "cancelled") {
        setHighlight(false);
      } else if (event.payload.type === "drop") {
        setHighlight(false);
        const { paths } = event.payload;
        if (!paths || paths.length === 0) return;
        try {
          await openArchive(paths[0]);
        } catch (err) {
          setError(String(err));
        }
      }
    });
    return () => {
      unlistenPromise.then((f) => f());
    };
  }, []);

  async function handleOpenDialog() {
    try {
      const path = await open({ filters: [{ name: "SBK Archive", extensions: ["sbk"] }] });
      if (path) await openArchive(path as string);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className={`${styles.root} ${highlight ? styles.highlight : ""}`}>
      <div className={styles.menuBar}>
        <HamburgerMenu />
      </div>
      <div className={styles.icon}>📦</div>
      <p className={styles.hint}>{t("dropHint")}</p>
      <p className={styles.or}>{t("dropOr")}</p>
      <button className={styles.openBtn} onClick={handleOpenDialog}>
        {t("openArchive")}
      </button>
    </div>
  );
}
