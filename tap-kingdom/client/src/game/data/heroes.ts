export type HeroRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";

export interface HeroConfig {
  key: string;
  name: string;
  rarity: HeroRarity;
  baseAttack: number;
  baseDefense: number;
  baseHealth: number;
  abilityName: string;
  abilityDescription: string;
  /** Free-recruit fragment cost (fragments earned from chests/missions/achievements — never Stars). */
  fragmentsToUnlock: number;
}

// 20 fully original heroes — no names, likenesses, or abilities borrowed
// from any existing game, film, anime, or book.
export const HEROES: HeroConfig[] = [
  // --- Common (4) ---
  { key: "darius_ironwall", name: "Darius Ironwall", rarity: "COMMON", baseAttack: 40, baseDefense: 70, baseHealth: 480, abilityName: "Shield Brace", abilityDescription: "Braces behind his shield, reducing incoming damage for 2 turns.", fragmentsToUnlock: 20 },
  { key: "brenna_shieldmaiden", name: "Brenna Shieldmaiden", rarity: "COMMON", baseAttack: 38, baseDefense: 65, baseHealth: 500, abilityName: "Guard Wall", abilityDescription: "Protects the front line, absorbing a portion of enemy attacks.", fragmentsToUnlock: 20 },
  { key: "tomas_steelfist", name: "Tomas Steelfist", rarity: "COMMON", baseAttack: 48, baseDefense: 45, baseHealth: 420, abilityName: "Iron Punch", abilityDescription: "A heavy strike with a chance to stun the enemy briefly.", fragmentsToUnlock: 20 },
  { key: "nella_quickhand", name: "Nella Quickhand", rarity: "COMMON", baseAttack: 46, baseDefense: 32, baseHealth: 380, abilityName: "Swift Strike", abilityDescription: "Attacks twice in quick succession for reduced damage each.", fragmentsToUnlock: 20 },

  // --- Rare (4) ---
  { key: "lyra_moonshot", name: "Lyra Moonshot", rarity: "RARE", baseAttack: 62, baseDefense: 34, baseHealth: 420, abilityName: "Moonlit Volley", abilityDescription: "Fires a spread of arrows that strike the enemy multiple times.", fragmentsToUnlock: 40 },
  { key: "orin_swiftarrow", name: "Orin Swiftarrow", rarity: "RARE", baseAttack: 58, baseDefense: 38, baseHealth: 440, abilityName: "Piercing Shot", abilityDescription: "An arrow that ignores a portion of enemy defense.", fragmentsToUnlock: 40 },
  { key: "freya_stormcaller", name: "Freya Stormcaller", rarity: "RARE", baseAttack: 64, baseDefense: 30, baseHealth: 400, abilityName: "Static Charge", abilityDescription: "Charges the battlefield with static, boosting her next attack.", fragmentsToUnlock: 40 },
  { key: "garrick_bramblewood", name: "Garrick Bramblewood", rarity: "RARE", baseAttack: 50, baseDefense: 55, baseHealth: 520, abilityName: "Thorn Snare", abilityDescription: "Entangles the enemy, lowering their attack for a turn.", fragmentsToUnlock: 40 },

  // --- Epic (4) ---
  { key: "elara_lightkeeper", name: "Elara Lightkeeper", rarity: "EPIC", baseAttack: 45, baseDefense: 50, baseHealth: 560, abilityName: "Healing Light", abilityDescription: "Restores a portion of the party's health.", fragmentsToUnlock: 70 },
  { key: "kael_stormborn", name: "Kael Stormborn", rarity: "EPIC", baseAttack: 78, baseDefense: 40, baseHealth: 500, abilityName: "Chain Lightning", abilityDescription: "Lightning arcs through the enemy for heavy magic damage.", fragmentsToUnlock: 70 },
  { key: "sylas_nightblade", name: "Sylas Nightblade", rarity: "EPIC", baseAttack: 82, baseDefense: 32, baseHealth: 460, abilityName: "Shadow Step", abilityDescription: "Vanishes and strikes from behind for bonus critical damage.", fragmentsToUnlock: 70 },
  { key: "maris_tidecaller", name: "Maris Tidecaller", rarity: "EPIC", baseAttack: 68, baseDefense: 46, baseHealth: 540, abilityName: "Tidal Surge", abilityDescription: "A wave of water damages the enemy and slows their next action.", fragmentsToUnlock: 70 },

  // --- Legendary (4) ---
  { key: "aric_flameguard", name: "Aric Flameguard", rarity: "LEGENDARY", baseAttack: 92, baseDefense: 58, baseHealth: 640, abilityName: "Inferno Charge", abilityDescription: "Charges through the enemy line wreathed in flame.", fragmentsToUnlock: 120 },
  { key: "thessaly_sunward", name: "Thessaly Sunward", rarity: "LEGENDARY", baseAttack: 74, baseDefense: 72, baseHealth: 700, abilityName: "Radiant Judgment", abilityDescription: "Calls down sunlight to smite the enemy and shield the team.", fragmentsToUnlock: 120 },
  { key: "bramwell_oakheart", name: "Bramwell Oakheart", rarity: "LEGENDARY", baseAttack: 70, baseDefense: 88, baseHealth: 780, abilityName: "Ancient Roots", abilityDescription: "Roots burst from the ground, damaging and slowing the enemy.", fragmentsToUnlock: 120 },
  { key: "ysolde_frostwhisper", name: "Ysolde Frostwhisper", rarity: "LEGENDARY", baseAttack: 88, baseDefense: 48, baseHealth: 600, abilityName: "Eternal Winter", abilityDescription: "Freezes the enemy, dealing damage over time.", fragmentsToUnlock: 120 },

  // --- Mythic (4) ---
  { key: "azurine_starforged", name: "Azurine Starforged", rarity: "MYTHIC", baseAttack: 105, baseDefense: 62, baseHealth: 720, abilityName: "Celestial Convergence", abilityDescription: "Channels starlight into a devastating burst of damage.", fragmentsToUnlock: 200 },
  { key: "draven_voidreaper", name: "Draven Voidreaper", rarity: "MYTHIC", baseAttack: 112, baseDefense: 50, baseHealth: 660, abilityName: "Void Rend", abilityDescription: "Tears open a rift that deals massive damage to the enemy.", fragmentsToUnlock: 200 },
  { key: "seraphel_dawnbringer", name: "Seraphel Dawnbringer", rarity: "MYTHIC", baseAttack: 90, baseDefense: 78, baseHealth: 800, abilityName: "Dawn's Reckoning", abilityDescription: "Bathes the battlefield in light, healing allies and smiting the foe.", fragmentsToUnlock: 200 },
  { key: "korrin_emberking", name: "Korrin Emberking", rarity: "MYTHIC", baseAttack: 108, baseDefense: 66, baseHealth: 740, abilityName: "Cataclysm of Flame", abilityDescription: "Engulfs the enemy in an unrelenting firestorm.", fragmentsToUnlock: 200 },
];

export function getHero(key: string): HeroConfig {
  const hero = HEROES.find((h) => h.key === key);
  if (!hero) throw new Error(`Unknown hero key: ${key}`);
  return hero;
}

export const HERO_RARITY_LEVEL_CAP: Record<HeroRarity, number> = {
  COMMON: 20,
  RARE: 30,
  EPIC: 40,
  LEGENDARY: 50,
  MYTHIC: 60,
};

export function getHeroLevelUpCost(rarity: HeroRarity, currentLevel: number): number {
  const base = { COMMON: 15, RARE: 25, EPIC: 40, LEGENDARY: 65, MYTHIC: 100 }[rarity];
  return Math.round(base * Math.pow(1.1, currentLevel - 1));
}

/** Power score used for battle strength and Kingdom Power — combat stays purely client-side since no Stars ride on the outcome. */
export function computeHeroPower(hero: HeroConfig, level: number): number {
  const raw = hero.baseAttack + hero.baseDefense + hero.baseHealth / 10;
  return Math.round(raw * (1 + (level - 1) * 0.06));
}
