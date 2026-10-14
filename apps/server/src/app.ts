import fastifyStatic from '@fastify/static';
import {
  applyAction,
  GameError,
  generateGladiator,
  generateGladiators,
  newGame,
  snapshotFromState,
  tick,
  type ArenaSnapshot,
  type GameState,
  type PlayerAction,
} from '@radclub/engine';
import Fastify, { type FastifyRequest } from 'fastify';
import { existsSync } from 'node:fs';
import { verifyInitData, type TelegramUser } from './auth.ts';
import type { Store } from './store.ts';

export interface AppOptions {
  store: Store;
  /** Токен бота для проверки initData. Без него сервер принимает только dev-авторизацию. */
  botToken?: string;
  /** Разрешить заголовок x-dev-user (только для локальной разработки!). */
  devAuth?: boolean;
  /** Папка со сборкой фронтенда — сервер раздаст её сам. */
  staticDir?: string;
  logger?: boolean;
}

const PLAYER_PREFIX = 'player:';

/** Действия, которые клиент не может отправить напрямую: соперника по арене подставляет сервер. */
const CLIENT_ACTIONS = new Set<PlayerAction['type']>([
  'create', 'travel', 'enterZone', 'explore', 'leaveZone', 'combatTurn', 'flee', 'finishCombat', 'useItem',
  'equip', 'unequip', 'drop', 'buy', 'sell', 'rest', 'acceptQuest', 'completeQuest', 'allocate', 'pickPerk',
]);

export function buildApp(opts: AppOptions) {
  const app = Fastify({ logger: opts.logger ?? false, bodyLimit: 64 * 1024 });

  function auth(req: FastifyRequest): TelegramUser {
    const initData = String(req.headers['x-telegram-init-data'] ?? '');
    if (opts.botToken && initData) {
      const user = verifyInitData(initData, opts.botToken);
      if (user) return user;
    }
    const dev = req.headers['x-dev-user'];
    if (opts.devAuth && typeof dev === 'string' && dev) return { id: `dev-${dev}`, name: dev };
    throw Object.assign(new Error('Открой игру через Telegram'), { statusCode: 401 });
  }

  function load(userId: string): GameState {
    const rec = opts.store.get(userId);
    return rec ? tick(rec.state, Date.now()) : newGame(Date.now());
  }

  function apply(userId: string, action: PlayerAction) {
    const result = applyAction(load(userId), action, { rng: Math.random, now: Date.now() });
    opts.store.set(userId, { state: result.state });
    return result;
  }

  function resolveOpponent(selfId: string, opponentId: string): ArenaSnapshot {
    if (opponentId.startsWith('bot:')) return generateGladiator(opponentId);
    if (opponentId.startsWith(PLAYER_PREFIX)) {
      const id = opponentId.slice(PLAYER_PREFIX.length);
      const rec = id !== selfId ? opts.store.get(id) : undefined;
      const snap = rec && snapshotFromState(opponentId, rec.state);
      if (snap) return snap;
    }
    throw new GameError('Соперник не найден');
  }

  app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
    if (err instanceof GameError) return reply.code(400).send({ error: err.message });
    const code = err.statusCode ?? 500;
    if (code >= 500) app.log.error(err);
    return reply.code(code).send({ error: code >= 500 ? 'Внутренняя ошибка сервера' : err.message });
  });

  app.get('/api/health', async () => ({ ok: true }));

  app.get('/api/state', async (req) => load(auth(req).id));

  app.post<{ Body: PlayerAction }>('/api/action', async (req) => {
    const user = auth(req);
    const action = req.body;
    if (!action || typeof action !== 'object' || !CLIENT_ACTIONS.has(action.type)) throw new GameError('Неизвестное действие');
    return apply(user.id, action);
  });

  app.get('/api/arena/opponents', async (req) => {
    const user = auth(req);
    const level = load(user.id).player?.level ?? 1;
    const players: ArenaSnapshot[] = [];
    for (const [id, rec] of opts.store.all()) {
      if (id === user.id || !rec.state.player || Math.abs(rec.state.player.level - level) > 3) continue;
      const snap = snapshotFromState(PLAYER_PREFIX + id, rec.state);
      if (snap) players.push(snap);
    }
    players.sort((a, b) => Math.abs(a.level - level) - Math.abs(b.level - level) || Math.random() - 0.5);
    const picked = players.slice(0, 3);
    return [...picked, ...generateGladiators(level, Date.now(), 5 - picked.length)];
  });

  app.post<{ Body: { opponentId?: string } }>('/api/arena/fight', async (req) => {
    const user = auth(req);
    const opponent = resolveOpponent(user.id, String(req.body?.opponentId ?? ''));
    return apply(user.id, { type: 'arenaFight', opponent });
  });

  app.get('/api/leaderboard', async () => {
    const rows = [];
    for (const [, rec] of opts.store.all()) {
      const p = rec.state.player;
      if (p) rows.push({ name: p.name, level: p.level, ...rec.state.arena });
    }
    return rows.sort((a, b) => b.rating - a.rating).slice(0, 30);
  });

  app.post('/api/reset', async (req) => {
    const user = auth(req);
    const state = newGame(Date.now());
    opts.store.set(user.id, { state });
    return state;
  });

  if (opts.staticDir && existsSync(opts.staticDir)) {
    app.register(fastifyStatic, { root: opts.staticDir });
    app.setNotFoundHandler((req, reply) => (req.url.startsWith('/api') ? reply.code(404).send({ error: 'Не найдено' }) : reply.sendFile('index.html')));
  }

  return app;
}
