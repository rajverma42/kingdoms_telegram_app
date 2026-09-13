import { useRef, useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { haptic } from "../../telegram/webApp";
import { useTranslation } from "../../i18n/useTranslation";

interface FloatingNumber {
  id: number;
  x: number;
  y: number;
}

interface Particle {
  id: number;
  dx: number;
  dy: number;
}

let nextId = 0;

export function TapButton() {
  const tap = useGameStore((s) => s.tap);
  const vibrationEnabled = useGameStore((s) => s.save.settings.vibration);
  const { t } = useTranslation();
  const [pressed, setPressed] = useState(false);
  const [floaters, setFloaters] = useState<FloatingNumber[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleTap(e: React.PointerEvent<HTMLButtonElement>) {
    const { accepted, coinsGained } = tap();
    if (!accepted) return;

    if (vibrationEnabled) haptic("light");

    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : 50;
    const y = rect ? e.clientY - rect.top : 50;

    const floaterId = nextId++;
    setFloaters((prev) => [...prev, { id: floaterId, x, y }]);
    setTimeout(() => setFloaters((prev) => prev.filter((f) => f.id !== floaterId)), 700);

    const burst: Particle[] = Array.from({ length: 5 }, () => ({
      id: nextId++,
      dx: (Math.random() - 0.5) * 70,
      dy: -30 - Math.random() * 40,
    }));
    setParticles((prev) => [...prev, ...burst]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => !burst.includes(p))), 500);

    setPressed(true);
    setTimeout(() => setPressed(false), 140);

    void coinsGained;
  }

  return (
    <div ref={containerRef} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <button
        onPointerDown={handleTap}
        aria-label="Tap emblem"
        style={{
          width: 168,
          height: 168,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, var(--ember-400), var(--ember-500) 60%, #8a4318 100%)",
          boxShadow: pressed
            ? "0 0 20px rgba(239, 138, 74, 0.5), inset 0 -6px 12px rgba(0,0,0,0.35)"
            : "0 0 34px rgba(239, 138, 74, 0.55), inset 0 -6px 12px rgba(0,0,0,0.35)",
          border: "4px solid var(--gold-400)",
          fontSize: 56,
          animation: pressed ? "tap-pulse 140ms ease" : undefined,
          touchAction: "manipulation",
        }}
      >
        🏰
      </button>
      <p style={{ fontSize: 12, color: "var(--parchment-300)", margin: 0 }}>{t("home.tapHint")}</p>

      {floaters.map((f) => (
        <span
          key={f.id}
          style={{
            position: "absolute",
            left: f.x,
            top: f.y,
            fontWeight: 800,
            fontSize: 18,
            color: "var(--gold-400)",
            pointerEvents: "none",
            animation: "float-up 700ms ease-out forwards",
          }}
        >
          +1 🪙
        </span>
      ))}

      {particles.map((p) => (
        <span
          key={p.id}
          style={
            {
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--gold-400)",
              pointerEvents: "none",
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              animation: "particle-burst 500ms ease-out forwards",
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
