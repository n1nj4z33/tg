import type { EnemyId, ItemId, LocationId, LootEntry } from '../types.ts';

/** Ключ декорации — по нему клиент рисует фон сцены. */
export type SceneKey =
  | 'academ'
  | 'sewer'
  | 'lab'
  | 'tundra'
  | 'drill'
  | 'taiga'
  | 'crater'
  | 'mountain'
  | 'bunker'
  | 'marsh'
  | 'radar'
  | 'metro'
  | 'tunnel'
  | 'desert'
  | 'hangar'
  | 'wasteland'
  | 'arena';

export interface Settlement {
  id: LocationId;
  kind: 'settlement';
  name: string;
  region: string;
  description: string;
  /** Главная беда поселения — подаётся в интерфейсе как сводка. */
  problem: string;
  scene: SceneKey;
  /** Координаты на карте мира, 0..100. */
  map: { x: number; y: number };
  minLevel: number;
  trader: { name: string; greeting: string; stock: ItemId[] };
  innPrice: number;
  arenaName: string;
  zones: LocationId[];
  /** Кто может напасть по дороге в это поселение. */
  roadEnemies: EnemyId[];
}

export interface Zone {
  id: LocationId;
  kind: 'zone';
  name: string;
  settlement: LocationId;
  description: string;
  scene: SceneKey;
  level: [number, number];
  /** Сколько шагов вглубь до логова босса. */
  depth: number;
  enemies: ReadonlyArray<readonly [EnemyId, number]>;
  boss: EnemyId;
  radPerStep: number;
  caches: LootEntry[];
}

export type Location = Settlement | Zone;

