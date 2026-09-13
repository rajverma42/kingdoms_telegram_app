import type { KingdomDto } from "../api/client";

export function ResourceBar({ kingdom }: { kingdom: KingdomDto }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "center",
        padding: "10px 16px",
        background: "var(--stone-800)",
        borderBottom: "1px solid var(--stone-700)",
      }}
    >
      <Resource icon="🪙" value={kingdom.gold} />
      <Resource icon="💎" value={kingdom.gems} />
      <Resource icon="⚡" value={`${kingdom.energy}/${kingdom.energyMax}`} />
      <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--parchment-300)" }}>
        {kingdom.power} PWR
      </div>
    </div>
  );
}

function Resource({ icon, value }: { icon: string; value: string | number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600 }}>
      <span>{icon}</span>
      <span>{value}</span>
    </div>
  );
}
