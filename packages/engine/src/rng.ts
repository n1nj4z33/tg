import type { Rng } from './types.ts';

/** Детерминированный ГСЧ (mulberry32) — для тестов и воспроизводимых боёв. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randInt = (rng: Rng, min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));

/** Бросок процента: true с вероятностью chance/100. */
export const roll = (rng: Rng, chance: number): boolean => rng() * 100 < chance;

export function pick<T>(rng: Rng, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)];
}

export function weightedPick<T>(rng: Rng, entries: ReadonlyArray<readonly [T, number]>): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = rng() * total;
  for (const [value, weight] of entries) {
    r -= weight;
    if (r < 0) return value;
  }
  return entries[entries.length - 1][0];
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));