const SETTLEMENT_LIST: Settlement[] = [
  {
    id: 'academ', kind: 'settlement', name: 'Академгородок', region: 'Новосибирск',
    description: 'Учёные пережили конец света в подвалах институтов СО РАН. Тут чинят, лечат и спорят о физике под гул дизельных генераторов.',
    problem: 'Из НИИ «Вектор» в Кольцово ползёт зараза, а в коллекторах расплодились радкрысы.',
    scene: 'academ', map: { x: 64, y: 44 }, minLevel: 1,
    trader: {
      name: 'Завхоз Семёныч', greeting: 'Всё по описи, товарищ. Крышки вперёд.',
      stock: ['shiv', 'pipe', 'pm', 'ammo_9', 'vatnik', 'leather', 'gasmask', 'helmet', 'stim', 'antirad', 'water', 'tushonka', 'vodka'],
    },
    innPrice: 10, arenaName: 'Ринг в спортзале НГУ',
    zones: ['academ_sewers', 'vector'], roadEnemies: ['radrat', 'wilddog', 'raider'],
  },
  {
    id: 'zapolyarny', kind: 'settlement', name: 'Заполярный', region: 'Кольский полуостров',
    description: 'Посёлок буровиков у Кольской сверхглубокой. Северное сияние, вечный холод и стук из-под земли.',
    problem: 'Из скважины СГ-3 по ночам лезут глубинники. Буровики говорят — снизу кто-то зовёт.',
    scene: 'tundra', map: { x: 40, y: 12 }, minLevel: 5,
    trader: {
      name: 'Бригадир Нильсен', greeting: 'Тепло стоит дорого. Как и всё остальное.',
      stock: ['sledge', 'sawnoff', 'ammo_12', 'ak74', 'ammo_545', 'scrapplate', 'ozk', 'stim', 'superstim', 'antirad', 'vodka'],
    },
    innPrice: 25, arenaName: 'Ледовая яма',
    zones: ['kola'], roadEnemies: ['wilddog', 'ghoul', 'raider'],
  },
  {
    id: 'vanavara', kind: 'settlement', name: 'Ванавара', region: 'Эвенкия',
    description: 'Фактория на Подкаменной Тунгуске. Эвенки-шаманы торгуют кристаллами из эпицентра и рассказывают об Агды.',
    problem: 'Тайга вокруг эпицентра 1908 года снова горит, а охотники превращаются в кристаллы.',
    scene: 'taiga', map: { x: 70, y: 30 }, minLevel: 4,
    trader: {
      name: 'Шаман Учур', greeting: 'Духи тайги говорят — у тебя есть крышки.',
      stock: ['shiv', 'sawnoff', 'ammo_12', 'leather', 'ozk', 'stim', 'antirad', 'water', 'tushonka'],
    },
    innPrice: 20, arenaName: 'Круг у чума',
    zones: ['tunguska'], roadEnemies: ['wilddog', 'elk'],
  },
  {
    id: 'mezhgorye', kind: 'settlement', name: 'Межгорье', region: 'Южный Урал',
    description: 'Закрытый город у горы Ямантау. Бывшие военные строители живут по уставу и пропускам.',
    problem: 'Гарнизон бункера в горе всё ещё воюет, а «Мёртвая рука» вот-вот решит, что война началась.',
    scene: 'mountain', map: { x: 48, y: 40 }, minLevel: 7,
    trader: {
      name: 'Прапорщик Кузьмич', greeting: 'Со склада списано — значит, твоё. За крышки.',
      stock: ['ak74', 'ammo_545', 'svd', 'ammo_762', 'vest6b43', 'helmet', 'scrapplate', 'stim', 'superstim', 'antirad'],
    },
    innPrice: 35, arenaName: 'Плац КПП-1',
    zones: ['yamantau'], roadEnemies: ['raider', 'gunner', 'ghoul'],
  },
  {
    id: 'yanov', kind: 'settlement', name: 'Лагерь «Янов»', region: 'Зона отчуждения',
    description: 'Ж/д станция Янов, превращённая в лагерь искателей. Дозиметры щёлкают, как кузнечики.',
    problem: 'Загоризонтная РЛС «Дуга» снова стучит в эфир, и люди сходят с ума.',
    scene: 'marsh', map: { x: 22, y: 38 }, minLevel: 6,
    trader: {
      name: 'Дед Мазай', greeting: 'Водка, антирадин, патроны — что ещё нужно для счастья?',
      stock: ['sawnoff', 'ammo_12', 'ak74', 'ammo_545', 'ozk', 'gasmask', 'antirad', 'vodka', 'stim', 'superstim'],
    },
    innPrice: 30, arenaName: 'Ржавая клетка',
    zones: ['duga'], roadEnemies: ['radghoul', 'burned', 'wilddog'],
  },
  {
    id: 'ramenki', kind: 'settlement', name: 'Раменки-43', region: 'Москва',
    description: 'Подземный город под Раменками, рассчитанный на 15 000 человек. Сейчас тут живёт втрое больше.',
    problem: 'Охрана секретной ветки Метро-2 не знает, что СССР больше нет, и стреляет на звук.',
    scene: 'metro', map: { x: 28, y: 32 }, minLevel: 9,
    trader: {
      name: 'Барыга Лёха', greeting: 'Есть всё, чего нет. Но не бесплатно.',
      stock: ['ak74', 'ammo_545', 'svd', 'ammo_762', 'laser', 'cell', 'vest6b43', 'sphere', 'superstim', 'antirad', 'powerfist'],
    },
    innPrice: 45, arenaName: 'Арена на «Парке Победы»',
    zones: ['metro2'], roadEnemies: ['kgbghoul', 'tunnelrat', 'gunner'],
  },
  {
    id: 'rachel', kind: 'settlement', name: 'Рейчел', region: 'Невада, США',
    description: 'Городок на «Внеземном шоссе» 375. Мотель «Little A’Le’Inn» стал крепостью охотников за НЛО.',
    problem: 'Охрана Зоны 51 расстреливает всех, кто приближается, а по ночам в небе снова огни.',
    scene: 'desert', map: { x: 8, y: 54 }, minLevel: 11,
    trader: {
      name: 'Мотельщица Пэт', greeting: 'Welcome, stranger! Платишь — получаешь. Задаёшь вопросы — получаешь пулю.',
      stock: ['svd', 'ammo_762', 'laser', 'cell', 'plasma', 'microcell', 'power', 'sphere', 'superstim', 'antirad'],
    },
    innPrice: 60, arenaName: 'Ринг у мотеля',
    zones: ['area51'], roadEnemies: ['camodude', 'raider', 'wilddog'],
  },
];

