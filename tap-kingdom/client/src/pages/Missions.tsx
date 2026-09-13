import { useGameStore, missionMetricValue } from "../store/gameStore";
import { MISSIONS } from "../game/data/missions";
import { useTranslation } from "../i18n/useTranslation";
import { haptic } from "../telegram/webApp";

export function Missions() {
  const { t } = useTranslation();
  const save = useGameStore((s) => s.save);
  const claimMission = useGameStore((s) => s.claimMission);

  return (
    <div style={{ padding: "18px 18px 40px" }}>
      <h2 style={{ fontSize: 20, marginBottom: 14 }}>{t("missions.title")}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {MISSIONS.map((mission) => {
          const progress = Math.max(0, missionMetricValue(save, mission.metric) - (save.missionState.baseline[mission.metric] ?? 0));
          const complete = progress >= mission.target;
          const claimed = save.missionState.claimed.includes(mission.id);

          return (
            <div key={mission.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{mission.label}</div>
                  <div style={{ fontSize: 11, color: "var(--parchment-300)", marginTop: 2 }}>
                    {t("missions.progress", { current: Math.min(progress, mission.target), target: mission.target })}
                  </div>
                </div>
                <button
                  disabled={!complete || claimed}
                  onClick={() => {
                    haptic("medium");
                    claimMission(mission.id);
                  }}
                  className="btn-primary"
                  style={{ fontSize: 12, padding: "8px 14px", opacity: !complete || claimed ? 0.5 : 1 }}
                >
                  {claimed ? t("missions.claimed") : t("missions.claim")}
                </button>
              </div>
              <div className="progress-track" style={{ marginTop: 8 }}>
                <div className="progress-fill" style={{ width: `${Math.min(100, (progress / mission.target) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
