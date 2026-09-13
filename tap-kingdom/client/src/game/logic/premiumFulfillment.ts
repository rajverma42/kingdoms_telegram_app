import type { SaveData } from "../../store/persistence";
import { HEROES, type HeroRarity } from "../data/heroes";
import { getFreeChestReward } from "./economy";

function unlockRandomHero(save: SaveData, rarities: HeroRarity[]): void {
  const candidates = HEROES.filter((h) => rarities.includes(h.rarity) && !save.heroes[h.key]?.unlocked);
  if (candidates.length === 0) {
    // Everything in this rarity band is already owned — compensate with
    // fragments instead of silently doing nothing for a real purchase.
    save.heroFragments += 50;
    return;
  }
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  save.heroes[pick.key] = { unlocked: true, level: 1 };
}

function grantPremiumChest(save: SaveData, tier: "small" | "epic"): void {
  const reward = getFreeChestReward();
  const multiplier = tier === "epic" ? 3 : 1.5;
  save.coins += Math.round(reward.coins * multiplier);
  save.gems += Math.max(reward.gems, tier === "epic" ? 3 : 1);
  save.heroFragments += Math.max(reward.fragments, tier === "epic" ? 3 : 1);
  save.stats.chestsOpened += 1;
}

/**
 * Applies the actual in-game effect of a fulfilled Stars purchase. Called
 * exactly once per item id — the caller (gameStore.applyFulfilledPurchases)
 * guards against re-applying an id already present in ownedPremiumItems.
 * Cosmetic-only items (weapons, skins) need no effect here beyond the
 * ownership flag the caller records; this function only exists for items
 * with a gameplay-facing unlock.
 */
export function applyShopItemEffect(save: SaveData, itemId: string): void {
  switch (itemId) {
    case "basic_hero":
      unlockRandomHero(save, ["COMMON", "RARE"]);
      break;
    case "rare_hero":
      unlockRandomHero(save, ["RARE", "EPIC"]);
      break;
    case "legendary_hero":
      unlockRandomHero(save, ["LEGENDARY"]);
      break;
    case "hero_upgrade_token":
      save.heroUpgradeTokens += 1;
      break;
    case "small_premium_chest":
      grantPremiumChest(save, "small");
      break;
    case "epic_chest":
      grantPremiumChest(save, "epic");
      break;
    case "ultimate_bundle":
      unlockRandomHero(save, ["LEGENDARY", "MYTHIC"]);
      grantPremiumChest(save, "epic");
      break;
    case "premium_weapon":
    case "exclusive_skin":
    case "premium_kingdom_skin":
      // Cosmetic-only — ownership alone (recorded by the caller) is the entire effect.
      break;
    default:
      // Unknown id: nothing to apply. The bot is the source of truth for
      // what products exist, so this should never happen for a real payment.
      break;
  }
}