const ZONE_LIST: Zone[] = [
  {
    id: 'academ_sewers', kind: 'zone', name: 'Коллекторы Академа', settlement: 'academ',
    description: 'Тёплые трубы теплотрассы, вода по колено и писк сотен крыс.',
    scene: 'sewer', level: [1, 3], depth: 4,
    enemies: [['radrat', 5], ['molerat', 3], ['raider', 2]], boss: 'brute', radPerStep: 2,
    caches: [{ item: 'scrap', chance: 60 }, { item: 'tape', chance: 40 }, { item: 'stim', chance: 25 }, { item: 'ammo_9', chance: 40, min: 5, max: 12 }],
  },
  {
    id: 'vector', kind: 'zone', name: 'НИИ «Вектор» (Кольцово)', settlement: 'academ',
    description: 'Государственный центр вирусологии. Биобезопасность 4-го уровня больше не работает.',
    scene: 'lab', level: [3, 6], depth: 6,
    enemies: [['infected', 5], ['ghoul', 3], ['gunner', 2]], boss: 'vector0', radPerStep: 4,
    caches: [{ item: 'stim', chance: 50 }, { item: 'antirad', chance: 40 }, { item: 'chip', chance: 50 }, { item: 'cell', chance: 20, min: 4, max: 8 }],
  },
  {
    id: 'kola', kind: 'zone', name: 'Кольская сверхглубокая СГ-3', settlement: 'zapolyarny',
    description: '12 262 метра вглубь. Чем глубже, тем жарче. И громче крики.',
    scene: 'drill', level: [6, 10], depth: 7,
    enemies: [['deepdweller', 5], ['drillworm', 3], ['ghoul', 2]], boss: 'voice', radPerStep: 6,
    caches: [{ item: 'kola_core', chance: 30 }, { item: 'superstim', chance: 25 }, { item: 'ammo_545', chance: 40, min: 10, max: 20 }, { item: 'chip', chance: 40 }],
  },
  {
    id: 'tunguska', kind: 'zone', name: 'Тунгусский эпицентр', settlement: 'vanavara',
    description: 'Поваленный «телеграфный лес», выжженная тайга и болото, светящееся по ночам.',
    scene: 'crater', level: [5, 9], depth: 6,
    enemies: [['crystalman', 5], ['elk', 4], ['wilddog', 1]], boss: 'agdy', radPerStep: 8,
    caches: [{ item: 'tunguska_crystal', chance: 35 }, { item: 'antirad', chance: 40 }, { item: 'stim', chance: 30 }],
  },
  {
    id: 'yamantau', kind: 'zone', name: 'Бункер Ямантау', settlement: 'mezhgorye',
    description: 'Гора, внутри которой целый город. Гермоворота открыты. Это ловушка.',
    scene: 'bunker', level: [8, 12], depth: 7,
    enemies: [['garrison', 5], ['sentry', 4]], boss: 'deadhand', radPerStep: 3,
    caches: [{ item: 'ammo_545', chance: 60, min: 15, max: 30 }, { item: 'superstim', chance: 30 }, { item: 'vest6b43', chance: 8 }, { item: 'chip', chance: 50 }],
  },
  {
    id: 'duga', kind: 'zone', name: 'РЛС «Дуга» (Чернобыль-2)', settlement: 'yanov',
    description: 'Стена антенн высотой 150 метров посреди леса. Тук-тук-тук в эфире.',
    scene: 'radar', level: [7, 11], depth: 7,
    enemies: [['burned', 5], ['radghoul', 4], ['ghoul', 1]], boss: 'woodpecker', radPerStep: 12,
    caches: [{ item: 'antirad', chance: 50 }, { item: 'cell', chance: 30, min: 6, max: 12 }, { item: 'ammo_12', chance: 40, min: 6, max: 12 }],
  },
  {
    id: 'metro2', kind: 'zone', name: 'Метро-2 (объект Д-6)', settlement: 'ramenki',
    description: 'Секретная ветка под Москвой. Одна колея, гермодвери и шаги в темноте.',
    scene: 'tunnel', level: [9, 13], depth: 8,
    enemies: [['kgbghoul', 5], ['tunnelrat', 4]], boss: 'commandant', radPerStep: 4,
    caches: [{ item: 'ammo_762', chance: 40, min: 8, max: 15 }, { item: 'superstim', chance: 30 }, { item: 'sphere', chance: 6 }],
  },
  {
    id: 'area51', kind: 'zone', name: 'Зона 51 / Объект S-4', settlement: 'rachel',
    description: 'Озеро Грум, ангары, периметр с камерами. А под землёй — то, что упало в Розуэлле.',
    scene: 'hangar', level: [12, 16], depth: 9,
    enemies: [['camodude', 5], ['grey', 4], ['sentry', 1]], boss: 's4pilot', radPerStep: 5,
    caches: [{ item: 'ufo_shard', chance: 25 }, { item: 'microcell', chance: 40, min: 6, max: 12 }, { item: 'superstim', chance: 35 }],
  },
];

export const SETTLEMENTS: Record<LocationId, Settlement> = Object.fromEntries(SETTLEMENT_LIST.map((s) => [s.id, s]));
export const ZONES: Record<LocationId, Zone> = Object.fromEntries(ZONE_LIST.map((z) => [z.id, z]));

export const START_LOCATION: LocationId = 'academ';

export function getSettlement(id: LocationId): Settlement {
  const s = SETTLEMENTS[id];
  if (!s) throw new Error(`Неизвестное поселение: ${id}`);
  return s;
}

export function getZone(id: LocationId): Zone {
  const z = ZONES[id];
  if (!z) throw new Error(`Неизвестная локация: ${id}`);
  return z;
}

/** Дистанция между поселениями на карте — влияет на шанс встречи в пути. */
export function travelDistance(from: LocationId, to: LocationId): number {
  const a = getSettlement(from).map;
  const b = getSettlement(to).map;
  return Math.hypot(a.x - b.x, a.y - b.y);
}
