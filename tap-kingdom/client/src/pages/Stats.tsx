import { useGameStore } from "../store/gameStore";
import { HEROES } from "../game/data/heroes";
import { useTranslation } from "../i18n/useTranslation";

export function Stats() {
  const { t } = useTranslation();
  const save = useGameStore((s) => s.save);
  const heroesUnlocked = Object.values(save.heroes).filter((h) => h.unlocked).length;

  const rows: [string, string | number][] = [
    [t("stats.taps"), save.stats.tapsTotal],
    [t("stats.battlesWon"), save.stats.battlesWon],
    [t("stats.heroesUnlocked"), `${heroesUnlocked}/${HEROES.length}`],
    [t("stats.kingdomLevel"), save.buildings.CASTLE?.level ?? 1],
    [t("stats.achievements"), save.achievementsClaimed.length],
  ];

  return (
    <div style={{ padding: "18px 18px 40px" }}>
      <h2 style={{ fontSize: 20, marginBottom: 14 }}>{t("stats.title")}</h2>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--parchment-300)" }}>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
