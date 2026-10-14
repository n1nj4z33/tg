import { FISTS, getItem, ITEMS } from './content/items.ts';
import type {
  ArmorItem,
  BodyPart,
  Combatant,
  CreatureLook,
  Equipment,
  ItemId,
  PartState,
  PerkId,
  Player,
  SkillKey,
  Skills,
  StatKey,
  Stats,
  WeaponSpec,
} from './types.ts';
import { clamp } from './rng.ts';

export const STAT_KEYS: StatKey[] = ['str', 'per', 'end', 'cha', 'int', 'agi', 'luck'];
export const SKILL_KEYS: SkillKey[] = ['guns', 'energy', 'melee', 'medicine', 'barter', 'survival'];

export const STAT_INFO: Record<StatKey, { short: string; name: string; description: string }> = {
  str: { short: 'СИЛ', name: 'Сила', description: 'Здоровье, урон в ближнем бою и переносимый вес.' },
  per: { short: 'ВОС', name: 'Восприятие', description: 'Меткость, инициатива и шанс найти тайник.' },
  end: { short: 'ВЫН', name: 'Выносливость', description: 'Здоровье, регенерация и защита от радиации.' },
  cha: { short: 'ХАР', name: 'Харизма', description: 'Цены у торговцев и награды за квесты.' },
  int: { short: 'ИНТ', name: 'Интеллект', description: 'Очки навыков за уровень и энергооружие.' },
  agi: { short: 'ЛОВ', name: 'Ловкость', description: 'Очки действия, уклонение, стрельба.' },
  luck: { short: 'УДЧ', name: 'Удача', description: 'Критические попадания и добыча.' },
};

export const SKILL_INFO: Record<SkillKey, { name: string; description: string }> = {
  guns: { name: 'Огнестрел', description: 'Пистолеты, обрезы, автоматы и винтовки.' },
  energy: { name: 'Энергооружие', description: 'Лазеры, плазма и всё, что нашли в ангаре S-4.' },
  melee: { name: 'Ближний бой', description: 'Кулаки, трубы, кувалды и кастеты.' },
  medicine: { name: 'Медицина', description: 'Эффективность стимуляторов и еды.' },
  barter: { name: 'Бартер', description: 'Цены покупки и продажи.' },
  survival: { name: 'Выживание', description: 'Поиск тайников, ловушки, побег из боя.' },
};

export const STAT_MIN = 1;
export const STAT_MAX = 10;
export const START_STAT_POINTS = 40;

/** Опыт, необходимый для достижения уровня. */
export const xpForLevel = (level: number): number => 50 * level * (level - 1);

export const hasPerk = (perks: readonly PerkId[], perk: PerkId): boolean => perks.includes(perk);

/** Итоговое значение навыка, %: база от характеристик + вложенные очки. */
export function skillValue(stats: Stats, skills: Skills, skill: SkillKey): number {
  const base: Record<SkillKey, number> = {
    guns: 5 + stats.agi * 4,
    energy: stats.agi * 2 + stats.int * 2,
    melee: 20 + (stats.str + stats.agi) * 2,
    medicine: (stats.per + stats.int) * 2,
    barter: stats.cha * 4,
    survival: (stats.end + stats.int) * 2,
  };
  return clamp(base[skill] + skills[skill], 0, 200);
}

export const skillPointsPerLevel = (stats: Stats): number => 5 + stats.int;

export function maxHp(p: Pick<Player, 'stats' | 'level' | 'perks' | 'rads'>): number {
  const perLevel = 3 + Math.floor(p.stats.end / 2) + (hasPerk(p.perks, 'lifegiver') ? 4 : 0);
  const base = 30 + p.stats.str * 2 + p.stats.end * 4 + (p.level - 1) * perLevel;
  return Math.max(1, base - Math.floor(p.rads / 20));
}

export function carryCapacity(p: Pick<Player, 'stats' | 'perks'>): number {
  return 20 + p.stats.str * 10 + (hasPerk(p.perks, 'strongBack') ? 25 : 0);
}

export function inventoryWeight(inventory: Record<ItemId, number>): number {
  let total = 0;
  for (const [id, count] of Object.entries(inventory)) total += (ITEMS[id]?.weight ?? 0) * count;
  return Math.round(total * 10) / 10;
}

export const isOverweight = (p: Player): boolean => inventoryWeight(p.inventory) > carryCapacity(p);

