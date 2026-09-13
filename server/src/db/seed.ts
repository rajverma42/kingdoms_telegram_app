import { PrismaClient, Rarity } from "@prisma/client";

const prisma = new PrismaClient();

// Starter roster. Expand to the full 30-hero roster in Phase 6 —
// keep names/keys original, no copyrighted characters.
const HEROES: Array<{
  key: string; name: string; rarity: Rarity;
  baseAttack: number; baseDefense: number; baseHealth: number; baseSpeed: number;
  skillKey: string; ultimateKey: string;
}> = [
  { key: "aric_flame_knight", name: "Aric the Flame Knight", rarity: "EPIC", baseAttack: 85, baseDefense: 60, baseHealth: 900, baseSpeed: 45, skillKey: "flame_slash", ultimateKey: "inferno_charge" },
  { key: "lyra_moon_archer", name: "Lyra Moon Archer", rarity: "RARE", baseAttack: 95, baseDefense: 35, baseHealth: 650, baseSpeed: 65, skillKey: "moonlit_volley", ultimateKey: "silver_rain" },
  { key: "kael_storm_mage", name: "Kael Storm Mage", rarity: "LEGENDARY", baseAttack: 110, baseDefense: 40, baseHealth: 700, baseSpeed: 55, skillKey: "chain_lightning", ultimateKey: "tempest_call" },
  { key: "darius_iron_guard", name: "Darius Iron Guard", rarity: "COMMON", baseAttack: 55, baseDefense: 90, baseHealth: 1100, baseSpeed: 30, skillKey: "shield_wall", ultimateKey: "unbreakable" },
  { key: "elara_light_priest", name: "Elara Light Priest", rarity: "EPIC", baseAttack: 50, baseDefense: 45, baseHealth: 800, baseSpeed: 50, skillKey: "healing_light", ultimateKey: "dawn_blessing" },
  { key: "borin_stonefist", name: "Borin Stonefist", rarity: "RARE", baseAttack: 75, baseDefense: 70, baseHealth: 950, baseSpeed: 35, skillKey: "quake_punch", ultimateKey: "mountain_wrath" },
  { key: "sena_shadow_blade", name: "Sena Shadowblade", rarity: "MYTHIC", baseAttack: 130, baseDefense: 30, baseHealth: 600, baseSpeed: 80, skillKey: "shadow_step", ultimateKey: "thousand_cuts" },
  { key: "torin_beast_tamer", name: "Torin Beast Tamer", rarity: "RARE", baseAttack: 70, baseDefense: 50, baseHealth: 750, baseSpeed: 60, skillKey: "call_of_wild", ultimateKey: "primal_fury" },
  { key: "myla_frost_witch", name: "Myla Frost Witch", rarity: "EPIC", baseAttack: 90, baseDefense: 38, baseHealth: 680, baseSpeed: 52, skillKey: "frost_nova", ultimateKey: "eternal_winter" },
  { key: "gareth_dragon_rider", name: "Gareth Dragon Rider", rarity: "LEGENDARY", baseAttack: 100, baseDefense: 65, baseHealth: 1000, baseSpeed: 58, skillKey: "wing_strike", ultimateKey: "dragons_breath" },
];

async function main() {
  for (const hero of HEROES) {
    await prisma.hero.upsert({
      where: { key: hero.key },
      update: hero,
      create: hero,
    });
  }
  console.log(`Seeded ${HEROES.length} heroes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
