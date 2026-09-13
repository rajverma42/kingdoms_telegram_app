import { useGameStore } from "../store/gameStore";
import { DAILY_REWARDS } from "../game/data/dailyRewards";
import { useTranslation } from "../i18n/useTranslation";
import { haptic, hapticNotification } from "../telegram/webApp";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyRewards() {
  const { t } = useTranslation();
  const dailyReward = useGameStore((s) => s.save.dailyReward);
  const claimDailyReward = useGameStore((s) => s.claimDailyReward);
  const claimedToday = dailyReward.lastClaimDay === todayKey();
  // The cycle day that's either just been claimed (today) or is next up to claim.
  const activeDayIndex = claimedToday
    ? ((dailyReward.streak - 1) % 7) + 1
    : (dailyReward.streak % 7) + 1;

  function handleClaim() {
    haptic("medium");
    const outcome = claimDailyReward();
    hapticNotification(outcome.ok ? "success" : "error");
  }

  return (
    <div style={{ padding: "18px 18px 40px" }}>
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>{t("dailyReward.title")}</h2>
      <p style={{ fontSize: 12, color: "var(--parchment-300)", marginBottom: 14 }}>
        {t("dailyReward.streak", { streak: dailyReward.streak })}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        {DAILY_REWARDS.map((reward) => {
          const isToday = reward.day === activeDayIndex;
          const isPast = claimedToday && reward.day < activeDayIndex;
          return (
            <div
              key={reward.day}
              className="card"
              style={{
                padding: 8,
                textAlign: "center",
                borderColor: isToday ? "var(--gold-400)" : "var(--stone-700)",
                opacity: isPast && !isToday ? 0.5 : 1,
              }}
            >
              <div style={{ fontSize: 10, color: "var(--parchment-300)" }}>{t("dailyReward.day", { day: reward.day })}</div>
              <div style={{ fontSize: 11, marginTop: 4, fontWeight: 700 }}>{reward.label}</div>
            </div>
          );
        })}
      </div>

      <button className="btn-primary" style={{ width: "100%" }} disabled={claimedToday} onClick={handleClaim}>
        {claimedToday ? t("dailyReward.claimed") : t("dailyReward.claim")}
      </button>
    </div>
  );
}
