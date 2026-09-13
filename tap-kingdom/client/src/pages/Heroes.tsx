import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { HEROES, HERO_RARITY_LEVEL_CAP, getHeroLevelUpCost, computeHeroPower, type HeroRarity } from "../game/data/heroes";
import { useTranslation } from "../i18n/useTranslation";
import { haptic } from "../telegram/webApp";

const RARITY_COLOR: Record<HeroRarity, string> = {
  COMMON: "var(--parchment-300)",
  RARE: "var(--moss-500)",
  EPIC: "var(--gold-400)",
  LEGENDARY: "var(--ember-400)",
  MYTHIC: "var(--mythic-500)",
};

export function Heroes() {
  const { t } = useTranslation();
  const save = useGameStore((s) => s.save);
  const unlockHeroWithFragments = useGameStore((s) => s.unlockHeroWithFragments);
  const levelUpHero = useGameStore((s) => s.levelUpHero);
  const useHeroUpgradeToken = useGameStore((s) => s.useHeroUpgradeToken);
  const equipHeroSkin = useGameStore((s) => s.equipHeroSkin);
  const equipHeroWeapon = useGameStore((s) => s.equipHeroWeapon);
  const ownsSkin = save.ownedCosmeticItemIds.includes("exclusive_skin");
  const ownsWeapon = save.ownedCosmeticItemIds.includes("premium_weapon");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function run(key: string, action: () => { ok: boolean; error?: string }) {
    setErrorMsg(null);
    setBusyKey(key);
    haptic("medium");
    const outcome = action();
    setBusyKey(null);
    if (!outcome.ok) {
      setErrorMsg(
        outcome.error === "INSUFFICIENT_COINS"
          ? t("error.insufficientCoins")
          : outcome.error === "INSUFFICIENT_FRAGMENTS"
          ? t("error.insufficientFragments")
          : t("error.generic")
      );
    }
  }

  return (
    <div style={{ padding: "18px 18px 110px" }}>
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>{t("heroes.title")}</h2>
      <p style={{ fontSize: 12, color: "var(--parchment-300)", marginBottom: 14 }}>
        💠 {save.heroFragments} · {t("heroes.tokens", { count: save.heroUpgradeTokens })}
      </p>

      {errorMsg && (
        <div style={{ background: "var(--danger-500)", color: "var(--parchment-100)", padding: "10px 12px", borderRadius: "var(--radius-sm)", fontSize: 13, marginBottom: 12 }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {HEROES.map((hero) => {
          const state = save.heroes[hero.key];
          const owned = !!state?.unlocked;
          const level = state?.level ?? 0;
          const cap = HERO_RARITY_LEVEL_CAP[hero.rarity];
          const color = RARITY_COLOR[hero.rarity];
          const hasSkin = save.equippedSkinHeroKey === hero.key;
          const hasWeapon = save.equippedWeaponHeroKey === hero.key;

          return (
            <div
              key={hero.key}
              className="card"
              style={{
                borderColor: owned ? color : "var(--stone-700)",
                boxShadow: hasSkin || hasWeapon ? "var(--shadow-glow)" : undefined,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{hero.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: 2 }}>{hero.rarity}</div>
                  {(hasSkin || hasWeapon) && (
                    <div style={{ fontSize: 11, color: "var(--gold-400)", marginTop: 2 }}>
                      {hasSkin && t("heroes.skinBadge")} {hasWeapon && t("heroes.weaponBadge")}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "var(--parchment-300)", marginTop: 4, maxWidth: 220 }}>
                    <strong>{hero.abilityName}:</strong> {hero.abilityDescription}
                  </div>
                </div>
                {owned && (
                  <div style={{ textAlign: "right", fontSize: 11, color: "var(--parchment-300)" }}>
                    <div>Lv. {level}/{cap}</div>
                    <div>{computeHeroPower(hero, level)} PWR</div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {!owned && (
                  <ActionButton
                    disabled={busyKey === hero.key}
                    onClick={() => run(hero.key, () => unlockHeroWithFragments(hero.key))}
                    primary
                  >
                    {t("heroes.unlock", { cost: hero.fragmentsToUnlock })}
                  </ActionButton>
                )}
                {owned && level < cap && (
                  <ActionButton disabled={busyKey === hero.key} onClick={() => run(hero.key, () => levelUpHero(hero.key))}>
                    {t("heroes.levelUp", { cost: getHeroLevelUpCost(hero.rarity, level) })}
                  </ActionButton>
                )}
                {owned && level >= cap && <span style={{ fontSize: 11, color: "var(--parchment-300)" }}>{t("heroes.maxLevel")}</span>}
                {owned && level < cap && save.heroUpgradeTokens > 0 && (
                  <ActionButton disabled={busyKey === hero.key} onClick={() => run(hero.key, () => useHeroUpgradeToken(hero.key))} primary>
                    {t("heroes.useToken")}
                  </ActionButton>
                )}
                {owned && ownsSkin && (
                  <ActionButton
                    disabled={busyKey === hero.key}
                    onClick={() => run(hero.key, () => equipHeroSkin(hasSkin ? null : hero.key))}
                  >
                    {hasSkin ? t("heroes.unequipSkin") : t("heroes.equipSkin")}
                  </ActionButton>
                )}
                {owned && ownsWeapon && (
                  <ActionButton
                    disabled={busyKey === hero.key}
                    onClick={() => run(hero.key, () => equipHeroWeapon(hasWeapon ? null : hero.key))}
                  >
                    {hasWeapon ? t("heroes.unequipWeapon") : t("heroes.equipWeapon")}
                  </ActionButton>
                )}
              </div>
            </div>
          );
        })}
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
    <button disabled={disabled} onClick={onClick} className={primary ? "btn-primary" : "btn-secondary"} style={{ fontSize: 11, padding: "8px 12px", opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}
