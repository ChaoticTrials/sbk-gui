import { useUiStore } from "@/store/useUiStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { t } from "@/i18n";
import styles from "./SearchBar.module.css";

export function SearchBar() {
  const { searchQuery, setSearchQuery, clearSearch } = useUiStore();
  const searchGlobal = useSettingsStore((s) => s.searchGlobal);
  const setSearchGlobal = useSettingsStore((s) => s.setSearchGlobal);

  return (
    <div className={styles.searchBar}>
      <input placeholder={t("filterByName")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
      <label className={styles.globalToggle}>
        <input type="checkbox" checked={searchGlobal} onChange={(e) => setSearchGlobal(e.target.checked)} />
        {t("searchWholeArchive")}
      </label>
      <button onClick={clearSearch}>✕</button>
    </div>
  );
}
