import type { ActionResult, ArenaSnapshot, GameState, PlayerAction } from '@radclub/engine';

export interface LeaderRow {
  name: string;
  level: number;
  rating: number;
  wins: number;
  losses: number;
}

/** Единый интерфейс к игре: локальный (в браузере) или серверный. */
export interface GameApi {
  readonly mode: 'local' | 'remote';
  load(): Promise<GameState>;
  dispatch(action: PlayerAction): Promise<ActionResult>;
  arenaOpponents(): Promise<ArenaSnapshot[]>;
  arenaFight(opponentId: string): Promise<ActionResult>;
  leaderboard(): Promise<LeaderRow[]>;
  reset(): Promise<GameState>;
}
