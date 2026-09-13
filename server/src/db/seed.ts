import { PrismaClient, Rarity } from "@prisma/client";

const prisma = new PrismaClient();

// Full 30-hero roster (Phase 6) — keep names/keys original, no copyrighted characters.
const HEROES: Array<{
  key: string; name: string; rarity: Rarity;
  baseAttack: number; baseDefense: number; baseHealth: number; baseSpeed: number;
  skillKey: string; ultimateKey: string;
}> = [
  // --- original starter slice ---
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

  // --- Phase 6 additions ---
  { key: "brant_oak_shield", name: "Brant Oakshield", rarity: "COMMON", baseAttack: 50, baseDefense: 85, baseHealth: 1050, baseSpeed: 28, skillKey: "oak_guard", ultimateKey: "timber_wall" },
  { key: "fenna_river_scout", name: "Fenna River Scout", rarity: "COMMON", baseAttack: 60, baseDefense: 40, baseHealth: 700, baseSpeed: 70, skillKey: "river_dash", ultimateKey: "swift_current" },
  { key: "hollis_pike_bearer", name: "Hollis Pikebearer", rarity: "COMMON", baseAttack: 58, baseDefense: 65, baseHealth: 850, baseSpeed: 38, skillKey: "pike_thrust", ultimateKey: "phalanx_break" },
  { key: "wren_hearth_healer", name: "Wren Hearth Healer", rarity: "COMMON", baseAttack: 40, baseDefense: 50, baseHealth: 780, baseSpeed: 45, skillKey: "hearth_mend", ultimateKey: "warm_hearth" },
  { key: "corin_torch_bearer", name: "Corin Torchbearer", rarity: "COMMON", baseAttack: 65, baseDefense: 45, baseHealth: 720, baseSpeed: 50, skillKey: "torch_swing", ultimateKey: "blazing_arc" },

  { key: "ilsa_wind_dancer", name: "Ilsa Wind Dancer", rarity: "RARE", baseAttack: 88, baseDefense: 38, baseHealth: 660, baseSpeed: 75, skillKey: "gale_step", ultimateKey: "cyclone_dance" },
  { key: "orrin_night_watch", name: "Orrin Nightwatch", rarity: "RARE", baseAttack: 72, baseDefense: 72, baseHealth: 900, baseSpeed: 40, skillKey: "watchful_strike", ultimateKey: "midnight_vigil" },
  { key: "sable_thorn_ranger", name: "Sable Thornranger", rarity: "RARE", baseAttack: 92, baseDefense: 33, baseHealth: 640, baseSpeed: 68, skillKey: "thorn_volley", ultimateKey: "briar_storm" },
  { key: "dagna_forge_smith", name: "Dagna Forgesmith", rarity: "RARE", baseAttack: 68, baseDefense: 78, baseHealth: 980, baseSpeed: 32, skillKey: "molten_hammer", ultimateKey: "forgefire" },
  { key: "peregrin_swift_blade", name: "Peregrin Swiftblade", rarity: "RARE", baseAttack: 96, baseDefense: 30, baseHealth: 610, baseSpeed: 82, skillKey: "blade_flurry", ultimateKey: "windcut_barrage" },

  { key: "cass_ember_seer", name: "Cass Ember Seer", rarity: "EPIC", baseAttack: 98, baseDefense: 42, baseHealth: 720, baseSpeed: 58, skillKey: "ember_sight", ultimateKey: "prophetic_blaze" },
  { key: "thessaly_grove_warden", name: "Thessaly Grove Warden", rarity: "EPIC", baseAttack: 70, baseDefense: 80, baseHealth: 980, baseSpeed: 42, skillKey: "root_snare", ultimateKey: "ancient_grove" },
  { key: "varek_bloodfang", name: "Varek Bloodfang", rarity: "EPIC", baseAttack: 105, baseDefense: 48, baseHealth: 760, baseSpeed: 62, skillKey: "fang_rend", ultimateKey: "feral_frenzy" },
  { key: "isolde_tide_caller", name: "Isolde Tide Caller", rarity: "EPIC", baseAttack: 88, baseDefense: 50, baseHealth: 820, baseSpeed: 55, skillKey: "tidal_surge", ultimateKey: "maelstrom_call" },
  { key: "roderic_sun_paladin", name: "Roderic Sun Paladin", rarity: "EPIC", baseAttack: 80, baseDefense: 85, baseHealth: 1050, baseSpeed: 40, skillKey: "sun_smite", ultimateKey: "radiant_judgment" },

  { key: "nyx_void_walker", name: "Nyx Voidwalker", rarity: "LEGENDARY", baseAttack: 115, baseDefense: 45, baseHealth: 750, baseSpeed: 70, skillKey: "void_step", ultimateKey: "eclipse_rend" },
  { key: "brannoc_thunder_king", name: "Brannoc Thunder King", rarity: "LEGENDARY", baseAttack: 108, baseDefense: 75, baseHealth: 1050, baseSpeed: 48, skillKey: "thunder_crown", ultimateKey: "storm_sovereign" },
  { key: "seraphine_dawnblade", name: "Seraphine Dawnblade", rarity: "LEGENDARY", baseAttack: 112, baseDefense: 58, baseHealth: 880, baseSpeed: 60, skillKey: "dawn_cut", ultimateKey: "sunrise_reckoning" },

  { key: "azrael_ember_sovereign", name: "Azrael Ember Sovereign", rarity: "MYTHIC", baseAttack: 135, baseDefense: 55, baseHealth: 820, baseSpeed: 75, skillKey: "ember_reign", ultimateKey: "cataclysm_of_flame" },
  { key: "lunara_starweaver", name: "Lunara Starweaver", rarity: "MYTHIC", baseAttack: 125, baseDefense: 50, baseHealth: 780, baseSpeed: 85, skillKey: "starweave", ultimateKey: "celestial_convergence" },
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
