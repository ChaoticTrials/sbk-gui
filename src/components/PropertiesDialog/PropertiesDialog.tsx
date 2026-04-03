import { useUiStore } from "@/store/useUiStore";
import { useArchiveStore } from "@/store/useArchiveStore";
import { humanSize, formatDate, groupLabel } from "@/utils/format";
import { sizeOf } from "@/utils/virtualFs";
import { t } from "@/i18n";
import styles from "./PropertiesDialog.module.css";

export function PropertiesDialog() {
  const { propertiesEntry, setPropertiesEntry } = useUiStore();
  const entries = useArchiveStore((s) => s.entries);
  const entry = entries.find((e) => e.path === propertiesEntry);

  if (!propertiesEntry) return null;

  const dirChildren = entry ? null : entries.filter((e) => e.path.startsWith(propertiesEntry + "/"));
  const dirSize = entry ? 0 : sizeOf(entries, propertiesEntry);

  return (
    <div className={styles.overlay} onClick={() => setPropertiesEntry(null)}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3>{t("propertiesTitle")}</h3>
        <hr className={styles.divider} />
        {entry ? (
          <table className={styles.table}>
            <tbody>
              <tr>
                <th>{t("propPath")}</th>
                <td>{entry.path}</td>
              </tr>
              <tr>
                <th>{t("propType")}</th>
                <td>{groupLabel(entry.groupId)}</td>
              </tr>
              <tr>
                <th>{t("propSize")}</th>
                <td>{humanSize(entry.originalSize)}</td>
              </tr>
              <tr>
                <th>{t("propModified")}</th>
                <td>{formatDate(entry.mtimeMs)}</td>
              </tr>
              <tr>
                <th>{t("propGroupId")}</th>
                <td>{entry.groupId}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <table className={styles.table}>
            <tbody>
              <tr>
                <th>{t("propPath")}</th>
                <td>{propertiesEntry}</td>
              </tr>
              <tr>
                <th>{t("propItems")}</th>
                <td>{dirChildren!.length}</td>
              </tr>
              <tr>
                <th>{t("propSize")}</th>
                <td>{humanSize(dirSize)}</td>
              </tr>
            </tbody>
          </table>
        )}
        <div className={styles.actions}>
          <button onClick={() => setPropertiesEntry(null)}>{t("close")}</button>
        </div>
      </div>
    </div>
  );
}
