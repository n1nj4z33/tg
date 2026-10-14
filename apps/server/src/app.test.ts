import { describe, expect, it } from 'vitest';
import { buildApp } from './app.ts';
import { signInitData, verifyInitData } from './auth.ts';
import { MemoryStore } from './store.ts';

const TOKEN = '123:test-token';
const create = {
  type: 'create',
  name: 'Ник',
  stats: { str: 6, per: 7, end: 5, cha: 3, int: 5, agi: 7, luck: 7 },
  perk: 'finesse',
  look: { skin: '#c99a76', hair: '#2a1d14' },
};

const initFor = (id: number, authDate = Math.floor(Date.now() / 1000)) =>
  signInitData({ auth_date: String(authDate), user: JSON.stringify({ id, first_name: 'Ник' }) }, TOKEN);

describe('проверка initData', () => {
  it('принимает корректную подпись', () => {
    expect(verifyInitData(initFor(42), TOKEN)?.id).toBe('42');
  });
  it('отклоняет подделку и протухшие данные', () => {
    expect(verifyInitData(initFor(42).replace('42', '43'), TOKEN)).toBeNull();
    expect(verifyInitData(initFor(42), 'other')).toBeNull();
    expect(verifyInitData(initFor(42, 1000), TOKEN)).toBeNull();
  });
});

describe('API', () => {
  const app = buildApp({ store: new MemoryStore(), botToken: TOKEN });
  const headers = (id: number) => ({ 'x-telegram-init-data': initFor(id) });

  it('без авторизации — 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/state' });
    expect(res.statusCode).toBe(401);
  });

  it('создание персонажа и ошибка движка как 400', async () => {
    let res = await app.inject({ method: 'POST', url: '/api/action', headers: headers(1), payload: create });
    expect(res.statusCode).toBe(200);
    expect(res.json().state.player.name).toBe('Ник');
    res = await app.inject({ method: 'POST', url: '/api/action', headers: headers(1), payload: create });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/уже создан/);
  });

  it('клиент не может подсунуть своего соперника', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/action', headers: headers(1), payload: { type: 'arenaFight', opponent: {} } });
    expect(res.statusCode).toBe(400);
  });

  it('арена: другой игрок попадает в список соперников, с ним можно драться', async () => {
    await app.inject({ method: 'POST', url: '/api/action', headers: headers(2), payload: { ...create, name: 'Вован' } });
    const list = (await app.inject({ method: 'GET', url: '/api/arena/opponents', headers: headers(1) })).json();
    const rival = list.find((o: { name: string }) => o.name === 'Вован');
    expect(rival?.bot).toBe(false);
    const fight = await app.inject({ method: 'POST', url: '/api/arena/fight', headers: headers(1), payload: { opponentId: rival.id } });
    expect(fight.json().state.combat.kind).toBe('arena');
    const board = (await app.inject({ method: 'GET', url: '/api/leaderboard' })).json();
    expect(board).toHaveLength(2);
  });
});
