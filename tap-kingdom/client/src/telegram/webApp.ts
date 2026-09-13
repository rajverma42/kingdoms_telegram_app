// Thin wrapper around the Telegram WebApp JS SDK (loaded via the
// <script src="https://telegram.org/js/telegram-web-app.js"> tag in
// index.html, which sets window.Telegram.WebApp). Every other module talks
// to Telegram only through this file, so the rest of the app never touches
// `window.Telegram` directly and stays testable outside Telegram.

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface InvoiceClosedEvent {
  url: string;
  status: "paid" | "cancelled" | "failed" | "pending";
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: { user?: TelegramUser };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  viewportHeight: number;
  viewportStableHeight: number;
  isExpanded: boolean;
  ready(): void;
  expand(): void;
  disableVerticalSwipes?(): void;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  onEvent(event: string, handler: (payload?: unknown) => void): void;
  offEvent(event: string, handler: (payload?: unknown) => void): void;
  openInvoice(url: string, callback: (status: InvoiceClosedEvent["status"]) => void): void;
  HapticFeedback?: {
    impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void;
    notificationOccurred(type: "error" | "success" | "warning"): void;
    selectionChanged(): void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    setText(text: string): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

function getWebApp(): TelegramWebApp | null {
  return typeof window !== "undefined" && window.Telegram ? window.Telegram.WebApp : null;
}

/** True only when actually running inside a Telegram client. Everything below degrades gracefully outside it (plain-browser dev/testing). */
export function isInsideTelegram(): boolean {
  const wa = getWebApp();
  return !!wa && !!wa.initData;
}

export function initTelegram(): void {
  const wa = getWebApp();
  if (!wa) return;
  wa.ready();
  wa.expand();
  wa.disableVerticalSwipes?.();
  wa.setHeaderColor?.("#12100e");
  wa.setBackgroundColor?.("#12100e");
}

export function getInitData(): string {
  return getWebApp()?.initData ?? "";
}

export function getTelegramUser(): TelegramUser | null {
  return getWebApp()?.initDataUnsafe.user ?? null;
}

export function getColorScheme(): "light" | "dark" {
  return getWebApp()?.colorScheme ?? "dark";
}

export function haptic(style: "light" | "medium" | "heavy" = "light"): void {
  getWebApp()?.HapticFeedback?.impactOccurred(style);
}

export function hapticNotification(type: "error" | "success" | "warning"): void {
  getWebApp()?.HapticFeedback?.notificationOccurred(type);
}

export function setMainButton(text: string, onClick: () => void): () => void {
  const wa = getWebApp();
  if (!wa) return () => {};
  wa.MainButton.setText(text);
  wa.MainButton.show();
  wa.MainButton.enable();
  wa.MainButton.onClick(onClick);
  return () => {
    wa.MainButton.offClick(onClick);
    wa.MainButton.hide();
  };
}

export function hideMainButton(): void {
  getWebApp()?.MainButton.hide();
}

export function setBackButton(onClick: () => void): () => void {
  const wa = getWebApp();
  if (!wa) return () => {};
  wa.BackButton.show();
  wa.BackButton.onClick(onClick);
  return () => {
    wa.BackButton.offClick(onClick);
    wa.BackButton.hide();
  };
}

export function hideBackButton(): void {
  getWebApp()?.BackButton.hide();
}

/**
 * Opens a Telegram Stars invoice created by the bot backend (see
 * bot/src/payments/invoice.ts) and resolves with the final status.
 * The Mini App never decides whether the purchase succeeded — Telegram
 * itself reports that, and the bot independently confirms fulfillment
 * via its own successful_payment webhook (see payments/purchaseFlow.ts).
 */
export function openInvoice(invoiceUrl: string): Promise<InvoiceClosedEvent["status"]> {
  const wa = getWebApp();
  if (!wa) return Promise.resolve("failed");
  return new Promise((resolve) => {
    wa.openInvoice(invoiceUrl, (status) => resolve(status));
  });
}
