// Thin wrapper around window.Telegram.WebApp so the rest of the app never
// touches the global directly. In dev (outside Telegram) this degrades to
// safe no-ops plus a fake initData so the UI is still testable in a browser —
// the server will reject the fake initData signature, which is correct
// (never trust the frontend; see server/src/telegram/verifyInitData.ts).

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  HapticFeedback?: { impactOccurred: (style: string) => void };
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string>;
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

export function getTelegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

export function initTelegramApp() {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.ready();
    webApp.expand();
  }
}

export function getInitData(): string {
  const webApp = getTelegramWebApp();
  if (webApp?.initData) return webApp.initData;
  // Dev fallback only — will fail real server verification, by design.
  return "dev-mode-no-telegram";
}

export function haptic(style: "light" | "medium" | "heavy" = "light") {
  getTelegramWebApp()?.HapticFeedback?.impactOccurred(style);
}
