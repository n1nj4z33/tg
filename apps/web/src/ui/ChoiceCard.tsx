import type { ReactNode } from 'react';
import { cx } from './cx.ts';

/** Карточка выбора (перк, соперник, локация). */
export function ChoiceCard({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className={cx('choice-card', active && 'choice-card--active')} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
