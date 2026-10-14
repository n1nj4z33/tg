import { getItem, type Item, type ItemId } from '@radclub/engine';

export const kg = (w: number): string => `${w < 0.1 ? Math.round(w * 100) / 100 : Math.round(w * 10) / 10} кг`;

/** Краткая сводка характеристик предмета одной строкой. */
export function itemSummary(id: ItemId): string {
  const it: Item = getItem(id);
  switch (it.type) {
    case 'weapon': {
      const w = it.weapon;
      const ammo = w.ammo ? ` · ${getItem(w.ammo).name.replace('Патроны ', '')}` : '';
      return `Урон ${w.damage[0]}–${w.damage[1]} · ${w.apCost} ОД${ammo} · ${kg(it.weight)}`;
    }
    case 'armor':
      return `ПУ ${it.dt} · СУ ${it.dr}% · Рад ${it.radRes}%${it.apPenalty ? ` · −${it.apPenalty} ОД` : ''} · ${kg(it.weight)}`;
    case 'consumable': {
      const parts = [];
      if (it.effect.heal) parts.push(`+${it.effect.heal} ОЗ`);
      if (it.effect.rads) parts.push(`${it.effect.rads} рад`);
      if (it.effect.healLimbs) parts.push('лечит конечности');
      return [...parts, kg(it.weight)].join(' · ');
    }
    default:
      return `${kg(it.weight)} · цена ${it.value}`;
  }
}

export const ITEM_CATEGORY: Record<Item['type'], string> = {
  weapon: 'Оружие',
  armor: 'Броня',
  consumable: 'Медицина и еда',
  ammo: 'Боеприпасы',
  junk: 'Хлам и трофеи',
  quest: 'Квестовое',
};

export const plural = (n: number, one: string, few: string, many: string): string => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

export const capsText = (n: number): string => `${n} ${plural(Math.abs(n), 'крышка', 'крышки', 'крышек')}`;