/** Скорость восстановления ОЗ вне боя — ОЗ в минуту. */
export const healingRate = (stats: Stats): number => Math.max(1, Math.floor(stats.end / 3));

const armorOf = (id: ItemId | null): ArmorItem | null => {
  if (!id) return null;
  const item = getItem(id);
  return item.type === 'armor' ? item : null;
};

export function radResistance(p: Pick<Player, 'stats' | 'perks' | 'equipment'>): number {
  const armor = (armorOf(p.equipment.body)?.radRes ?? 0) + (armorOf(p.equipment.head)?.radRes ?? 0);
  return clamp(armor + p.stats.end * 2 + (hasPerk(p.perks, 'leadBelly') ? 30 : 0), 0, 90);
}

export function equippedWeapon(equipment: Equipment): WeaponSpec {
  if (!equipment.weapon) return FISTS;
  const item = getItem(equipment.weapon);
  return item.type === 'weapon' ? item.weapon : FISTS;
}

// ── Части тела ──

export interface PartInfo {
  label: string;
  beastLabel: string;
  /** Штраф к попаданию, %. */
  hitPenalty: number;
  damageMult: number;
  critBonus: number;
  /** Доля макс. ОЗ, после которой часть покалечена. */
  crippleAt: number;
  crippleText: string;
}

