import { useEffect, useState } from "react";
import { api, ApiRequestError, type BattleResultDto, type KingdomDto, type StageDto } from "../api/client";
import { useTranslation } from "../hooks/useTranslation";
import { haptic } from "../telegram/telegramSdk";

interface Props {
  kingdom: KingdomDto;
  onKingdomChange: (kingdom: KingdomDto) => void;
}

export function Battle({ kingdom, onKingdomChange }: Props) {
  const { t } = useTranslation();
  const [stages, setStages] = useState<StageDto[]>([]);
  const [busyStage, setBusyStage] = useState<string | null>(null);
  const [result, setResult] = useState<BattleResultDto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getStages().then(setStages).catch(() => setErrorMsg(t("error.generic")));
  }, [t]);

  async function handleFight(stage: StageDto) {
    setErrorMsg(null);
    setResult(null);
    setBusyStage(stage.id);
    haptic("medium");
    try {
      const { battleId } = await api.startBattle(stage.id);
      // In a fuller build this is where the battle animation plays while the
      // server result is fetched; here we resolve immediately since outcome
      // is already server-decided at this point.
      const outcome = await api.completeBattle(battleId);
      setResult(outcome);
      const fresh = await api.getKingdom();
      onKingdomChange(fresh);
    } catch (err) {
      if (err instanceof ApiRequestError && err.code === "INSUFFICIENT_ENERGY") {
        setErrorMsg(t("error.insufficientEnergy"));
      } else {
        setErrorMsg(t("error.generic"));
      }
    } finally {
      setBusyStage(null);
    }
  }

  return (
    <div style={{ padding: 20, paddingBottom: 100 }}>
      <h2 style={{ fontSize: 20, marginBottom: 14 }}>{t("battle.title")}</h2>

      {errorMsg && <Banner color="var(--danger-500)">{errorMsg}</Banner>}
      {result && (
        <Banner color={result.outcome === "WIN" ? "var(--moss-600)" : "var(--danger-500)"}>
          <strong>{result.outcome === "WIN" ? t("battle.win") : t("battle.lose")}</strong>
          <div style={{ marginTop: 4, fontSize: 12 }}>
            {t("battle.rewards", { gold: result.rewardGold, gems: result.rewardGems, xp: result.rewardXp })}
          </div>
        </Banner>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {stages.map((stage) => {
          const disabled = busyStage === stage.id || kingdom.energy < stage.energyCost;
          return (
            <div
              key={stage.id}
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
                <div style={{ fontWeight: 600, fontSize: 14 }}>{stage.name}</div>
                <div style={{ fontSize: 12, color: "var(--parchment-300)", marginTop: 2 }}>
                  {stage.type} · {t("battle.energyCost", { cost: stage.energyCost })}
                </div>
              </div>
              <button
                disabled={disabled}
                onClick={() => handleFight(stage)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--ember-500)",
                  color: "var(--ink-950)",
                  fontWeight: 700,
                  fontSize: 12,
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                {busyStage === stage.id ? t("battle.resolving") : t("battle.fight")}
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
