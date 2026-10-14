import {
  applyAction,
  emptyParts,
  enemyCombatant,
  getEnemy,
  generateGladiator,
  generateGladiators,
  newGame,
  tick,
  type GameState,
  type PlayerAction,
} from '@radclub/engine';
import type { GameApi, LeaderRow } from './types.ts';

const KEY = 'radclub.save.v1';

function read(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as GameState;
  } catch {
    // повреждённое сохранение или недоступное хранилище — начинаем заново
  }
  return newGame(Date.now());
}

function write(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // приватный режим — игра работает без сохранения
  }
}

/** Офлайн-режим: движок крутится прямо в браузере. */
export class LocalApi implements GameApi {
  readonly mode = 'local' as const;
  private state = read();

  async load() {
    this.state = tick(this.state, Date.now());
    return this.state;
  }

  async dispatch(action: PlayerAction) {
    const result = applyAction(this.state, action, { rng: Math.random, now: Date.now() });
    this.state = result.state;
    write(this.state);
    return result;
  }

  async arenaOpponents() {
    return generateGladiators(this.state.player?.level ?? 1, Date.now());
  }

  async arenaFight(opponentId: string) {
    return this.dispatch({ type: 'arenaFight', opponent: generateGladiator(opponentId) });
  }

  async leaderboard(): Promise<LeaderRow[]> {
    const rows: LeaderRow[] = generateGladiators((this.state.player?.level ?? 1) + 2, 0, 8).map((b) => ({
      name: b.name, level: b.level, rating: b.rating, wins: b.level * 3, losses: b.level,
    }));
    if (this.state.player) {
      const { rating, wins, losses } = this.state.arena;
      rows.push({ name: this.state.player.name, level: this.state.player.level, rating, wins, losses });
    }
    return rows.sort((a, b) => b.rating - a.rating);
  }

  /** Только для разработки: мгновенно начать бой с любым врагом. */
  debugFight(enemyId: string) {
    const t = getEnemy(enemyId);
    this.state = {
      ...this.state,
      combat: { kind: 'pve', round: 0, enemyTemplate: t.id, enemy: enemyCombatant(t), playerParts: emptyParts(), lastRound: [], log: [`На вас нападает ${t.name}!`], result: null },
    };
    write(this.state);
  }

  async reset() {
    this.state = newGame(Date.now());
    write(this.state);
    return this.state;
  }
}
