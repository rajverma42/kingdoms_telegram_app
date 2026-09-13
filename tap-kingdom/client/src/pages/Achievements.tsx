import { useGameStore, achievementMetricValue } from "../store/gameStore";
import { ACHIEVEMENTS } from "../game/data/achievements";
import { useTranslation } from "../i18n/useTranslation";
import { haptic } from "../telegram/webApp";

export function Achievements() {
  const { t } = useTranslation();
  const save = useGameStore((s) => s.save);
  const claimAchievement = useGameStore((s) => s.claimAchievement);

  return (
    <div style={{ padding: "18px 18px 40px" }}>
      <h2 style={{ fontSize: 20, marginBottom: 14 }}>{t("achievements.title")}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ACHIEVEMENTS.map((achievement) => {
          const value = achievementMetricValue(save, achievement.metric);
          const complete = value >= achievement.target;
          const claimed = save.achievementsClaimed.includes(achievement.id);

          return (
            <div key={achievement.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{achievement.name}</div>
                <div style={{ fontSize: 11, color: "var(--parchment-300)", marginTop: 2 }}>
                  {t("achievements.locked", { current: Math.min(value, achievement.target), target: achievement.target })}
                </div>
              </div>
              <button
                disabled={!complete || claimed}
                onClick={() => {
                  haptic("medium");
                  claimAchievement(achievement.id);
                }}
                className="btn-primary"
                style={{ fontSize: 11, padding: "8px 12px", opacity: !complete || claimed ? 0.5 : 1 }}
              >
                {claimed ? t("achievements.claimed") : t("achievements.claim")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
