import { useCallback } from "react";
import en, { type TranslationKey } from "./en";
import hi from "./hi";
import { useGameStore } from "../store/gameStore";

const DICTS: Record<"en" | "hi", Partial<Record<TranslationKey, string>>> = { en, hi };

export function useTranslation() {
  const language = useGameStore((s) => s.save.settings.language);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dict = DICTS[language] ?? DICTS.en;
      let str = dict[key] ?? en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.split(`{${k}}`).join(String(v));
        }
      }
      return str;
    },
    [language]
  );

  return { t, language };
}
