export interface Product {
  id: string;
  title: string;
  description: string;
  priceStars: number;
}

/**
 * The single source of truth for what can be bought and at what price.
 * client/src/game/data/shopItems.ts mirrors this list for display only —
 * this file is what the invoice is actually built from, so a client-side
 * price is never trusted for anything.
 *
 * Every price is between 1 and 50 Telegram Stars, per the business rules
 * for this game — enforced below at module load rather than left as a
 * convention someone could silently break.
 */
export const PRODUCTS: Product[] = [
  { id: "basic_hero", title: "Basic Hero Pack", description: "Instantly recruit a random Common or Rare hero.", priceStars: 1 },
  { id: "small_premium_chest", title: "Small Premium Chest", description: "A chest with better odds than free chests.", priceStars: 3 },
  { id: "rare_hero", title: "Rare Hero Pack", description: "Instantly recruit a random Rare or Epic hero.", priceStars: 5 },
  { id: "hero_upgrade_token", title: "Hero Upgrade Token", description: "Instantly grants 10 levels to a hero of your choice.", priceStars: 8 },
  { id: "premium_weapon", title: "Premium Weapon: Dawnfang", description: "An exclusive cosmetic weapon skin.", priceStars: 10 },
  { id: "epic_chest", title: "Epic Chest", description: "Guaranteed Epic-or-better rewards.", priceStars: 15 },
  { id: "exclusive_skin", title: "Exclusive Hero Skin: Emberfall", description: "A striking cosmetic hero skin.", priceStars: 20 },
  { id: "legendary_hero", title: "Legendary Hero Pack", description: "Instantly recruit a random Legendary hero.", priceStars: 30 },
  { id: "premium_kingdom_skin", title: "Premium Kingdom Skin: Twilight Spire", description: "A premium visual theme for your kingdom.", priceStars: 40 },
  { id: "ultimate_bundle", title: "Ultimate Premium Bundle", description: "A Legendary hero, an Epic chest, a premium weapon, and an exclusive skin.", priceStars: 50 },
];

for (const product of PRODUCTS) {
  if (product.priceStars < 1 || product.priceStars > 50) {
    throw new Error(`Product "${product.id}" has an out-of-range Stars price: ${product.priceStars}`);
  }
}

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
