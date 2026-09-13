import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useTranslation } from "../i18n/useTranslation";
import { Modal } from "../components/Modal";
import { haptic } from "../telegram/webApp";

type InfoPanel = "privacy" | "terms" | "support" | null;

const INFO_TEXT: Record<Exclude<InfoPanel, null>, { titleKey: "settings.privacy" | "settings.terms" | "settings.support"; body: string }> = {
  privacy: {
    titleKey: "settings.privacy",
    body:
      "Tap Kingdom stores your game progress only on your own device (local browser storage) — there is no game database. " +
      "We only use the Telegram information necessary to run the Mini App and process optional Stars purchases (your Telegram user ID, name, and username). " +
      "We never sell your information, and purchase records are kept only long enough to prevent double-charging you.",
  },
  terms: {
    titleKey: "settings.terms",
    body:
      "Tap Kingdom is a free-to-play game. Optional premium digital content (heroes, skins, weapons, chests, bundles) may be purchased using Telegram Stars, priced between 1 and 50 Stars. " +
      "All purchases are digital content only — no cash prizes, no gambling, and Stars can never be earned, won, or converted back from gameplay.",
  },
  support: {
    titleKey: "settings.support",
    body: "Need help? Message the bot with /support and describe your issue, including your Telegram username so we can help you faster.",
  },
};

export function Settings() {
  const { t } = useTranslation();
  const settings = useGameStore((s) => s.save.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const [confirmReset, setConfirmReset] = useState(false);
  const [infoPanel, setInfoPanel] = useState<InfoPanel>(null);

  return (
    <div style={{ padding: "18px 18px 40px" }}>
      <h2 style={{ fontSize: 20, marginBottom: 14 }}>{t("settings.title")}</h2>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 14 }}>
        <ToggleRow label={t("settings.sound")} value={settings.sound} onChange={(v) => updateSettings({ sound: v })} />
        <ToggleRow label={t("settings.music")} value={settings.music} onChange={(v) => updateSettings({ music: v })} />
        <ToggleRow label={t("settings.vibration")} value={settings.vibration} onChange={(v) => updateSettings({ vibration: v })} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13 }}>{t("settings.language")}</span>
          <div style={{ display: "flex", gap: 6 }}>
            {(["en", "hi"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  haptic("light");
                  updateSettings({ language: lang });
                }}
                className={settings.language === lang ? "btn-primary" : "btn-secondary"}
                style={{ fontSize: 11, padding: "6px 12px" }}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        <LinkRow label={t("settings.privacy")} onClick={() => setInfoPanel("privacy")} />
        <LinkRow label={t("settings.terms")} onClick={() => setInfoPanel("terms")} />
        <LinkRow label={t("settings.support")} onClick={() => setInfoPanel("support")} />
      </div>

      <button className="btn-secondary" style={{ width: "100%", color: "var(--danger-500)" }} onClick={() => setConfirmReset(true)}>
        {t("settings.reset")}
      </button>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <p style={{ fontSize: 13, marginBottom: 16 }}>{t("settings.resetConfirm")}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmReset(false)}>
            Cancel
          </button>
          <button
            className="btn-primary"
            style={{ flex: 1, background: "var(--danger-500)" }}
            onClick={() => {
              resetProgress();
              setConfirmReset(false);
            }}
          >
            {t("settings.reset")}
          </button>
        </div>
      </Modal>

      <Modal open={!!infoPanel} onClose={() => setInfoPanel(null)}>
        {infoPanel && (
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>{t(INFO_TEXT[infoPanel].titleKey)}</h3>
            <p style={{ fontSize: 12, color: "var(--parchment-300)", lineHeight: 1.5 }}>{INFO_TEXT[infoPanel].body}</p>
            <button className="btn-primary" style={{ width: "100%", marginTop: 10 }} onClick={() => setInfoPanel(null)}>
              OK
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <button
        onClick={() => {
          haptic("light");
          onChange(!value);
        }}
        style={{
          width: 46,
          height: 26,
          borderRadius: 999,
          background: value ? "var(--ember-500)" : "var(--stone-700)",
          position: "relative",
          minHeight: 26,
        }}
        aria-pressed={value}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: value ? 23 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "var(--parchment-100)",
            transition: "left 120ms ease",
          }}
        />
      </button>
    </div>
  );
}

function LinkRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "flex", justifyContent: "space-between", background: "transparent", color: "var(--parchment-100)", fontSize: 13, padding: "6px 0" }}>
      <span>{label}</span>
      <span style={{ color: "var(--parchment-300)" }}>›</span>
    </button>
  );
}
