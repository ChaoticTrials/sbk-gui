import { useState, useMemo, useEffect } from "react";
import { useUiStore } from "@/store/useUiStore";
import { t } from "@/i18n";
import styles from "./CoordinateSearch.module.css";

function blockToRegion(coord: number): number {
  return Math.floor(Math.floor(coord / 16) / 32);
}

export function CoordinateSearch({ onClose }: { onClose: () => void }) {
  const [x, setX] = useState("");
  const [z, setZ] = useState("");
  const [xMax, setXMax] = useState("");
  const [zMax, setZMax] = useState("");
  const [useRange, setUseRange] = useState(false);

  const setCoordSearchPaths = useUiStore((s) => s.setCoordSearchPaths);

  const regionFilenames = useMemo(() => {
    const xNum = parseInt(x);
    const zNum = parseInt(z);
    if (isNaN(xNum) || isNaN(zNum)) return null;

    const names = new Set<string>();
    if (useRange) {
      const xMaxNum = parseInt(xMax) || xNum;
      const zMaxNum = parseInt(zMax) || zNum;
      const rxMin = blockToRegion(Math.min(xNum, xMaxNum));
      const rxMax = blockToRegion(Math.max(xNum, xMaxNum));
      const rzMin = blockToRegion(Math.min(zNum, zMaxNum));
      const rzMax = blockToRegion(Math.max(zNum, zMaxNum));
      for (let rx = rxMin; rx <= rxMax; rx++) {
        for (let rz = rzMin; rz <= rzMax; rz++) {
          names.add(`r.${rx}.${rz}.mca`);
        }
      }
    } else {
      names.add(`r.${blockToRegion(xNum)}.${blockToRegion(zNum)}.mca`);
    }
    return names;
  }, [x, z, xMax, zMax, useRange]);

  // Sync filter into file table
  useEffect(() => {
    setCoordSearchPaths(regionFilenames);
  }, [regionFilenames]);

  // Clear filter when coord search closes
  useEffect(() => () => setCoordSearchPaths(null), []);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>{t("regionSearch")}</div>
          <div className={styles.subtitle}>{t("regionSearchDesc")}</div>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>
      <div className={styles.form}>
        <div className={styles.coordRow}>
          <label className={styles.coordLabel}>
            <span>X</span>
            <input type="number" value={x} onChange={(e) => setX(e.target.value)} placeholder={t("blockX")} className={styles.coordInput} />
          </label>
          <label className={styles.coordLabel}>
            <span>Z</span>
            <input type="number" value={z} onChange={(e) => setZ(e.target.value)} placeholder={t("blockZ")} className={styles.coordInput} />
          </label>
        </div>
        <label className={styles.rangeToggle}>
          <input type="checkbox" checked={useRange} onChange={(e) => setUseRange(e.target.checked)} />
          <span>{t("range")}</span>
        </label>
        {useRange && (
          <div className={styles.coordRow}>
            <label className={styles.coordLabel}>
              <span>{t("xMax")}</span>
              <input type="number" value={xMax} onChange={(e) => setXMax(e.target.value)} className={styles.coordInput} />
            </label>
            <label className={styles.coordLabel}>
              <span>{t("zMax")}</span>
              <input type="number" value={zMax} onChange={(e) => setZMax(e.target.value)} className={styles.coordInput} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
