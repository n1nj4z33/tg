import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { haptic } from '../telegram/telegram.ts';
import { cx } from './cx.ts';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'metal' | 'primary' | 'green' | 'danger' | 'ghost';
  size?: 'md' | 'sm';
  block?: boolean;
  /** Красная лампочка, как на кнопках терминала. */
  lamp?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'metal', size = 'md', block, lamp, className, onClick, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={cx('btn', `btn--${variant}`, size === 'sm' && 'btn--sm', block && 'btn--block', className)}
      onClick={(e) => {
        haptic.tap();
        onClick?.(e);
      }}
      {...rest}
    >
      {lamp && <span className="btn__lamp" />}
      {children}
    </button>
  );
}
