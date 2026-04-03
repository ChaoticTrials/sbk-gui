import { useEffect } from "react";
import { useNavStore } from "@/store/useNavStore";

export function useMouseButtons() {
  const { navigateBack, navigateFwd } = useNavStore();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (e.button === 3) {
        e.preventDefault();
        navigateBack();
      }
      if (e.button === 4) {
        e.preventDefault();
        navigateFwd();
      }
    }
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [navigateBack, navigateFwd]);
}
