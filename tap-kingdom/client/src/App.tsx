import { useEffect, useState } from "react";
import { useGameStore } from "./store/gameStore";
import { BottomNav, type Screen } from "./components/BottomNav";
import { ResourceBar } from "./components/ResourceBar";
import { Toast } from "./components/Toast";
import { Home, type Overlay } from "./pages/Home";
import { Battle } from "./pages/Battle";
import { Kingdom } from "./pages/Kingdom";
import { Heroes } from "./pages/Heroes";
import { Shop } from "./pages/Shop";
import { Missions } from "./pages/Missions";
import { DailyRewards } from "./pages/DailyRewards";
import { Achievements } from "./pages/Achievements";
import { Stats } from "./pages/Stats";
import { Settings } from "./pages/Settings";
import { Onboarding } from "./pages/Onboarding";
import { initTelegram, getTelegramUser, setBackButton, hideBackButton, isInsideTelegram } from "./telegram/webApp";
import { fetchEntitlements } from "./payments/purchaseFlow";
import { useTranslation } from "./i18n/useTranslation";

export default function App() {
  const { t } = useTranslation();
  const save = useGameStore((s) => s.save);
  const recovered = useGameStore((s) => s.recoveredFromCorruption);
  const tick = useGameStore((s) => s.tick);
  const applyFulfilledPurchases = useGameStore((s) => s.applyFulfilledPurchases);
  const completeTutorial = useGameStore((s) => s.completeTutorial);

  const [screen, setScreen] = useState<Screen>("home");
  const [overlay, setOverlay] = useState<Overlay | null>(null);

  useEffect(() => {
    initTelegram();
  }, []);

  // Keep energy regen and any timed building upgrades in sync while the app is open.
  useEffect(() => {
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // Reconcile any Stars purchases the bot has on file for this Telegram user.
  // Runs once on launch — covers the case where a payment finished after the
  // Mini App was last closed (e.g. the invoice sheet was left open).
  useEffect(() => {
    if (!isInsideTelegram()) return;
    fetchEntitlements().then((items) => {
      if (items.length > 0) applyFulfilledPurchases(items);
    });
  }, [applyFulfilledPurchases]);

  useEffect(() => {
    if (overlay) {
      return setBackButton(() => setOverlay(null));
    }
    if (screen !== "home") {
      return setBackButton(() => setScreen("home"));
    }
    hideBackButton();
    return undefined;
  }, [overlay, screen]);

  if (!save.tutorialCompleted) {
    return <Onboarding onComplete={completeTutorial} />;
  }

  const user = getTelegramUser();

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <ResourceBar user={user} level={save.playerLevel} coins={save.coins} gems={save.gems} energy={save.energy} energyMax={save.energyMax} />
      {recovered && <Toast message={t("app.recovered")} tone="error" />}

      <div style={{ flex: 1 }}>
        {overlay === "missions" && <Missions />}
        {overlay === "dailyReward" && <DailyRewards />}
        {overlay === "achievements" && <Achievements />}
        {overlay === "stats" && <Stats />}
        {overlay === "settings" && <Settings />}

        {!overlay && screen === "home" && <Home onNavigate={setScreen} onOpenOverlay={setOverlay} />}
        {!overlay && screen === "battle" && <Battle />}
        {!overlay && screen === "kingdom" && <Kingdom />}
        {!overlay && screen === "heroes" && <Heroes />}
        {!overlay && screen === "shop" && <Shop />}
      </div>

      {!overlay && <BottomNav active={screen} onChange={setScreen} />}
    </div>
  );
}
