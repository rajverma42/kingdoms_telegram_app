export type ShopCategory = "FEATURED" | "HEROES" | "SKINS" | "WEAPONS" | "CHESTS" | "BUNDLES";

export interface ShopItem {
  /** Must exactly match the `id` in bot/src/payments/products.ts — the bot is the price authority, this is display-only. */
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  priceStars: number;
  icon: string;
  featured?: boolean;
}

// DISPLAY CATALOG ONLY. The Stars price shown here must always match
// bot/src/payments/products.ts exactly, because the bot — not this file —
// is what actually charges the user and decides what gets fulfilled. If
// you change a price, change it in both places.
export const SHOP_ITEMS: ShopItem[] = [
  { id: "basic_hero", name: "Basic Hero Pack", description: "Instantly recruit a random Common or Rare hero.", category: "HEROES", priceStars: 1, icon: "🗡️", featured: true },
  { id: "small_premium_chest", name: "Small Premium Chest", description: "A chest with better odds than free chests — coins, gems, and fragments.", category: "CHESTS", priceStars: 3, icon: "🎁" },
  { id: "rare_hero", name: "Rare Hero Pack", description: "Instantly recruit a random Rare or Epic hero.", category: "HEROES", priceStars: 5, icon: "⚔️", featured: true },
  { id: "hero_upgrade_token", name: "Hero Upgrade Token", description: "Instantly grants 10 levels to a hero of your choice.", category: "HEROES", priceStars: 8, icon: "📯" },
  { id: "premium_weapon", name: "Premium Weapon: Dawnfang", description: "An exclusive cosmetic weapon skin for your heroes.", category: "WEAPONS", priceStars: 10, icon: "🔱" },
  { id: "epic_chest", name: "Epic Chest", description: "Guaranteed Epic-or-better rewards: coins, gems, and hero fragments.", category: "CHESTS", priceStars: 15, icon: "🧰" },
  { id: "exclusive_skin", name: "Exclusive Hero Skin: Emberfall", description: "A striking cosmetic skin for one of your heroes.", category: "SKINS", priceStars: 20, icon: "🎨" },
  { id: "legendary_hero", name: "Legendary Hero Pack", description: "Instantly recruit a random Legendary hero.", category: "HEROES", priceStars: 30, icon: "🏆", featured: true },
  { id: "premium_kingdom_skin", name: "Premium Kingdom Skin: Twilight Spire", description: "Transforms your castle and kingdom backdrop with a premium visual theme.", category: "SKINS", priceStars: 40, icon: "🏰" },
  { id: "ultimate_bundle", name: "Ultimate Premium Bundle", description: "A Legendary hero, an Epic chest, a premium weapon, and an exclusive skin — all in one.", category: "BUNDLES", priceStars: 50, icon: "💎", featured: true },
];

export function getShopItem(id: string): ShopItem {
  const item = SHOP_ITEMS.find((i) => i.id === id);
  if (!item) throw new Error(`Unknown shop item: ${id}`);
  return item;
}
