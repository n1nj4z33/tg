import type { ActionResult, GameState, PlayerAction, Toast } from '@radclub/engine';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createApi, type GameApi } from '../api/index.ts';
import { haptic } from '../telegram/telegram.ts';

export type Screen = 'hub' | 'map' | 'inventory' | 'character' | 'quests' | 'trader' | 'arena';

export interface ToastItem extends Toast {
  id: number;
}

interface GameContextValue {
  api: GameApi;
  state: GameState | null;
  busy: boolean;
  screen: Screen;
  go: (screen: Screen) => void;
  /** Выполняет действие; ошибки движка показываются тостом. Возвращает результат или null. */
  run: (action: PlayerAction) => Promise<ActionResult | null>;
  /** Произвольный вызов API с тем же обращением с ошибками (арена и т.п.). */
  call: (fn: (api: GameApi) => Promise<ActionResult>) => Promise<ActionResult | null>;
  replaceState: (state: GameState) => void;
  toasts: ToastItem[];
  notify: (toast: Toast) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const api = useMemo(createApi, []);
  const [state, setState] = useState<GameState | null>(null);
  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState<Screen>('hub');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const notify = useCallback((toast: Toast) => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-3), { ...toast, id }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, { radclubApi: api });
    api.load().then(setState, (e: Error) => notify({ text: e.message, tone: 'bad' }));
  }, [api, notify]);

  const call = useCallback(
    async (fn: (api: GameApi) => Promise<ActionResult>) => {
      setBusy(true);
      try {
        const result = await fn(api);
        setState(result.state);
        result.toasts.forEach(notify);
        if (result.toasts.some((t) => t.tone === 'level')) haptic.success();
        return result;
      } catch (e) {
        haptic.error();
        notify({ text: (e as Error).message, tone: 'bad' });
        return null;
      } finally {
        setBusy(false);
      }
    },
    [api, notify],
  );

  const run = useCallback((action: PlayerAction) => call((a) => a.dispatch(action)), [call]);

  const go = useCallback((next: Screen) => {
    haptic.tap();
    setScreen(next);
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({ api, state, busy, screen, go, run, call, replaceState: setState, toasts, notify }),
    [api, state, busy, screen, go, run, call, toasts, notify],
  );

  return <GameContext value={value}>{children}</GameContext>;
}

export function useGame(): GameContextValue {
  const ctx = use(GameContext);
  if (!ctx) throw new Error('useGame вне GameProvider');
  return ctx;
}

/** Для экранов, где персонаж гарантированно создан. */
export function usePlayerState() {
  const game = useGame();
  const player = game.state?.player;
  if (!game.state || !player) throw new Error('Персонаж не создан');
  return { ...game, state: game.state, player };
}
