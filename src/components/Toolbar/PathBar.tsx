import { useState, useEffect } from "react";
import { useNavStore } from "@/store/useNavStore";
import { useArchiveStore } from "@/store/useArchiveStore";
import { useUiStore } from "@/store/useUiStore";
import { isValidPath } from "@/utils/virtualFs";
import styles from "./Toolbar.module.css";

export function PathBar() {
  const currentPath = useNavStore((s) => s.currentPath);
  const navigateTo = useNavStore((s) => s.navigateTo);
  const searchActive = useUiStore((s) => s.searchActive);
  const searchQuery = useUiStore((s) => s.searchQuery);
  const tree = useArchiveStore((s) => s.tree);
  const setError = useUiStore((s) => s.setError);

  const displayValue = searchActive ? `Search: ${searchQuery}` : currentPath.length === 0 ? "/" : currentPath.join("/") + "/";

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(displayValue);

  // Cancel any in-progress edit when the displayed path changes externally.
  useEffect(() => {
    setEditing(false);
  }, [displayValue]);

  useEffect(() => {
    if (!editing) setValue(displayValue);
  }, [displayValue, editing]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const raw = value.replace(/^\//, "").replace(/\/$/, "");
      const segments = raw === "" ? [] : raw.split("/");
      if (!tree || isValidPath(tree, segments)) {
        navigateTo(segments);
        setEditing(false);
      } else {
        setError(`Path not found: ${value}`);
      }
    } else if (e.key === "Escape") {
      setEditing(false);
      setValue(displayValue);
    }
  }

  return editing ? (
    <input
      className={styles.pathBar}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        setEditing(false);
        setValue(displayValue);
      }}
      autoFocus
    />
  ) : (
    <div className={styles.pathBar} onClick={() => !searchActive && setEditing(true)}>
      {displayValue}
    </div>
  );
}
