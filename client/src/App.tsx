import { useEffect, useState } from "react";
import { api, ApiRequestError, type KingdomDto } from "./api/client";
import { BottomNav, type Screen } from "./components/BottomNav";
import { ResourceBar } from "./components/ResourceBar";
import { Home } from "./pages/Home";
import { Kingdom } from "./pages/Kingdom";
import { Battle } from "./pages/Battle";
import { useTranslation, setAppLanguage } from "./hooks/useTranslation";

export default function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>("home");
  const [kingdom, setKingdom] = useState<KingdomDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const profile = await api.authTelegram();
        setAppLanguage(profile.preferredLang);
        const kingdomData = await api.getKingdom();
        if (!cancelled) setKingdom(kingdomData);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiRequestError
              ? err.message
              : "Could not connect to Kingdom Rush servers."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <CenteredMessage>{t("app.loading")}</CenteredMessage>;
  }

  if (error || !kingdom) {
    return (
      <CenteredMessage>
        <p style={{ color: "var(--danger-500)", fontWeight: 600 }}>{error}</p>
        <p style={{ fontSize: 12, color: "var(--parchment-300)", marginTop: 8 }}>
          This screen appears if the app isn't opened inside Telegram, or the
          server rejected the Telegram session.
        </p>
      </CenteredMessage>
    );
  }

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <ResourceBar kingdom={kingdom} />
      <div style={{ flex: 1 }}>
        {screen === "home" && <Home kingdom={kingdom} onNavigate={setScreen} />}
        {screen === "kingdom" && <Kingdom kingdom={kingdom} onKingdomChange={setKingdom} />}
        {screen === "battle" && <Battle kingdom={kingdom} onKingdomChange={setKingdom} />}
      </div>
      <BottomNav active={screen} onChange={setScreen} />
    </div>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}
