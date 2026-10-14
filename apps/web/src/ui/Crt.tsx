import type { ReactNode } from 'react';
import { cx } from './cx.ts';

/** Зелёный ЭЛТ-экран терминала со строками развёртки. */
export function Crt({ amber, className, children }: { amber?: boolean; className?: string; children: ReactNode }) {
  return <div className={cx('crt', amber && 'crt--amber', className)}>{children}</div>;
}
