import type { ArmorItem, ConsumableItem, Item, ItemId, SimpleItem, WeaponItem, WeaponSpec } from '../types.ts';

const weapon = (
  id: string,
  name: string,
  description: string,
  weight: number,
  value: number,
  icon: WeaponItem['icon'],
  spec: Omit<WeaponSpec, 'name'>,
): WeaponItem => ({ id, name, description, weight, value, icon, type: 'weapon', weapon: { name, ...spec } });

const armor = (
  id: string,
  name: string,
  description: string,
  weight: number,
  value: number,
  icon: ArmorItem['icon'],
  spec: Pick<ArmorItem, 'slot' | 'dt' | 'dr' | 'radRes' | 'look'> & { apPenalty?: number },
): ArmorItem => ({ id, name, description, weight, value, icon, type: 'armor', ...spec });

const consumable = (
  id: string,
  name: string,
  description: string,
  weight: number,
  value: number,
  icon: ConsumableItem['icon'],
  effect: ConsumableItem['effect'],
  combatApCost: number | null,
): ConsumableItem => ({ id, name, description, weight, value, icon, type: 'consumable', effect, combatApCost });

const simple = (
  type: SimpleItem['type'],
  id: string,
  name: string,
  description: string,
  weight: number,
  value: number,
  icon: SimpleItem['icon'],
): SimpleItem => ({ id, name, description, weight, value, icon, type });

/** Голые руки — используются, когда оружия нет или кончились патроны. */
export const FISTS: WeaponSpec = {
  name: 'Кулаки',
  skill: 'melee',
  damage: [1, 4],
  apCost: 3,
  accuracy: 10,
  critMult: 1.5,
  fx: 'melee',
};

