import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { BATTLE_STAGES, type BattleType } from "../game/data/battleStages";
import { useTranslation } from "../i18n/useTranslation";
import { haptic, hapticNotification } from "../telegram/webApp";
import type { BattleResult } from "../game/logic/battle";

const TYPE_LABEL_KEY: Record<BattleType, "battle.normal" | "battle.elite" | "battle.boss"> = {
  NORMAL: "battle.normal",
  ELITE: "battle.elite",
  BOSS: "battle.boss",
};

const TYPE_COLOR: Record<BattleType, string> = {
  NORMAL: "var(--parchment-300)",
  ELITE: "var(--gold-400)",
  BOSS: "var(--ember-400)",
};

export function Battle() {
  const { t } = useTranslation();
  const energy = useGameStore((s) => s.save.energy);
  const fightBattle = useGameStore((s) => s.fightBattle);
  const [busyStage, setBusyStage] = useState<string | null>(null);
  const [result, setResult] = useState<{ stageName: string; result: BattleResult } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleFight(stageId: string, stageName: string) {
    setErrorMsg(null);
    setBusyStage(stageId);
    haptic("medium");

    setTimeout(() => {
      const outcome = fightBattle(stageId);
      setBusyStage(null);
      if (!outcome.ok) {
        setErrorMsg(outcome.error === "INSUFFICIENT_ENERGY" ? t("error.insufficientEnergy") : t("error.generic"));
        return;
      }
      hapticNotification(outcome.result!.won ? "success" : "error");
      setResult({ stageName, result: outcome.result! });
    }, 500); // brief pause so the "Fighting..." state is perceptible
  }

  return (
    <div style={{ padding: "18px 18px 110px" }}>
      <h2 style={{ fontSize: 20, marginBottom: 14 }}>{t("battle.title")}</h2>

      {errorMsg && <Banner color="var(--danger-500)">{errorMsg}</Banner>}
      {result && (
        <Banner color={result.result.won ? "var(--moss-500)" : "var(--danger-500)"}>
          <strong>{result.result.won ? t("battle.victory") : t("battle.defeat")}</strong> — {result.stageName}
          <div style={{ marginTop: 4, fontSize: 12 }}>
            {t("battle.rewards", { coins: result.result.rewardCoins, gems: result.result.rewardGems, xp: result.result.rewardXp })}
          </div>
        </Banner>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {BATTLE_STAGES.map((stage) => {
          const disabled = busyStage === stage.id || energy < stage.energyCost;
          return (
            <div key={stage.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{stage.name}</div>
                <div style={{ fontSize: 11, color: TYPE_COLOR[stage.type], fontWeight: 700, marginTop: 2 }}>
                  {t(TYPE_LABEL_KEY[stage.type])} · {stage.enemyName}
                </div>
                <div style={{ fontSize: 11, color: "var(--parchment-300)", marginTop: 2 }}>
                  {t("battle.energyCost", { cost: stage.energyCost })}
                </div>
              </div>
              <button
                disabled={disabled}
                onClick={() => handleFight(stage.id, stage.name)}
                className="btn-primary"
                style={{ opacity: disabled ? 0.5 : 1, fontSize: 12, padding: "10px 16px" }}
              >
                {busyStage === stage.id ? t("battle.fighting") : t("battle.fight")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Banner({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: color,
        color: "var(--parchment-100)",
        padding: "10px 12px",
        borderRadius: "var(--radius-sm)",
        fontSize: 13,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}
