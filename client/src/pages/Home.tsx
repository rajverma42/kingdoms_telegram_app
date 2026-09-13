import type { KingdomDto } from "../api/client";
import type { Screen } from "../components/BottomNav";
import { useTranslation } from "../hooks/useTranslation";
import { haptic } from "../telegram/telegramSdk";

interface Props {
  kingdom: KingdomDto;
  onNavigate: (screen: Screen) => void;
}

export function Home({ kingdom, onNavigate }: Props) {
  const { t } = useTranslation();

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26 }}>{kingdom.name}</h1>
        <p style={{ color: "var(--parchment-300)", margin: "4px 0 0", fontSize: 13 }}>
          {t("home.kingdomPower")}: {kingdom.power}
        </p>
      </div>

      <div
        style={{
          background: "linear-gradient(180deg, var(--stone-800), var(--stone-700))",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--stone-700)",
          padding: 18,
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: "var(--parchment-300)" }}>
          Castle level {kingdom.buildings.find((b) => b.type === "CASTLE")?.level ?? 1}
        </p>
        <p style={{ margin: "6px 0 16px", fontSize: 13, color: "var(--parchment-300)" }}>
          {kingdom.buildings.length} buildings raised
        </p>
        <button
          onClick={() => {
            haptic("medium");
            onNavigate("battle");
          }}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: "var(--radius-sm)",
            background: "var(--ember-500)",
            color: "var(--ink-950)",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {t("home.play")}
        </button>
      </div>
    </div>
  );
}
