import { useEffect } from "react";
import { useUiStore } from "@/store/useUiStore";
import styles from "./ErrorToast.module.css";

export function ErrorToast() {
  const { errorMessage, setError } = useUiStore();

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  if (!errorMessage) return null;

  return (
    <div className={styles.toast} onClick={() => setError(null)}>
      {errorMessage}
    </div>
  );
}
