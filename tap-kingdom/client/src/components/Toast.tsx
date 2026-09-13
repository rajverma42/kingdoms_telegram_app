interface Props {
  message: string | null;
  tone?: "error" | "success";
}

export function Toast({ message, tone = "error" }: Props) {
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 66,
        left: 16,
        right: 16,
        background: tone === "error" ? "var(--danger-500)" : "var(--moss-500)",
        color: "var(--parchment-100)",
        padding: "10px 14px",
        borderRadius: "var(--radius-md)",
        fontSize: 13,
        fontWeight: 600,
        zIndex: 90,
        boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
      }}
    >
      {message}
    </div>
  );
}
