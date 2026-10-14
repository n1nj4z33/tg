import { getItem, type ItemId } from '@radclub/engine';
import type { ReactNode } from 'react';
import { ItemIcon } from '../art/ItemIcon.tsx';
import { cx } from './cx.ts';

interface ItemRowProps {
  item: ItemId;
  count?: number;
  /** Подстрока под названием (вес, урон…). */
  sub?: ReactNode;
  right?: ReactNode;
  badge?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}

/** Строка предмета — используется в инвентаре, у торговца, в добыче и квестах. */
export function ItemRow({ item, count, sub, right, badge, selected, onClick }: ItemRowProps) {
  const it = getItem(item);
  return (
    <button type="button" className={cx('item-row', selected && 'item-row--selected')} onClick={onClick}>
      <ItemIcon icon={it.icon} className="item-row__icon" />
      <span className="item-row__main">
        <span className="item-row__name">
          {it.name}
          {count !== undefined && count > 1 && <span className="dim"> ×{count}</span>} {badge && <span className="badge">{badge}</span>}
        </span>
        {sub && <span className="item-row__sub" style={{ display: 'block' }}>{sub}</span>}
      </span>
      {right && <span className="item-row__right">{right}</span>}
    </button>
  );
}
