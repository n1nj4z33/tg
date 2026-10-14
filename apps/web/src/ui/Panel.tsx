import type { ReactNode } from 'react';
import { cx } from './cx.ts';

interface PanelProps {
  title?: ReactNode;
  rust?: boolean;
  className?: string;
  children: ReactNode;
}

/** Металлическая панель с заклёпками — базовый контейнер интерфейса. */
export function Panel({ title, rust, className, children }: PanelProps) {
  return (
    <section className={cx('panel', rust && 'panel--rust', className)}>
      {title && <h2 className="panel__title">{title}</h2>}
      {children}
    </section>
  );
}
