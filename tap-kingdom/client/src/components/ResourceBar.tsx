import type { TelegramUser } from "../telegram/webApp";
import { useTranslation } from "../i18n/useTranslation";

interface Props {
  user: TelegramUser | null;
  level: number;
  coins: number;
  gems: number;
  energy: number;
  energyMax: number;
}

export function ResourceBar({ user, level, coins, gems, energy, energyMax }: Props) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: "var(--stone-800)",
        borderBottom: "1px solid var(--stone-700)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {user?.photo_url ? (
          <img
            src={user.photo_url}
            alt=""
            style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid var(--gold-400)" }}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--stone-700)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--gold-400)",
            }}
          >
            {(user?.first_name ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>
            {user?.username ? `@${user.username}` : user?.first_name ?? "Player"}
          </div>
          <div style={{ fontSize: 10, color: "var(--parchment-300)" }}>{t("home.level", { level })}</div>
        </div>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
        <Resource icon="🪙" value={coins} />
        <Resource icon="💎" value={gems} />
        <Resource icon="⚡" value={`${energy}/${energyMax}`} />
      </div>
    </div>
  );
}

function Resource({ icon, value }: { icon: string; value: string | number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700 }}>
      <span>{icon}</span>
      <span>{value}</span>
    </div>
  );
}
