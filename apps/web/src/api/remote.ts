import type { ActionResult, ArenaSnapshot, GameState, PlayerAction } from '@radclub/engine';
import { initData } from '../telegram/telegram.ts';
import type { GameApi, LeaderRow } from './types.ts';

export class ApiError extends Error {}

/** Серверный режим: состояние живёт на сервере, движок там же — клиент не может читерить. */
export class RemoteApi implements GameApi {
  readonly mode = 'remote' as const;

  constructor(private readonly base: string) {}

  private async request<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.base}/api${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'content-type': 'application/json',
        'x-telegram-init-data': initData(),
        // Локальная отладка remote-режима вне Telegram (сервер должен быть запущен с DEV_AUTH=1)
        ...(import.meta.env.VITE_DEV_USER ? { 'x-dev-user': import.meta.env.VITE_DEV_USER } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError((data as { error?: string }).error ?? `Ошибка сервера (${res.status})`);
    return data as T;
  }

  load = () => this.request<GameState>('/state');
  dispatch = (action: PlayerAction) => this.request<ActionResult>('/action', action);
  arenaOpponents = () => this.request<ArenaSnapshot[]>('/arena/opponents');
  arenaFight = (opponentId: string) => this.request<ActionResult>('/arena/fight', { opponentId });
  leaderboard = () => this.request<LeaderRow[]>('/leaderboard');
  reset = () => this.request<GameState>('/reset', {});
}
