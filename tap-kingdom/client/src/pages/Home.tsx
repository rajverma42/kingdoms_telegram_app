import { useMemo, useState } from "react";
import { useGameStore, computePlayerPower } from "../store/gameStore";
import { TapButton } from "../features/tap/TapButton";
import { ProgressBar } from "../components/ProgressBar";
import { Modal } from "../components/Modal";
import { xpForNextLevel } from "../game/logic/economy";
import { useTranslation } from "../i18n/useTranslation";
import { haptic, hapticNotification } from "../telegram/webApp";
import type { Screen } from "../components/BottomNav";

export type Overlay = "missions" | "dailyReward" | "achievements" | "stats" | "settings";

interface Props {
  onNavigate: (screen: Screen) => void;
  onOpenOverlay: (overlay: Overlay) => void;
}

export function Home({ onNavigate, onOpenOverlay }: Props) {
  const { t } = useTranslation();
  const save = useGameStore((s) => s.save);
  const openFreeChest = useGameStore((s) => s.openFreeChest);
  const lastChestReward = useGameStore((s) => s.lastChestReward);
  const power = useMemo(() => computePlayerPower(save), [save]);
  const xpNeeded = xpForNextLevel(save.playerLevel);
  const castleLevel = save.buildings.CASTLE?.level ?? 1;
  const [chestOpen, setChestOpen] = useState(false);
  const [chestError, setChestError] = useState<string | null>(null);

  function handleOpenChest() {
    haptic("medium");
    setChestError(null);
    const outcome = openFreeChest();
    if (!outcome.ok) {
      setChestError(outcome.error === "INSUFFICIENT_GEMS" ? t("error.insufficientGems") : t("error.generic"));
      return;
    }
    hapticNotification("success");
  }

  return (
    <div style={{ padding: "18px 18px 110px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="card" style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 22 }}>Tap Kingdom</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--parchment-300)" }}>
          {t("home.kingdomPower")}: <strong style={{ color: "var(--gold-400)" }}>{power}</strong> · {t("home.level", { level: save.playerLevel })}
        </p>
        <div style={{ marginTop: 10 }}>
          <ProgressBar value={save.xp} max={xpNeeded} />
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--parchment-300)" }}>
          Castle Lv.{castleLevel} · {save.xp}/{xpNeeded} XP
        </p>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "center", padding: "26px 14px" }}>
        <TapButton />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <QuickButton label={t("home.battle")} glyph="⚔" onClick={() => onNavigate("battle")} />
        <QuickButton label={t("home.kingdom")} glyph="▲" onClick={() => onNavigate("kingdom")} />
        <QuickButton label={t("home.heroes")} glyph="♛" onClick={() => onNavigate("heroes")} />
        <QuickButton label={t("home.shop")} glyph="⛃" onClick={() => onNavigate("shop")} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <SecondaryLink label={t("home.chest")} onClick={() => setChestOpen(true)} />
        <SecondaryLink label={t("home.missions")} onClick={() => onOpenOverlay("missions")} />
        <SecondaryLink label={t("home.dailyReward")} onClick={() => onOpenOverlay("dailyReward")} />
        <SecondaryLink label={t("home.achievements")} onClick={() => onOpenOverlay("achievements")} />
        <SecondaryLink label={t("home.stats")} onClick={() => onOpenOverlay("stats")} />
        <SecondaryLink label={t("home.settings")} onClick={() => onOpenOverlay("settings")} />
      </div>

      <Modal open={chestOpen} onClose={() => setChestOpen(false)}>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: 18 }}>{t("chest.title")}</h3>
          <p style={{ fontSize: 12, color: "var(--parchment-300)", margin: "8px 0" }}>{t("chest.description")}</p>
          {chestError && <p style={{ fontSize: 12, color: "var(--danger-500)" }}>{chestError}</p>}
          {lastChestReward && (
            <p style={{ fontSize: 13, color: "var(--gold-400)", fontWeight: 700, margin: "8px 0" }}>
              {t("chest.reward", { coins: lastChestReward.coins, gems: lastChestReward.gems, fragments: lastChestReward.fragments })}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleOpenChest}>
              {t("chest.open")}
            </button>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setChestOpen(false)}>
              {t("chest.close")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function QuickButton({ label, glyph, onClick }: { label: string; glyph: string; onClick: () => void }) {
  return (
    <button
      className="card"
      onClick={() => {
        haptic("light");
        onClick();
      }}
      style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 700, color: "var(--parchment-100)" }}
    >
      <span style={{ fontSize: 20, color: "var(--gold-400)" }}>{glyph}</span>
      {label}
    </button>
  );
}

function SecondaryLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--stone-700)",
        color: "var(--parchment-100)",
        borderRadius: "999px",
        padding: "8px 14px",
        fontSize: 12,
        fontWeight: 600,
        minHeight: 36,
      }}
    >
      {label}
    </button>
  );
}
