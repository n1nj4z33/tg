import { seededRng, pick, randInt } from './rng.ts';
import { maxHp, type Loadout } from './stats.ts';
import type { ArenaSnapshot, Equipment, GameState, Skills, Stats } from './types.ts';

const NICKS = [
  'Бешеный Вован', 'Тётя Валя', 'Гуль-Сутулый', 'Кирпич', 'Профессор', 'Шрам', 'Ржавый', 'Банщик',
  'Сталевар', 'Лысый из Кольцово', 'Мамка Радиации', 'Тракторист', 'Дед-Ядерщик', 'Сибирский Валенок',
  'Кислота', 'Чёрный Сталкер', 'Маруся-Миномёт', 'Ефрейтор Пыль', 'Шаман-Кувалда', 'Мясорубка',
];

const SKIN = ['#e0b08c', '#c99a76', '#b88762', '#8d5f3f', '#f0c8a8', '#6b4430'];
const HAIR = ['#2a1d14', '#5a3a1e', '#a0a0a0', '#c8a050', '#1a1a1a', '#7a2a1a'];

/** Снаряжение гладиатора по уровню. */
function gearFor(level: number, seed: number): Equipment {
  const tiers: Equipment[] = [
    { weapon: 'pipe', body: 'vatnik', head: null },
    { weapon: 'pm', body: 'leather', head: 'gasmask' },
    { weapon: 'sawnoff', body: 'leather', head: 'helmet' },
    { weapon: 'ak74', body: 'scrapplate', head: 'helmet' },
    { weapon: 'laser', body: 'vest6b43', head: 'helmet' },
    { weapon: 'svd', body: 'vest6b43', head: 'sphere' },
    { weapon: 'plasma', body: 'power', head: 'sphere' },
  ];
  const meleeTiers: Equipment[] = [
    { weapon: 'shiv', body: 'vatnik', head: null },
    { weapon: 'sledge', body: 'leather', head: 'helmet' },
    { weapon: 'powerfist', body: 'vest6b43', head: 'sphere' },
  ];
  if (seed % 4 === 0) return meleeTiers[Math.min(meleeTiers.length - 1, Math.floor(level / 5))];
  return tiers[Math.min(tiers.length - 1, Math.floor(level / 2.3))];
}

/** Бот определяется своим id — сервер и клиент восстанавливают его без хранения. */
export function botId(level: number, seed: number): string {
  return `bot:${level}:${seed}`;
}

export function generateGladiator(id: string): ArenaSnapshot {
  const [, levelStr, seedStr] = id.split(':');
  const level = Math.max(1, Number(levelStr) || 1);
  const seed = Number(seedStr) || 0;
  const rng = seededRng(seed * 7919 + level);
  const stats: Stats = { str: 4, per: 4, end: 4, cha: 3, int: 4, agi: 4, luck: 4 };
  const keys = Object.keys(stats) as Array<keyof Stats>;
  for (let i = 0; i < 13 + Math.floor(level / 4); i++) {
    const key = pick(rng, keys);
    if (stats[key] < 10) stats[key]++;
  }
  const equipment = gearFor(level, seed);
  const skillPoints = (level - 1) * 10;
  const melee = equipment.weapon === 'shiv' || equipment.weapon === 'sledge' || equipment.weapon === 'powerfist' || equipment.weapon === 'pipe';
  const energy = equipment.weapon === 'laser' || equipment.weapon === 'plasma';
  const skills: Skills = {
    guns: !melee && !energy ? skillPoints : 0,
    energy: energy ? skillPoints : 0,
    melee: melee ? skillPoints : 0,
    medicine: 0,
    barter: 0,
    survival: 0,
  };
  return {
    id,
    name: pick(rng, NICKS),
    level,
    rating: 1000 + level * 25 + randInt(rng, -40, 40),
    stats,
    skills,
    perks: level >= 3 ? [pick(rng, ['finesse', 'toughness', 'sniper', 'actionBoy', 'bloodyMess'])] : [],
    equipment,
    look: { skin: pick(rng, SKIN), hair: pick(rng, HAIR) },
    bot: true,
  };
}

/** Пачка соперников под уровень игрока — меняется каждые 10 минут. */
export function generateGladiators(level: number, now: number, count = 4): ArenaSnapshot[] {
  const epoch = Math.floor(now / 600_000);
  return Array.from({ length: count }, (_, i) => {
    const lvl = Math.max(1, level + [-1, 0, 0, 1, 2][i % 5]);
    return generateGladiator(botId(lvl, (epoch * 31 + i * 101) % 100_000));
  });
}

export function snapshotFromState(id: string, state: GameState): ArenaSnapshot | null {
  const p = state.player;
  if (!p) return null;
  return {
    id,
    name: p.name,
    level: p.level,
    rating: state.arena.rating,
    stats: p.stats,
    skills: p.skills,
    perks: p.perks,
    equipment: p.equipment,
    look: p.look,
    bot: false,
  };
}

export function snapshotLoadout(s: ArenaSnapshot): Loadout {
  const hp = maxHp({ stats: s.stats, level: s.level, perks: s.perks, rads: 0 });
  return { ...s, id: s.id, hp, maxHp: hp, hasAmmo: true };
}

/** Изменение рейтинга по Эло (K=32). */
export function ratingDelta(own: number, opponent: number, won: boolean): number {
  const expected = 1 / (1 + 10 ** ((opponent - own) / 400));
  return Math.round(32 * ((won ? 1 : 0) - expected));
}
