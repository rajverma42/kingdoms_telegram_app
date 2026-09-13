import { useState } from "react";
import { SHOP_ITEMS, type ShopCategory, type ShopItem } from "../game/data/shopItems";
import { useGameStore } from "../store/gameStore";
import { purchaseItem } from "../payments/purchaseFlow";
import { isInsideTelegram, hapticNotification } from "../telegram/webApp";
import { useTranslation } from "../i18n/useTranslation";
import { Modal } from "../components/Modal";

const CATEGORY_ORDER: ShopCategory[] = ["FEATURED", "HEROES", "SKINS", "WEAPONS", "CHESTS", "BUNDLES"];
const CATEGORY_LABEL_KEY: Record<ShopCategory, "shop.featured" | "shop.heroes" | "shop.skins" | "shop.weapons" | "shop.chests" | "shop.bundles"> = {
  FEATURED: "shop.featured",
  HEROES: "shop.heroes",
  SKINS: "shop.skins",
  WEAPONS: "shop.weapons",
  CHESTS: "shop.chests",
  BUNDLES: "shop.bundles",
};

const COSMETIC_CATEGORIES: ShopCategory[] = ["SKINS", "WEAPONS"];

export function Shop() {
  const { t } = useTranslation();
  const ownedCosmetics = useGameStore((s) => s.save.ownedCosmeticItemIds);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successItem, setSuccessItem] = useState<ShopItem | null>(null);
  const insideTelegram = isInsideTelegram();

  async function handleBuy(item: ShopItem) {
    setErrorMsg(null);
    setBusyId(item.id);
    const outcome = await purchaseItem(item.id);
    setBusyId(null);

    switch (outcome) {
      case "paid":
        // Fulfillment already happened inside purchaseItem() via the store's
        // idempotent, charge-id-keyed apply — this success screen is purely UI.
        hapticNotification("success");
        setSuccessItem(item);
        break;
      case "cancelled":
        setErrorMsg(t("purchase.cancelled"));
        break;
      case "pending":
        setErrorMsg(t("purchase.pending"));
        break;
      case "network_error":
        setErrorMsg(t("error.network"));
        break;
      case "failed":
      default:
        hapticNotification("error");
        setErrorMsg(t("purchase.failed"));
        break;
    }
  }

  return (
    <div style={{ padding: "18px 18px 110px" }}>
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>{t("shop.title")}</h2>
      {!insideTelegram && (
        <p style={{ fontSize: 12, color: "var(--parchment-300)", marginBottom: 12 }}>{t("shop.notInTelegram")}</p>
      )}

      {errorMsg && (
        <div style={{ background: "var(--danger-500)", color: "var(--parchment-100)", padding: "10px 12px", borderRadius: "var(--radius-sm)", fontSize: 13, marginBottom: 12 }}>
          {errorMsg}
        </div>
      )}

      {CATEGORY_ORDER.map((category) => {
        const items = SHOP_ITEMS.filter((i) => (category === "FEATURED" ? i.featured : i.category === category));
        if (items.length === 0) return null;
        return (
          <div key={category} style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 8, color: "var(--parchment-300)" }}>{t(CATEGORY_LABEL_KEY[category])}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((item) => {
                // Only cosmetics are a true one-time purchase — heroes,
                // chests, tokens, and bundles are consumable and may be
                // bought again for another random hero, another chest, etc.
                const isOwnedCosmetic = COSMETIC_CATEGORIES.includes(item.category) && ownedCosmetics.includes(item.id);
                return (
                  <div key={`${category}-${item.id}`} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                      <span style={{ fontSize: 26 }}>{item.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: "var(--parchment-300)", marginTop: 2 }}>{item.description}</div>
                      </div>
                    </div>
                    <button
                      disabled={busyId === item.id || !insideTelegram || isOwnedCosmetic}
                      onClick={() => handleBuy(item)}
                      className="btn-primary"
                      style={{ fontSize: 12, padding: "10px 14px", whiteSpace: "nowrap", opacity: !insideTelegram ? 0.5 : 1 }}
                    >
                      {busyId === item.id ? t("shop.purchasing") : isOwnedCosmetic ? t("shop.owned") : `⭐ ${item.priceStars}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Modal open={!!successItem} onClose={() => setSuccessItem(null)}>
        {successItem && (
          <div style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: 18 }}>{t("purchase.success.title")}</h3>
            <p style={{ fontSize: 13, color: "var(--parchment-300)", margin: "10px 0" }}>
              {t("purchase.success.body", { item: successItem.name })}
            </p>
            <button className="btn-primary" style={{ width: "100%" }} onClick={() => setSuccessItem(null)}>
              {t("purchase.success.continue")}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
