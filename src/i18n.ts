import en from "./locales/en.json";
import de from "./locales/de.json";

type Translations = typeof en;
export type TranslationKey = keyof Translations;

// To add a new language: create src/locales/xx.json (partial — only strings that differ
// from English), import it here, and add it to the overrides map below.
const overrides: Record<string, Partial<Translations>> = {
  de,
};

const lang = navigator.language.split("-")[0].toLowerCase();
const locale: Translations = { ...en, ...(overrides[lang] ?? {}) };

export const APP_NAME = locale.appName;

export function t(key: TranslationKey, sub?: Record<string, string | number>): string {
  let str: string = locale[key] ?? (en[key] as string) ?? key;
  if (sub) {
    for (const [k, v] of Object.entries(sub)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
