import type { ReactNode } from 'react';
import { cx } from './cx.ts';

interface BarProps {
  label?: ReactNode;
  value: number;
  max: number;
  kind: 'hp' | 'ap' | 'xp' | 'rad' | 'weight' | 'over';
  /** Текст справа; по умолчанию «value/max». */
  text?: ReactNode;
  className?: string;
}

export function Bar({ label, value, max, kind, text, className }: BarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={cx('bar', `bar--${kind}`, className)}>
      {(label || text !== undefined) && (
        <div className="bar__head">
          <span>{label}</span>
          <span>{text ?? `${Math.round(value)}/${Math.round(max)}`}</span>
        </div>
      )}
      <div className="bar__track">
        <div className="bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
