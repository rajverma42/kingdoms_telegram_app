import { useTranslation } from "../i18n/useTranslation";
import { haptic } from "../telegram/webApp";

export type Screen = "home" | "battle" | "kingdom" | "heroes" | "shop";

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
    { key: "heroes", label: t("nav.heroes"), glyph: "♛" },
    { key: "shop", label: t("nav.shop"), glyph: "⛃" },
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
        zIndex: 10,
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
              gap: 3,
              padding: "10px 0 8px",
              background: "transparent",
              color: isActive ? "var(--ember-400)" : "var(--parchment-300)",
              minHeight: 44,
            }}
          >
            <span style={{ fontSize: 19, lineHeight: 1 }}>{item.glyph}</span>
            <span style={{ fontSize: 10, fontWeight: 700 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
