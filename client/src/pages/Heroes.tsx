import { useEffect, useMemo, useState } from "react";
import { api, ApiRequestError, type HeroDto, type KingdomDto } from "../api/client";
import { useTranslation } from "../hooks/useTranslation";
import { haptic } from "../telegram/telegramSdk";

interface Props {
  kingdom: KingdomDto;
  onKingdomChange: (kingdom: KingdomDto) => void;
}

const RARITY_COLOR: Record<string, string> = {
  COMMON: "var(--parchment-300)",
  RARE: "var(--moss-600)",
  EPIC: "var(--gold-400)",
  LEGENDARY: "var(--ember-500)",
  MYTHIC: "var(--mythic-600)",
};

export function Heroes({ kingdom, onKingdomChange }: Props) {
  const { t } = useTranslation();
  const [teamSize, setTeamSize] = useState(0);
  const [heroes, setHeroes] = useState<HeroDto[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const roster = await api.getHeroes();
    setTeamSize(roster.teamSize);
    setHeroes(roster.heroes);
  }

  useEffect(() => {
    refresh()
      .catch(() => setErrorMsg(t("error.generic")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const equippedCount = useMemo(
    () => heroes.filter((h) => h.owned && h.equipSlot != null).length,
    [heroes]
  );

  function nextFreeSlot(): number {
    const used = new Set(heroes.filter((h) => h.owned && h.equipSlot != null).map((h) => (h as { equipSlot: number }).equipSlot));
    for (let i = 0; i < teamSize; i++) {
      if (!used.has(i)) return i;
    }
    return -1;
  }

  async function run(heroKey: string, action: () => Promise<unknown>) {
    setErrorMsg(null);
    setBusyKey(heroKey);
    haptic("medium");
    try {
      await action();
      await refresh();
      const fresh = await api.getKingdom();
      onKingdomChange(fresh);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrorMsg(
          err.code === "INSUFFICIENT_GOLD"
            ? t("error.insufficientGold")
            : err.code === "INSUFFICIENT_GEMS"
            ? t("error.insufficientGems")
            : err.message
        );
      } else {
        setErrorMsg(t("error.generic"));
      }
    } finally {
      setBusyKey(null);
    }
  }

  if (loading) {
    return null;
  }

  return (
    <div style={{ padding: 20, paddingBottom: 100 }}>
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>{t("hero.title")}</h2>
      <p style={{ fontSize: 12, color: "var(--parchment-300)", marginBottom: 14 }}>
        {t("hero.teamCount", { count: equippedCount, max: teamSize })}
      </p>

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
        {heroes.map((hero) => (
          <HeroRow
            key={hero.key}
            hero={hero}
            busy={busyKey === hero.key}
            teamFull={equippedCount >= teamSize}
            onRecruit={() => run(hero.key, () => api.recruitHero(hero.key))}
            onLevelUp={() => run(hero.key, () => api.levelUpHero(hero.key))}
            onRankUp={() => run(hero.key, () => api.rankUpHero(hero.key))}
            onEquip={() => run(hero.key, () => api.equipHero(hero.key, nextFreeSlot()))}
            onUnequip={() => run(hero.key, () => api.unequipHero(hero.key))}
          />
        ))}
      </div>
    </div>
  );
}

function HeroRow({
  hero,
  busy,
  teamFull,
  onRecruit,
  onLevelUp,
  onRankUp,
  onEquip,
  onUnequip,
}: {
  hero: HeroDto;
  busy: boolean;
  teamFull: boolean;
  onRecruit: () => void;
  onLevelUp: () => void;
  onRankUp: () => void;
  onEquip: () => void;
  onUnequip: () => void;
}) {
  const { t } = useTranslation();
  const color = RARITY_COLOR[hero.rarity] ?? "var(--parchment-300)";
  const isEquipped = hero.owned && hero.equipSlot != null;

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: "var(--stone-800)",
        border: `1px solid ${isEquipped ? color : "var(--stone-700)"}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{hero.name}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: 2 }}>{hero.rarity}</div>
        </div>
        {hero.owned && (
          <div style={{ textAlign: "right", fontSize: 12, color: "var(--parchment-300)" }}>
            <div>{t("hero.level", { level: hero.level, cap: hero.levelCap })}</div>
            <div>{t("hero.rank", { rank: hero.rank, max: hero.maxRank })}</div>
            <div>{t("hero.power", { power: hero.power })}</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {!hero.owned && (
          <ActionButton disabled={busy} onClick={onRecruit} primary>
            {t("hero.recruit")} · {t("hero.recruitCost", { cost: hero.recruitGoldCost })}
          </ActionButton>
        )}

        {hero.owned && hero.nextLevelCost != null && (
          <ActionButton disabled={busy} onClick={onLevelUp}>
            {t("hero.levelUp")} · {t("hero.levelUpCost", { cost: hero.nextLevelCost })}
          </ActionButton>
        )}

        {hero.owned && hero.nextRankCost && (
          <ActionButton disabled={busy} onClick={onRankUp} primary>
            {t("hero.rankUp")} · {t("hero.rankUpCost", { gold: hero.nextRankCost.gold, gems: hero.nextRankCost.gems })}
          </ActionButton>
        )}

        {hero.owned && !isEquipped && (
          <ActionButton disabled={busy || teamFull} onClick={onEquip}>
            {teamFull ? t("hero.teamFull") : t("hero.equip")}
          </ActionButton>
        )}

        {hero.owned && isEquipped && (
          <ActionButton disabled={busy} onClick={onUnequip}>
            {t("hero.unequip")}
          </ActionButton>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: "var(--radius-sm)",
        background: primary ? "var(--ember-500)" : "var(--stone-700)",
        color: primary ? "var(--ink-950)" : "var(--parchment-100)",
        fontWeight: 700,
        fontSize: 11,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
