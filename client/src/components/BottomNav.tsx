import { useTranslation } from "../hooks/useTranslation";
import { haptic } from "../telegram/telegramSdk";

export type Screen = "home" | "kingdom" | "battle";

interface Props {
  active: Screen;
  onChange: (screen: Screen) => void;
}

export function BottomNav({ active, onChange }: Props) {
  const { t } = useTranslation();

  const items: { key: Screen; label: string; glyph: string }[] = [
    { key: "home", label: t("nav.home"), glyph: "◆" },
    { key: "battle", label: t("nav.battle"), glyph: "⚔" },
    { key: "kingdom", label: t("nav.kingdom"), glyph: "▲" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        background: "var(--stone-800)",
        borderTop: "1px solid var(--stone-700)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {items.map((item) => {
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => {
              haptic("light");
              onChange(item.key);
            }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "10px 0 8px",
              background: "transparent",
              color: isActive ? "var(--ember-500)" : "var(--parchment-300)",
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{item.glyph}</span>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
