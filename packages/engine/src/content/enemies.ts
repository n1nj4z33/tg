import type { EnemyId, EnemyTemplate, Stats, WeaponSpec } from '../types.ts';
import { ITEMS } from './items.ts';

const stats = (str: number, per: number, end: number, agi: number, luck = 5): Stats => ({
  str, per, end, cha: 3, int: 3, agi, luck,
});

const natural = (name: string, damage: [number, number], apCost: number, fx: WeaponSpec['fx'] = 'claw'): WeaponSpec => ({
  name, skill: 'melee', damage, apCost, accuracy: 10, critMult: 2, fx,
});

const gun = (itemId: string): WeaponSpec => {
  const item = ITEMS[itemId];
  if (item?.type !== 'weapon') throw new Error(`Не оружие: ${itemId}`);
  return item.weapon;
};

const ENEMY_LIST: EnemyTemplate[] = [
  // ── Пустошь / Новосибирск ──
  {
    id: 'radrat', name: 'Радкрыса', description: 'Крыса размером с таксу. Голодная.',
    level: 1, stats: stats(3, 5, 3, 7), skill: 35, hp: 14,
    weapon: natural('Укус', [2, 5], 3, 'bite'), armor: { dt: 0, dr: 0 },
    look: { body: 'beast', skin: '#7b6a5a', eyes: '#ff3b2f', extras: ['tail'], scale: 0.6, bulk: 0.8 },
    xp: 12, caps: [0, 3], loot: [{ item: 'ratskin', chance: 60 }],
  },
  {
    id: 'molerat', name: 'Крысокрот', description: 'Слепой подземный грызун с зубами-лопатами.',
    level: 2, stats: stats(5, 3, 5, 5), skill: 40, hp: 26,
    weapon: natural('Резцы', [3, 8], 4, 'bite'), armor: { dt: 1, dr: 5 },
    look: { body: 'beast', skin: '#c49a86', eyes: '#2a1a12', scale: 0.75, bulk: 1.1 },
    xp: 20, caps: [0, 5], loot: [{ item: 'ratskin', chance: 40 }, { item: 'tushonka', chance: 15 }],
  },
  {
    id: 'raider', name: 'Мародёр', description: 'Местный «бизнесмен». Берёт всё, включая почки.',
    level: 2, stats: stats(5, 5, 5, 5), skill: 40, hp: 30,
    weapon: gun('pipe'), armor: { dt: 1, dr: 10 },
    look: { body: 'humanoid', skin: '#c99a76', cloth: '#5a3a24', accent: '#2f1d10', armor: 'jacket', head: 'bald', eyes: '#222' },
    xp: 25, caps: [5, 25],
    loot: [{ item: 'pipe', chance: 20 }, { item: 'stim', chance: 20 }, { item: 'vodka', chance: 25 }, { item: 'leather', chance: 8 }],
  },
  {
    id: 'gunner', name: 'Мародёр с «макаровым»', description: 'Стреляет первым, думает никогда.',
    level: 3, stats: stats(5, 6, 5, 6), skill: 45, hp: 34,
    weapon: gun('pm'), armor: { dt: 1, dr: 10 },
    look: { body: 'humanoid', skin: '#b88762', cloth: '#4b4f3a', accent: '#2c2e22', armor: 'cloth', headgear: 'gasmask', eyes: '#222' },
    xp: 32, caps: [10, 35],
    loot: [{ item: 'pm', chance: 25 }, { item: 'ammo_9', chance: 70, min: 4, max: 12 }, { item: 'gasmask', chance: 15 }],
  },
  {
    id: 'ghoul', name: 'Дикий гуль', description: 'Бывший человек. Радиация съела мозг, кожу и манеры.',
    level: 3, stats: stats(5, 4, 6, 6), skill: 45, hp: 32,
    weapon: natural('Когти', [4, 9], 3), armor: { dt: 0, dr: 5 },
    look: { body: 'humanoid', skin: '#8c7a4c', cloth: '#3a3226', eyes: '#d6ff3a', head: 'skull', extras: ['claws'], bulk: 0.85 },
    xp: 30, caps: [0, 10], loot: [{ item: 'scrap', chance: 30 }, { item: 'chip', chance: 10 }],
  },
  {
    id: 'infected', name: 'Заражённый лаборант', description: 'Халат в крови, глаза светятся. Штамм «Вектор» в действии.',
    level: 4, stats: stats(6, 5, 6, 6), skill: 50, hp: 42,
    weapon: natural('Шприц-коготь', [5, 11], 3), armor: { dt: 1, dr: 5 },
    look: { body: 'humanoid', skin: '#a7b39a', cloth: '#d9d6c7', accent: '#8e2a2a', eyes: '#7dff5a', head: 'bald', armor: 'cloth' },
    xp: 42, caps: [0, 20], loot: [{ item: 'stim', chance: 25 }, { item: 'antirad', chance: 15 }, { item: 'vector_sample', chance: 35 }],
  },
  {
    id: 'brute', name: 'Мутант-громила', description: 'Два с половиной метра зелёных мышц и ненависти.',
    level: 6, stats: stats(9, 4, 8, 4), skill: 55, hp: 85,
    weapon: gun('sledge'), armor: { dt: 3, dr: 20 },
    look: { body: 'humanoid', skin: '#6f8f4a', cloth: '#3b2a1c', eyes: '#ffdd33', head: 'mutant', bulk: 1.4, scale: 1.15 },
    xp: 75, caps: [15, 50], loot: [{ item: 'sledge', chance: 12 }, { item: 'scrap', chance: 50, min: 1, max: 3 }],
  },
  {
    id: 'vector0', name: 'Штамм «Вектор-0»', description: 'Нулевой пациент. Пульсирующая масса, когда-то бывшая завлабом.',
    level: 7, stats: stats(9, 6, 9, 5, 6), skill: 60, hp: 150, boss: true,
    weapon: natural('Щупальце', [10, 18], 4), armor: { dt: 3, dr: 20 },
    look: { body: 'humanoid', skin: '#9fbf6f', cloth: '#cfcab8', accent: '#9c1f2b', eyes: '#aaff00', head: 'mutant', extras: ['spikes', 'glow'], bulk: 1.3, scale: 1.2 },
    xp: 300, caps: [100, 200], loot: [{ item: 'superstim', chance: 100, min: 2, max: 2 }, { item: 'laser', chance: 60 }, { item: 'cell', chance: 100, min: 20, max: 30 }],
  },
  // ── Кольская сверхглубокая ──
  {
    id: 'deepdweller', name: 'Глубинник', description: 'Бледный, безглазый, поднимается из скважины по ночам.',
    level: 7, stats: stats(7, 8, 7, 7), skill: 60, hp: 70,
    weapon: natural('Когти-кирки', [8, 15], 3), armor: { dt: 2, dr: 15 },
    look: { body: 'humanoid', skin: '#d9d2c3', cloth: '#2f2a24', eyes: '#ffffff', head: 'skull', extras: ['claws'], bulk: 0.9 },
    xp: 80, caps: [5, 30], loot: [{ item: 'kola_core', chance: 25 }, { item: 'chip', chance: 20 }],
  },
  {
    id: 'drillworm', name: 'Буровой червь', description: 'Пробурил себе дорогу с 12 километров. Обиделся.',
    level: 8, stats: stats(8, 5, 9, 5), skill: 60, hp: 100,
    weapon: natural('Кольцевая пасть', [10, 18], 4, 'bite'), armor: { dt: 4, dr: 25 },
    look: { body: 'beast', skin: '#7a4b45', eyes: '#ff7a00', extras: ['spikes'], bulk: 1.3, scale: 1.05 },
    xp: 95, caps: [0, 10], loot: [{ item: 'kola_core', chance: 40 }, { item: 'scrap', chance: 50, min: 2, max: 4 }],
  },
  {
    id: 'voice', name: 'Голос из скважины', description: 'Те самые «крики из ада» с глубины 12 262 метров. Обрели плоть.',
    level: 11, stats: stats(10, 9, 10, 7, 7), skill: 75, hp: 260, boss: true,
    weapon: natural('Адское пламя', [16, 28], 4, 'plasma'), armor: { dt: 6, dr: 30 },
    look: { body: 'humanoid', skin: '#5e1f1a', cloth: '#1a0d0b', eyes: '#ffb000', head: 'mutant', extras: ['horns', 'glow', 'tail'], bulk: 1.3, scale: 1.25 },
    xp: 650, caps: [250, 400], loot: [{ item: 'kola_core', chance: 100, min: 2, max: 3 }, { item: 'plasma', chance: 50 }, { item: 'microcell', chance: 100, min: 10, max: 20 }],
  },
  // ── Тунгуска ──
  {
    id: 'elk', name: 'Лось-двухголовый', description: 'Тайга мутировала. Лось — тоже. Рога острые с обеих голов.',
    level: 5, stats: stats(8, 5, 7, 6), skill: 50, hp: 60,
    weapon: natural('Рога', [6, 14], 4), armor: { dt: 1, dr: 10 },
    look: { body: 'beast', skin: '#5c4330', eyes: '#ff5a2f', extras: ['horns', 'mane'], bulk: 1.2, scale: 1.0 },
    xp: 55, caps: [0, 0], loot: [{ item: 'tushonka', chance: 40, min: 1, max: 2 }],
  },
  {
    id: 'crystalman', name: 'Кристаллизованный', description: 'Эвенк-охотник, проросший светящимися кристаллами.',
    level: 6, stats: stats(7, 6, 8, 5), skill: 55, hp: 70,
    weapon: natural('Кристальные шипы', [7, 14], 4), armor: { dt: 4, dr: 25 },
    look: { body: 'humanoid', skin: '#7aa3b8', cloth: '#3b3328', eyes: '#9ff4ff', head: 'normal', extras: ['crystals', 'glow'], bulk: 1.05 },
    xp: 70, caps: [5, 20], loot: [{ item: 'tunguska_crystal', chance: 45 }],
  },
  {
    id: 'agdy', name: 'Огненный змей Агды', description: 'Эвенки говорили: в 1908 году с неба упал Агды. Он не улетел.',
    level: 10, stats: stats(10, 8, 10, 8, 7), skill: 70, hp: 230, boss: true,
    weapon: natural('Огненное дыхание', [14, 26], 4, 'plasma'), armor: { dt: 5, dr: 30 },
    look: { body: 'beast', skin: '#b5361d', eyes: '#fff15a', extras: ['spikes', 'glow', 'tail', 'crystals'], bulk: 1.4, scale: 1.25 },
    xp: 550, caps: [150, 300], loot: [{ item: 'tunguska_crystal', chance: 100, min: 3, max: 4 }, { item: 'superstim', chance: 100 }],
  },
  // ── Ямантау ──
  {
    id: 'garrison', name: 'Солдат гарнизона', description: 'Сорок лет охраняют бункер. Приказа об отмене не было.',
    level: 8, stats: stats(6, 7, 6, 6), skill: 65, hp: 70,
    weapon: gun('ak74'), armor: { dt: 5, dr: 30 },
    look: { body: 'humanoid', skin: '#c99a76', cloth: '#3e4a34', accent: '#1f261a', armor: 'vest', headgear: 'helmet', eyes: '#222' },
    xp: 90, caps: [20, 60],
    loot: [{ item: 'ak74', chance: 15 }, { item: 'ammo_545', chance: 80, min: 8, max: 20 }, { item: 'vest6b43', chance: 6 }, { item: 'stim', chance: 30 }],
  },
  {
    id: 'sentry', name: 'Охранный робот «Страж»', description: 'Гусеницы, пулемёт и вечная бдительность.',
    level: 9, stats: stats(9, 8, 9, 4), skill: 70, hp: 110,
    weapon: { ...gun('ak74'), name: 'Встроенный ПКТ' }, armor: { dt: 8, dr: 35 },
    look: { body: 'humanoid', skin: '#7c7f73', cloth: '#4a4c44', accent: '#ff2a2a', eyes: '#ff2a2a', head: 'robot', extras: ['antenna'], bulk: 1.25 },
    xp: 110, caps: [0, 0], loot: [{ item: 'chip', chance: 80, min: 1, max: 3 }, { item: 'scrap', chance: 80, min: 2, max: 4 }, { item: 'cell', chance: 40, min: 5, max: 10 }],
  },
  {
    id: 'deadhand', name: 'Периметр «Мёртвая рука»', description: 'Автоматическая система ответного удара. Решила, что удар — это ты.',
    level: 13, stats: stats(10, 10, 10, 6, 8), skill: 80, hp: 320, boss: true,
    weapon: { ...gun('plasma'), name: 'Импульсная пушка' }, armor: { dt: 10, dr: 40 },
    look: { body: 'humanoid', skin: '#5b5e55', cloth: '#2f312b', accent: '#ff3d00', eyes: '#ff3d00', head: 'robot', extras: ['antenna', 'glow', 'spikes'], bulk: 1.4, scale: 1.25 },
    xp: 900, caps: [300, 500], loot: [{ item: 'perimeter_card', chance: 100 }, { item: 'power', chance: 40 }, { item: 'microcell', chance: 100, min: 15, max: 25 }],
  },
  // ── Дуга / Чернобыль-2 ──
  {
    id: 'burned', name: 'Выжженный', description: 'Слишком долго стоял у излучателя. Мозг — как яичница.',
    level: 7, stats: stats(6, 6, 7, 7), skill: 60, hp: 60,
    weapon: gun('sawnoff'), armor: { dt: 2, dr: 15 },
    look: { body: 'humanoid', skin: '#7a5a48', cloth: '#556b3a', accent: '#33421f', armor: 'hazmat', headgear: 'gasmask', eyes: '#ff2a00' },
    xp: 80, caps: [10, 40], loot: [{ item: 'sawnoff', chance: 15 }, { item: 'ammo_12', chance: 70, min: 4, max: 10 }, { item: 'ozk', chance: 8 }, { item: 'antirad', chance: 30 }],
  },
  {
    id: 'radghoul', name: 'Светящийся гуль', description: 'Настолько радиоактивен, что читать можно в его свете.',
    level: 8, stats: stats(6, 6, 8, 7), skill: 62, hp: 75,
    weapon: natural('Радиоактивные когти', [8, 16], 3), armor: { dt: 2, dr: 15 },
    look: { body: 'humanoid', skin: '#6f9a3a', cloth: '#2b3320', eyes: '#eaff00', head: 'skull', extras: ['glow', 'claws'] },
    xp: 90, caps: [0, 15], loot: [{ item: 'antirad', chance: 25 }, { item: 'chip', chance: 20 }],
  },
  {
    id: 'woodpecker', name: 'Оператор «Дятла»', description: 'Последний оператор загоризонтной РЛС. Слышит стук прямо в голове.',
    level: 12, stats: stats(8, 10, 9, 8, 8), skill: 78, hp: 280, boss: true,
    weapon: { ...gun('laser'), name: 'Излучатель «Дуга»', damage: [18, 30] }, armor: { dt: 6, dr: 35 },
    look: { body: 'humanoid', skin: '#b39b86', cloth: '#2e3530', accent: '#11ff9a', eyes: '#11ff9a', headgear: 'sphere', armor: 'hazmat', extras: ['antenna', 'glow'] },
    xp: 800, caps: [250, 450], loot: [{ item: 'duga_tape', chance: 100 }, { item: 'sphere', chance: 60 }, { item: 'cell', chance: 100, min: 20, max: 40 }],
  },
  // ── Метро-2 ──
  {
    id: 'kgbghoul', name: 'Гуль-спецназовец', description: 'Охранял секретную ветку с 1991 года. Всё ещё при исполнении.',
    level: 10, stats: stats(7, 8, 8, 8), skill: 70, hp: 95,
    weapon: gun('ak74'), armor: { dt: 5, dr: 30 },
    look: { body: 'humanoid', skin: '#8c7a4c', cloth: '#2c3328', accent: '#11140f', armor: 'vest', headgear: 'sphere', head: 'skull', eyes: '#d6ff3a' },
    xp: 120, caps: [20, 60], loot: [{ item: 'ammo_545', chance: 80, min: 10, max: 20 }, { item: 'sphere', chance: 8 }, { item: 'superstim', chance: 15 }],
  },
  {
    id: 'tunnelrat', name: 'Туннельный крысоволк', description: 'Крыса. Волк. Метро. Не спрашивай.',
    level: 9, stats: stats(8, 7, 8, 9), skill: 68, hp: 85,
    weapon: natural('Пасть', [9, 17], 3, 'bite'), armor: { dt: 2, dr: 15 },
    look: { body: 'beast', skin: '#4d4038', eyes: '#ff3b2f', extras: ['tail', 'mane', 'spikes'], bulk: 1.15, scale: 0.9 },
    xp: 100, caps: [0, 0], loot: [{ item: 'ratskin', chance: 80, min: 1, max: 3 }],
  },
  {
    id: 'commandant', name: 'Комендант объекта Д-6', description: 'Генерал в силовой броне. Последний приказ — «никого не впускать».',
    level: 14, stats: stats(10, 9, 10, 7, 8), skill: 85, hp: 340, boss: true,
    weapon: gun('svd'), armor: { dt: 11, dr: 45 },
    look: { body: 'humanoid', skin: '#c99a76', cloth: '#5d6150', accent: '#2b2d24', armor: 'power', headgear: 'power', eyes: '#ffcc00', bulk: 1.3, scale: 1.15 },
    xp: 1100, caps: [400, 700], loot: [{ item: 'svd', chance: 70 }, { item: 'power', chance: 35 }, { item: 'ammo_762', chance: 100, min: 20, max: 30 }],
  },
  // ── Зона 51 ──
  {
    id: 'camodude', name: 'Охранник «Камуфляжник»', description: 'Те самые парни в камуфляже на джипах у периметра Зоны 51.',
    level: 12, stats: stats(7, 9, 8, 8), skill: 78, hp: 110,
    weapon: gun('svd'), armor: { dt: 6, dr: 35 },
    look: { body: 'humanoid', skin: '#d1a27c', cloth: '#a68a5b', accent: '#6b5638', armor: 'vest', headgear: 'helmet', eyes: '#222' },
    xp: 150, caps: [40, 90], loot: [{ item: 'ammo_762', chance: 80, min: 6, max: 14 }, { item: 'superstim', chance: 20 }, { item: 'vest6b43', chance: 10 }],
  },
  {
    id: 'grey', name: 'Серый', description: 'Метр двадцать, огромные чёрные глаза и лазер. Пришёл с миром? Нет.',
    level: 13, stats: stats(4, 10, 6, 10, 9), skill: 85, hp: 90,
    weapon: gun('laser'), armor: { dt: 4, dr: 30 },
    look: { body: 'humanoid', skin: '#9aa3a8', cloth: '#9aa3a8', eyes: '#050505', head: 'alien', bulk: 0.8, scale: 0.85 },
    xp: 170, caps: [0, 30], loot: [{ item: 'cell', chance: 80, min: 8, max: 15 }, { item: 'ufo_shard', chance: 35 }, { item: 'blaster', chance: 4 }],
  },
  {
    id: 's4pilot', name: 'Пилот объекта S-4', description: 'Тот, кто управлял тарелкой в 1947-м. Очень злой после 80 лет в морозилке.',
    level: 16, stats: stats(8, 10, 10, 10, 10), skill: 92, hp: 420, boss: true,
    weapon: gun('blaster'), armor: { dt: 10, dr: 45 },
    look: { body: 'humanoid', skin: '#7f9ca8', cloth: '#30393d', accent: '#5affff', eyes: '#000000', head: 'alien', extras: ['glow', 'antenna'], bulk: 0.95, scale: 1.1 },
    xp: 1600, caps: [600, 1000], loot: [{ item: 'blaster', chance: 100 }, { item: 'ufo_shard', chance: 100, min: 2, max: 3 }],
  },
  // ── Дороги ──
  {
    id: 'wilddog', name: 'Дикий пёс', description: 'Стая бродячих собак. Лишайные, голодные, быстрые.',
    level: 2, stats: stats(4, 6, 4, 8), skill: 45, hp: 22,
    weapon: natural('Клыки', [3, 7], 3, 'bite'), armor: { dt: 0, dr: 0 },
    look: { body: 'beast', skin: '#6e5a3e', eyes: '#ffb000', extras: ['tail'], scale: 0.7, bulk: 0.85 },
    xp: 18, caps: [0, 0], loot: [],
  },
];

export const ENEMIES: Record<EnemyId, EnemyTemplate> = Object.fromEntries(ENEMY_LIST.map((e) => [e.id, e]));

export function getEnemy(id: EnemyId): EnemyTemplate {
  const enemy = ENEMIES[id];
  if (!enemy) throw new Error(`Неизвестный враг: ${id}`);
  return enemy;
}
