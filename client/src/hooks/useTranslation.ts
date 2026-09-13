import { useCallback } from "react";
import en from "../locales/en.json";
import hi from "../locales/hi.json";

const DICTS: Record<string, Record<string, string>> = { en, hi };

// Language is stored simply for this slice; wire to user.preferredLang /
// a settings screen once account settings (Phase 9+) exist.
let currentLang = "en";
export function setAppLanguage(lang: string) {
  currentLang = DICTS[lang] ? lang : "en";
}

export function useTranslation() {
  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const dict = DICTS[currentLang] ?? DICTS.en;
    let str = dict[key] ?? DICTS.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  }, []);

  return { t, lang: currentLang };
}
