import { useState } from "react";
import { api, ApiRequestError, type BuildingDto, type KingdomDto } from "../api/client";
import { useTranslation } from "../hooks/useTranslation";
import { haptic } from "../telegram/telegramSdk";

interface Props {
  kingdom: KingdomDto;
  onKingdomChange: (kingdom: KingdomDto) => void;
}

const BUILDING_LABELS: Record<string, string> = {
  CASTLE: "Castle",
  BARRACKS: "Barracks",
  ARCHER_TOWER: "Archer Tower",
  MAGE_TOWER: "Mage Tower",
  BLACKSMITH: "Blacksmith",
  GOLD_MINE: "Gold Mine",
  FARM: "Farm",
  GEM_MINE: "Gem Mine",
  HERO_HALL: "Hero Hall",
  TRAINING_GROUND: "Training Ground",
  WALL: "Wall",
  WATCH_TOWER: "Watch Tower",
};

export function Kingdom({ kingdom, onKingdomChange }: Props) {
  const { t } = useTranslation();
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const existingTypes = new Set(kingdom.buildings.map((b) => b.type));
  const availableToBuild = Object.keys(BUILDING_LABELS).filter((t) => !existingTypes.has(t));

  async function handleUpgrade(type: string) {
    setErrorMsg(null);
    setPendingType(type);
    haptic("medium");
    try {
      await api.upgradeBuilding(type);
      const fresh = await api.getKingdom();
      onKingdomChange(fresh);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrorMsg(
          err.code === "INSUFFICIENT_GOLD" ? t("error.insufficientGold") : err.message
        );
      } else {
        setErrorMsg(t("error.generic"));
      }
    } finally {
      setPendingType(null);
    }
  }

  return (
    <div style={{ padding: 20, paddingBottom: 100 }}>
      <h2 style={{ fontSize: 20, marginBottom: 14 }}>{t("kingdom.title")}</h2>

      {errorMsg && (
        <div
          style={{
            background: "var(--danger-500)",
            color: "var(--parchment-100)",
            padding: "10px 12px",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {kingdom.buildings.map((b) => (
          <BuildingRow
            key={b.id}
            building={b}
            label={BUILDING_LABELS[b.type] ?? b.type}
            busy={pendingType === b.type}
            onUpgrade={() => handleUpgrade(b.type)}
          />
        ))}

        {availableToBuild.map((type) => (
          <div
            key={type}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--stone-700)",
              color: "var(--parchment-300)",
              fontSize: 13,
            }}
          >
            <span>{BUILDING_LABELS[type]}</span>
            <button
              disabled={pendingType === type}
              onClick={() => handleUpgrade(type)}
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-sm)",
                background: "var(--gold-400)",
                color: "var(--ink-950)",
                fontWeight: 700,
                fontSize: 12,
                opacity: pendingType === type ? 0.6 : 1,
              }}
            >
              Build
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BuildingRow({
  building,
  label,
  busy,
  onUpgrade,
}: {
  building: BuildingDto;
  label: string;
  busy: boolean;
  onUpgrade: () => void;
}) {
  const { t } = useTranslation();
  const isUpgrading = building.upgrading;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: "var(--stone-800)",
        border: "1px solid var(--stone-700)",
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--parchment-300)", marginTop: 2 }}>
          {t("kingdom.level", { level: building.level })} ·{" "}
          {isUpgrading ? t("kingdom.upgrading") : t("kingdom.cost", { cost: building.nextLevelCost })}
        </div>
      </div>
      <button
        disabled={isUpgrading || busy}
        onClick={onUpgrade}
        style={{
          padding: "8px 14px",
          borderRadius: "var(--radius-sm)",
          background: isUpgrading ? "var(--stone-700)" : "var(--ember-500)",
          color: isUpgrading ? "var(--parchment-300)" : "var(--ink-950)",
          fontWeight: 700,
          fontSize: 12,
          opacity: busy ? 0.6 : 1,
        }}
      >
        {isUpgrading ? t("kingdom.upgrading") : t("kingdom.upgrade")}
      </button>
    </div>
  );
}
