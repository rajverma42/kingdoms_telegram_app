import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { BUILDINGS, getBuildingConfig, getUpgradeCost, type BuildingType } from "../game/data/buildings";
import { TROOPS, getTroopUpgradeCost, type TroopType } from "../game/data/troops";
import { useTranslation } from "../i18n/useTranslation";
import { haptic } from "../telegram/webApp";

export function Kingdom() {
  const { t } = useTranslation();
  const save = useGameStore((s) => s.save);
  const playerLevel = save.playerLevel;
  const upgradeBuilding = useGameStore((s) => s.upgradeBuilding);
  const trainTroop = useGameStore((s) => s.trainTroop);
  const upgradeTroop = useGameStore((s) => s.upgradeTroop);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<BuildingType | null>(null);
  const [busyTroop, setBusyTroop] = useState<TroopType | null>(null);

  function handleTrain(type: TroopType) {
    setErrorMsg(null);
    setBusyTroop(type);
    haptic("medium");
    const outcome = trainTroop(type);
    setBusyTroop(null);
    if (!outcome.ok) setErrorMsg(outcome.error === "INSUFFICIENT_COINS" ? t("error.insufficientCoins") : t("error.generic"));
  }

  function handleTroopUpgrade(type: TroopType) {
    setErrorMsg(null);
    setBusyTroop(type);
    haptic("medium");
    const outcome = upgradeTroop(type);
    setBusyTroop(null);
    if (!outcome.ok) setErrorMsg(outcome.error === "INSUFFICIENT_COINS" ? t("error.insufficientCoins") : t("error.generic"));
  }

  function handleUpgrade(type: BuildingType) {
    setErrorMsg(null);
    setBusy(type);
    haptic("medium");
    const outcome = upgradeBuilding(type);
    setBusy(null);
    if (!outcome.ok) {
      setErrorMsg(
        outcome.error === "INSUFFICIENT_COINS"
          ? t("error.insufficientCoins")
          : outcome.error === "LEVEL_TOO_LOW"
          ? t("error.generic")
          : t("error.generic")
      );
    }
  }

  return (
    <div style={{ padding: "18px 18px 110px" }}>
      <h2 style={{ fontSize: 20, marginBottom: 14 }}>{t("kingdom.title")}</h2>

      {errorMsg && (
        <div style={{ background: "var(--danger-500)", color: "var(--parchment-100)", padding: "10px 12px", borderRadius: "var(--radius-sm)", fontSize: 13, marginBottom: 12 }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {BUILDINGS.map((config) => {
          const state = save.buildings[config.type];
          const level = state?.level ?? 0;
          const locked = level === 0 && config.unlockLevel > playerLevel;
          const isUpgrading = !!state?.upgradeFinishesAt && state.upgradeFinishesAt > Date.now();
          const maxed = level >= config.maxLevel;
          const cost = getUpgradeCost(config.type, level);

          return (
            <div key={config.type} className="card" style={{ opacity: locked ? 0.55 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{config.name}</div>
                  <div style={{ fontSize: 11, color: "var(--parchment-300)", marginTop: 2 }}>{config.description}</div>
                  <div style={{ fontSize: 11, color: "var(--parchment-300)", marginTop: 4 }}>
                    {locked
                      ? t("kingdom.locked", { level: config.unlockLevel })
                      : maxed
                      ? t("kingdom.maxLevel")
                      : isUpgrading
                      ? t("kingdom.upgrading")
                      : `${t("kingdom.level", { level })} · ${t("kingdom.cost", { cost })}`}
                  </div>
                </div>
                <button
                  disabled={locked || maxed || isUpgrading || busy === config.type}
                  onClick={() => handleUpgrade(config.type)}
                  className="btn-primary"
                  style={{ fontSize: 12, padding: "10px 14px", opacity: locked || maxed || isUpgrading ? 0.5 : 1 }}
                >
                  {level === 0 ? t("kingdom.build") : t("kingdom.upgrade")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <h2 style={{ fontSize: 18, margin: "22px 0 12px" }}>{t("kingdom.troops")}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {TROOPS.map((troop) => {
          const trainingBuilding = getBuildingConfig(troop.trainedAt);
          const buildingLevel = save.buildings[troop.trainedAt]?.level ?? 0;
          const locked = buildingLevel === 0;
          const state = save.troops[troop.type];
          const quantity = state?.quantity ?? 0;
          const level = state?.level ?? 1;
          const trainCost = Math.round(troop.baseUpgradeCost * 0.6);
          const upgradeCost = quantity > 0 ? getTroopUpgradeCost(troop.type, level) : 0;

          return (
            <div key={troop.type} className="card" style={{ opacity: locked ? 0.55 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{troop.name}</div>
                  <div style={{ fontSize: 11, color: "var(--parchment-300)", marginTop: 2 }}>
                    {locked ? t("kingdom.troopLocked", { building: trainingBuilding.name }) : t("kingdom.troopQty", { quantity, level })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    disabled={locked || busyTroop === troop.type}
                    onClick={() => handleTrain(troop.type)}
                    className="btn-primary"
                    style={{ fontSize: 11, padding: "8px 10px", opacity: locked ? 0.5 : 1 }}
                  >
                    {t("kingdom.train", { cost: trainCost })}
                  </button>
                  {quantity > 0 && (
                    <button
                      disabled={locked || busyTroop === troop.type}
                      onClick={() => handleTroopUpgrade(troop.type)}
                      className="btn-secondary"
                      style={{ fontSize: 11, padding: "8px 10px" }}
                    >
                      {t("kingdom.troopUpgrade", { cost: upgradeCost })}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