const ITEM_LIST: Item[] = [
  // ── Холодное оружие ──
  weapon('shiv', 'Заточка', 'Напильник, обмотанный изолентой. Классика тюремного дизайна.', 0.3, 10, 'knife', {
    skill: 'melee', damage: [2, 7], apCost: 3, accuracy: 15, critMult: 2, fx: 'melee',
  }),
  weapon('pipe', 'Обрезок трубы', 'Чугунный аргумент в любом споре.', 1.5, 25, 'pipe', {
    skill: 'melee', damage: [4, 10], apCost: 4, accuracy: 5, critMult: 1.5, fx: 'melee',
  }),
  weapon('sledge', 'Кувалда', 'Тяжёлая. Очень тяжёлая. Зато голова врага — плоская.', 6, 160, 'hammer', {
    skill: 'melee', damage: [11, 22], apCost: 5, accuracy: 0, critMult: 2, minStr: 6, fx: 'melee',
  }),
  weapon('powerfist', 'Силовой кастет «Удар»', 'Пневмопоршень на перчатке. Ломает рёбра через бронежилет.', 4, 900, 'fist', {
    skill: 'melee', damage: [16, 28], apCost: 4, accuracy: 10, critMult: 2, minStr: 5, fx: 'melee',
  }),
  // ── Огнестрел ──
  weapon('pm', 'Пистолет Макарова', 'Надёжный, как советский лифт. Патроны 9×18.', 0.8, 90, 'pistol', {
    skill: 'guns', damage: [6, 12], apCost: 4, accuracy: 10, critMult: 2, ammo: 'ammo_9', fx: 'bullet',
  }),
  weapon('sawnoff', 'Обрез ИЖ-43', 'Два ствола, одна проблема — перезарядка. Дробь 12 калибра.', 2.2, 180, 'shotgun', {
    skill: 'guns', damage: [12, 26], apCost: 5, accuracy: -10, critMult: 1.5, ammo: 'ammo_12', fx: 'pellets',
  }),
  weapon('ak74', 'АК-74', 'Автомат Калашникова. Работает в грязи, песке и радиоактивной пыли.', 3.6, 480, 'rifle', {
    skill: 'guns', damage: [11, 19], apCost: 5, accuracy: 10, critMult: 2, minStr: 4, ammo: 'ammo_545', fx: 'bullet',
  }),
  weapon('svd', 'Снайперская винтовка Драгунова', 'Попадает в глаз белке за километр. А мутанту — тем более.', 4.3, 1100, 'sniper', {
    skill: 'guns', damage: [19, 32], apCost: 6, accuracy: 25, critMult: 2.5, minStr: 5, ammo: 'ammo_762', fx: 'bullet',
  }),
  // ── Энергетическое ──
  weapon('laser', 'Лазерный пистолет «Луч-2»', 'Опытный образец НИИ. Испаряет плоть, оставляя горстку пепла.', 1.2, 800, 'laser', {
    skill: 'energy', damage: [12, 20], apCost: 4, accuracy: 15, critMult: 2, ammo: 'cell', fx: 'laser',
  }),
  weapon('plasma', 'Плазменная винтовка «Гроза»', 'Превращает цели в зелёную слизь. Не направлять на друзей.', 5, 2600, 'plasma', {
    skill: 'energy', damage: [26, 44], apCost: 5, accuracy: 10, critMult: 2, minStr: 5, ammo: 'microcell', fx: 'plasma',
  }),
  weapon('blaster', 'Бластер пришельцев', 'Найден в ангаре S-4. Принцип действия неизвестен. Работает отлично.', 1, 5000, 'blaster', {
    skill: 'energy', damage: [38, 60], apCost: 4, accuracy: 20, critMult: 3, ammo: 'cell', fx: 'laser',
  }),
  // ── Броня ──
  armor('vatnik', 'Ватник', 'Тёплый, мягкий, почти не защищает. Но с душой.', 2, 15, 'jacket', {
    slot: 'body', dt: 0, dr: 5, radRes: 0, look: { color: '#4b4f3a', accent: '#2c2e22', style: 'cloth' },
  }),
  armor('leather', 'Кожаная куртка', 'Косуха рейдера. Пахнет бензином и плохими решениями.', 5, 140, 'jacket', {
    slot: 'body', dt: 2, dr: 15, radRes: 0, look: { color: '#5a3a24', accent: '#2f1d10', style: 'jacket' },
  }),
  armor('ozk', 'ОЗК (химзащита)', 'Общевойсковой защитный комплект. Резина спасает от радиации.', 4, 260, 'hazmat', {
    slot: 'body', dt: 1, dr: 10, radRes: 40, look: { color: '#556b3a', accent: '#33421f', style: 'hazmat' },
  }),
  armor('scrapplate', 'Броня из листового металла', 'Капоты «Жигулей», болты и вера в лучшее.', 12, 420, 'plate', {
    slot: 'body', dt: 4, dr: 25, radRes: 5, apPenalty: 1, look: { color: '#6d6a62', accent: '#3c3a35', style: 'plate' },
  }),
  armor('vest6b43', 'Бронежилет 6Б43', 'Армейская защита со склада Ямантау.', 10, 1300, 'vest', {
    slot: 'body', dt: 6, dr: 35, radRes: 10, look: { color: '#3e4a34', accent: '#1f261a', style: 'vest' },
  }),
  armor('power', 'Силовая броня «Ратник-М»', 'Экзоскелет с бронепластинами. Делает из человека танк.', 40, 6500, 'power', {
    slot: 'body', dt: 12, dr: 50, radRes: 35, look: { color: '#5d6150', accent: '#2b2d24', style: 'power' },
  }),
  armor('gasmask', 'Противогаз ГП-5', 'Слоник. Спасает от радиоактивной пыли и запаха гулей.', 1, 40, 'gasmask', {
    slot: 'head', dt: 0, dr: 5, radRes: 20, look: { color: '#5b6b4a', accent: '#20251a', style: 'gasmask' },
  }),
  armor('helmet', 'Каска СШ-68', 'Стальной шлем образца 1968 года. Видал вещи и похуже.', 1.5, 90, 'helmet', {
    slot: 'head', dt: 2, dr: 15, radRes: 0, look: { color: '#4a5a3a', accent: '#2a331f', style: 'helmet' },
  }),
  armor('sphere', 'Шлем «Сфера»', 'Титановый шлем спецназа с забралом.', 2, 700, 'helmet', {
    slot: 'head', dt: 4, dr: 30, radRes: 15, look: { color: '#2e3530', accent: '#11ff9a', style: 'sphere' },
  }),
  // ── Расходники ──
  consumable('stim', 'Стимулятор', 'Шприц-тюбик с регенерирующим коктейлем. +30 ОЗ.', 0.1, 50, 'syringe', { heal: 30 }, 2),
  consumable('superstim', 'Супер-стимулятор', 'Армейская версия. +80 ОЗ и вправляет конечности.', 0.2, 160, 'syringe', { heal: 80, healLimbs: true }, 3),
  consumable('antirad', 'Антирадин', 'Выводит радионуклиды. -150 рад.', 0.1, 70, 'pills', { rads: -150 }, null),
  consumable('vodka', 'Водка «Столичная»', 'Народное средство от радиации. -20 рад, +5 ОЗ.', 0.5, 20, 'bottle', { heal: 5, rads: -20 }, 2),
  consumable('tushonka', 'Тушёнка', 'Банка ГОСТовской тушёнки 1987 года. +15 ОЗ.', 0.4, 15, 'can', { heal: 15 }, null),
  consumable('water', 'Чистая вода', 'Фильтрованная вода. Роскошь пустоши. +10 ОЗ.', 0.5, 12, 'water', { heal: 10 }, null),
  // ── Боеприпасы ──
  simple('ammo', 'ammo_9', 'Патроны 9×18', 'Для пистолета Макарова.', 0.01, 2, 'ammo'),
  simple('ammo', 'ammo_12', 'Дробь 12 к.', 'Картечь для обреза.', 0.04, 4, 'ammo'),
  simple('ammo', 'ammo_545', 'Патроны 5,45×39', 'Для АК-74.', 0.01, 4, 'ammo'),
  simple('ammo', 'ammo_762', 'Патроны 7,62×54R', 'Винтовочные, для СВД.', 0.02, 7, 'ammo'),
  simple('ammo', 'cell', 'Энергоячейка', 'Батарея для лазерного оружия.', 0.05, 8, 'cell'),
  simple('ammo', 'microcell', 'Микроядерная ячейка', 'Питание для плазменного оружия.', 0.1, 15, 'cell'),
  // ── Хлам и трофеи ──
  simple('junk', 'scrap', 'Металлолом', 'Ржавые железки. Торговцы берут на переплавку.', 2, 6, 'scrap'),
  simple('junk', 'chip', 'Микросхемы', 'Советская электроника. Золото в ножках!', 0.3, 35, 'chip'),
  simple('junk', 'tape', 'Изолента', 'Синяя. Чинит всё.', 0.2, 10, 'tape'),
  simple('junk', 'ratskin', 'Шкура радкрысы', 'Вонючая, но из неё шьют перчатки.', 0.5, 8, 'scrap'),
  simple('junk', 'tunguska_crystal', 'Тунгусский кристалл', 'Тёплый на ощупь. Светится, когда рядом кто-то врёт.', 0.5, 320, 'crystal'),
  simple('junk', 'kola_core', 'Керн с глубины 12 км', 'Образец породы из СГ-3. Изнутри доносится стук.', 3, 450, 'core'),
  simple('junk', 'ufo_shard', 'Обломок НЛО', 'Металл, который невозможно поцарапать.', 1, 900, 'alien'),
  // ── Квестовые ──
  simple('quest', 'vector_sample', 'Образец штамма', 'Пробирка из НИИ «Вектор». Лучше не ронять.', 0.2, 0, 'vial'),
  simple('quest', 'perimeter_card', 'Перфокарта «Периметра»', 'Код доступа системы «Мёртвая рука».', 0.1, 0, 'card'),
  simple('quest', 'duga_tape', 'Бобина с записью «Дуги»', 'На плёнке — стук. Тот самый «русский дятел».', 0.4, 0, 'tape'),
];

export const ITEMS: Record<ItemId, Item> = Object.fromEntries(ITEM_LIST.map((item) => [item.id, item]));

export function getItem(id: ItemId): Item {
  const item = ITEMS[id];
  if (!item) throw new Error(`Неизвестный предмет: ${id}`);
  return item;
}
