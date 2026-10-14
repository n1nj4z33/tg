import type { Perk, PerkId } from '../types.ts';

const PERK_LIST: Perk[] = [
  { id: 'bloodyMess', name: 'Кровавая баня', description: '+5% урона. Враги умирают самым зрелищным способом.', starter: true, minLevel: 1 },
  { id: 'finesse', name: 'Ювелир', description: '+10% шанс критического попадания.', starter: true, minLevel: 1 },
  { id: 'strongBack', name: 'Вьючный мул', description: '+25 кг к переносимому весу.', starter: true, minLevel: 1 },
  { id: 'toughness', name: 'Толстокожий', description: '+2 к порогу урона и +10% сопротивления.', starter: true, minLevel: 1 },
  { id: 'sniper', name: 'Снайпер', description: '+15% к шансу крита при выстреле в голову и глаза.', minLevel: 3 },
  { id: 'actionBoy', name: 'Шустрый', description: '+1 очко действия в бою.', minLevel: 3 },
  { id: 'lifegiver', name: 'Живучий', description: '+4 ОЗ за каждый уровень.', minLevel: 3 },
  { id: 'scrounger', name: 'Мусорщик', description: 'Находишь больше добычи в тайниках и на трупах.', minLevel: 3 },
  { id: 'leadBelly', name: 'Свинцовое брюхо', description: '+30% защиты от радиации.', minLevel: 6 },
  { id: 'slayer', name: 'Мясник', description: '+6 к урону в ближнем бою.', minLevel: 6 },
  { id: 'betterCrits', name: 'Мастер критов', description: 'Критические попадания наносят +50% урона.', minLevel: 9 },
  { id: 'gunslinger', name: 'Ковбой', description: 'Выстрелы из пистолетов стоят на 1 ОД меньше.', minLevel: 6 },
];

export const PERKS: Record<PerkId, Perk> = Object.fromEntries(PERK_LIST.map((p) => [p.id, p]));
export const PERK_IDS = PERK_LIST.map((p) => p.id);

export function getPerk(id: PerkId): Perk {
  const p = PERKS[id];
  if (!p) throw new Error(`Неизвестный перк: ${id}`);
  return p;
}
