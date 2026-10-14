import { useEffect } from 'react';
import { tg } from './telegram.ts';

/** Показывает системную кнопку «Назад» Telegram, пока active. */
export function useBackButton(active: boolean, onBack: () => void): void {
  useEffect(() => {
    const app = tg();
    if (!app || !active) return;
    app.BackButton.show();
    app.BackButton.onClick(onBack);
    return () => {
      app.BackButton.offClick(onBack);
      app.BackButton.hide();
    };
  }, [active, onBack]);
}
