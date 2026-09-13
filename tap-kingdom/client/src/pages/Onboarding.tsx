import { useState } from "react";
import { useTranslation } from "../i18n/useTranslation";
import { haptic } from "../telegram/webApp";

const STEP_KEYS = ["onboarding.step1", "onboarding.step2", "onboarding.step3", "onboarding.step4", "onboarding.step5"] as const;

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const isLast = step === STEP_KEYS.length - 1;

  function next() {
    haptic("light");
    if (isLast) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--ink-950)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 200,
      }}
    >
      <div className="card" style={{ maxWidth: 320, width: "100%", textAlign: "center", boxShadow: "var(--shadow-glow)" }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>{t("onboarding.welcome")}</h2>
        <p style={{ fontSize: 14, minHeight: 60 }}>{t(STEP_KEYS[step])}</p>

        <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "16px 0" }}>
          {STEP_KEYS.map((_, i) => (
            <span
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: i === step ? "var(--gold-400)" : "var(--stone-700)",
              }}
            />
          ))}
        </div>

        <button className="btn-primary" style={{ width: "100%" }} onClick={next}>
          {isLast ? t("onboarding.start") : t("onboarding.next")}
        </button>
      </div>
    </div>
  );
}