export const BODY_PARTS: BodyPart[] = ['head', 'eyes', 'torso', 'groin', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg'];

export const PART_INFO: Record<BodyPart, PartInfo> = {
  head: { label: 'Голова', beastLabel: 'Голова', hitPenalty: 25, damageMult: 1.5, critBonus: 15, crippleAt: 0.35, crippleText: 'контужен: −2 ОД' },
  eyes: { label: 'Глаза', beastLabel: 'Глаза', hitPenalty: 40, damageMult: 1.3, critBonus: 25, crippleAt: 0.15, crippleText: 'ослеплён: −25% меткости' },
  torso: { label: 'Торс', beastLabel: 'Туловище', hitPenalty: 0, damageMult: 1, critBonus: 0, crippleAt: Infinity, crippleText: '' },
  groin: { label: 'Пах', beastLabel: 'Брюхо', hitPenalty: 20, damageMult: 1.2, critBonus: 10, crippleAt: 0.2, crippleText: 'скрючен: пропускает ход' },
  rightArm: { label: 'Правая рука', beastLabel: 'Передняя лапа', hitPenalty: 15, damageMult: 0.8, critBonus: 0, crippleAt: 0.3, crippleText: 'рука повреждена: −15% меткости' },
  leftArm: { label: 'Левая рука', beastLabel: 'Передняя лапа', hitPenalty: 15, damageMult: 0.8, critBonus: 0, crippleAt: 0.3, crippleText: 'рука повреждена: −15% меткости' },
  rightLeg: { label: 'Правая нога', beastLabel: 'Задняя лапа', hitPenalty: 10, damageMult: 0.8, critBonus: 0, crippleAt: 0.3, crippleText: 'нога повреждена: −1 ОД, уклонение хуже' },
  leftLeg: { label: 'Левая нога', beastLabel: 'Задняя лапа', hitPenalty: 10, damageMult: 0.8, critBonus: 0, crippleAt: 0.3, crippleText: 'нога повреждена: −1 ОД, уклонение хуже' },
};

export const partLabel = (part: BodyPart, look: CreatureLook): string =>
  look.body === 'beast' ? PART_INFO[part].beastLabel : PART_INFO[part].label;

export const emptyParts = (): PartState => ({ damage: {}, crippled: [] });

/** Очки действия с учётом покалеченных конечностей. */
export function currentAp(c: Combatant): number {
  let ap = c.maxAp;
  if (c.parts.crippled.includes('head')) ap -= 2;
  if (c.parts.crippled.includes('leftLeg')) ap -= 1;
  if (c.parts.crippled.includes('rightLeg')) ap -= 1;
  return Math.max(2, ap);
}

/** Уклонение цели, %. */
export function dodgeOf(c: Combatant): number {
  const legs = ['leftLeg', 'rightLeg'].filter((p) => c.parts.crippled.includes(p as BodyPart)).length;
  return Math.round((c.stats.agi * 2 + c.level) / (1 + legs));
}

/** Шанс попадания по части тела, %. */
export function hitChance(attacker: Combatant, target: Combatant, part: BodyPart): number {
  const w = attacker.weapon;
  let chance = attacker.skill + 40 + w.accuracy + (attacker.stats.per - 5) * 2;
  chance -= PART_INFO[part].hitPenalty;
  chance -= dodgeOf(target);
  if (w.minStr && attacker.stats.str < w.minStr) chance -= (w.minStr - attacker.stats.str) * 10;
  if (attacker.parts.crippled.includes('eyes')) chance -= 25;
  if (attacker.parts.crippled.includes('rightArm')) chance -= 15;
  if (attacker.parts.crippled.includes('leftArm')) chance -= 15;
  return clamp(Math.round(chance), 5, 95);
}

/** Шанс крита по части тела, %. */
export function critChance(attacker: Combatant, part: BodyPart): number {
  const aimed = part === 'head' || part === 'eyes' ? attacker.aimedCritBonus : 0;
  return clamp(attacker.critChance + PART_INFO[part].critBonus + aimed, 0, 95);
}

// ── Сборка бойца ──

export interface Loadout {
  id: string;
  name: string;
  level: number;
  stats: Stats;
  skills: Skills;
  perks: PerkId[];
  equipment: Equipment;
  look: Player['look'];
  hp: number;
  maxHp: number;
  /** Есть ли патроны к текущему оружию (у ботов арены — всегда). */
  hasAmmo: boolean;
}

const PISTOLS = new Set(['pistol', 'laser', 'blaster']);

/** Собирает бойца из персонажа игрока или снимка соперника по арене. */
export function combatantFromLoadout(l: Loadout, parts: PartState): Combatant {
  let weapon = equippedWeapon(l.equipment);
  if (weapon.ammo && !l.hasAmmo) weapon = FISTS;
  const weaponItem = l.equipment.weapon ? getItem(l.equipment.weapon) : null;
  if (weaponItem && weapon !== FISTS && hasPerk(l.perks, 'gunslinger') && PISTOLS.has(weaponItem.icon)) {
    weapon = { ...weapon, apCost: weapon.apCost - 1 };
  }
  const body = armorOf(l.equipment.body);
  const head = armorOf(l.equipment.head);
  const tough = hasPerk(l.perks, 'toughness');
  const armorStat = (a: ArmorItem | null) => ({ dt: (a?.dt ?? 0) + (tough ? 2 : 0), dr: (a?.dr ?? 0) + (tough ? 10 : 0) });
  const apPenalty = body?.apPenalty ?? 0;

  return {
    id: l.id,
    name: l.name,
    level: l.level,
    stats: l.stats,
    skill: skillValue(l.stats, l.skills, weapon.skill),
    hp: l.hp,
    maxHp: l.maxHp,
    maxAp: 5 + Math.floor(l.stats.agi / 2) + (hasPerk(l.perks, 'actionBoy') ? 1 : 0) - apPenalty,
    weapon,
    armor: { body: armorStat(body), head: armorStat(head) },
    critChance: l.stats.luck + (hasPerk(l.perks, 'finesse') ? 10 : 0),
    aimedCritBonus: hasPerk(l.perks, 'sniper') ? 15 : 0,
    critDamageBonus: hasPerk(l.perks, 'betterCrits') ? 0.5 : 0,
    meleeBonus: Math.max(0, l.stats.str - 5) + (hasPerk(l.perks, 'slayer') ? 6 : 0),
    bloodyMess: hasPerk(l.perks, 'bloodyMess'),
    parts,
    look: {
      body: 'humanoid',
      skin: l.look.skin,
      cloth: body?.look.color ?? '#4a4036',
      accent: body?.look.accent ?? '#2a241e',
      armor: body?.look.style ?? 'cloth',
      headgear: head ? (head.look.style === 'gasmask' ? 'gasmask' : head.look.style === 'sphere' ? 'sphere' : 'helmet') : body?.look.style === 'power' ? 'power' : 'none',
      head: 'normal',
      eyes: '#1d1d1d',
      hair: l.look.hair,
    },
  };
}

export function playerLoadout(p: Player): Loadout {
  const weapon = equippedWeapon(p.equipment);
  return {
    id: 'player',
    name: p.name,
    level: p.level,
    stats: p.stats,
    skills: p.skills,
    perks: p.perks,
    equipment: p.equipment,
    look: p.look,
    hp: p.hp,
    maxHp: maxHp(p),
    hasAmmo: !weapon.ammo || (p.inventory[weapon.ammo] ?? 0) > 0,
  };
}
