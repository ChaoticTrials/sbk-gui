import { useRef, useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useArchiveStore } from "@/store/useArchiveStore";
import { useNavStore } from "@/store/useNavStore";
import { useSelectionStore } from "@/store/useSelectionStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useUiStore } from "@/store/useUiStore";
import { AboutDialog } from "@/components/AboutDialog/AboutDialog";
import { t } from "@/i18n";
import styles from "./HamburgerMenu.module.css";

const isMac = navigator.platform.startsWith("Mac") || navigator.userAgent.includes("Mac");

export function HamburgerMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const info = useArchiveStore((s) => s.info);
  const openArchive = useArchiveStore((s) => s.openArchive);
  const closeArchive = useArchiveStore((s) => s.closeArchive);
  const reset = useNavStore((s) => s.reset);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);
  const setError = useUiStore((s) => s.setError);

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  async function handleOpen() {
    setMenuOpen(false);
    try {
      const path = await open({ filters: [{ name: "SBK Archive", extensions: ["sbk"] }] });
      if (path) await openArchive(path as string);
    } catch (e) {
      setError(String(e));
    }
  }

  function handleClose() {
    setMenuOpen(false);
    closeArchive();
    reset();
    clearSelection();
  }

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button className={styles.burger} onClick={() => setMenuOpen((v) => !v)} title="Menu">
        ☰
      </button>
      {menuOpen && (
        <div className={styles.dropdown}>
          <button onClick={handleOpen}>
            {t("openArchive")} <span className={styles.kbd}>{isMac ? "Cmd" : "Ctrl"}+O</span>
          </button>
          <hr className={styles.sep} />
          <button
            onClick={() => {
              setMenuOpen(false);
              setSettingsOpen(true);
            }}
          >
            {t("settings")}
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              setAboutOpen(true);
            }}
          >
            {t("about")}
          </button>
          {info && (
            <>
              <hr className={styles.sep} />
              <button onClick={handleClose}>
                {t("closeArchive")} <span className={styles.kbd}>{isMac ? "Cmd" : "Ctrl"}+W</span>
              </button>
            </>
          )}
        </div>
      )}
      {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}
    </div>
  );
}
