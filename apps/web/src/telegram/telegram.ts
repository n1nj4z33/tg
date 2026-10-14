/** Тонкая обёртка над Telegram WebApp API — без лишних зависимостей. */

interface TgHaptic {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}

interface TgBackButton {
  show(): void;
  hide(): void;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
}

interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: { first_name?: string; username?: string } };
  ready(): void;
  expand(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  disableVerticalSwipes?(): void;
  HapticFeedback: TgHaptic;
  BackButton: TgBackButton;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

export const tg = (): TgWebApp | null => {
  const app = window.Telegram?.WebApp;
  return app && app.initData ? app : null;
};

export const initData = (): string => tg()?.initData ?? '';

export function initTelegram(): void {
  const app = tg();
  if (!app) return;
  app.ready();
  app.expand();
  app.setHeaderColor('#14110d');
  app.setBackgroundColor('#14110d');
  app.disableVerticalSwipes?.();
}

export const telegramName = (): string | undefined => tg()?.initDataUnsafe.user?.first_name;

export const haptic = {
  impact: (style: 'light' | 'medium' | 'heavy' = 'medium') => tg()?.HapticFeedback.impactOccurred(style),
  success: () => tg()?.HapticFeedback.notificationOccurred('success'),
  error: () => tg()?.HapticFeedback.notificationOccurred('error'),
  tap: () => tg()?.HapticFeedback.selectionChanged(),
};
