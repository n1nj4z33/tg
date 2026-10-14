/** Склейка классов: cx('a', cond && 'b') → 'a b'. */
export const cx = (...parts: Array<string | false | null | undefined>): string => parts.filter(Boolean).join(' ');
