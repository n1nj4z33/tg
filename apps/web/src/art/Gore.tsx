import type { CSSProperties, ReactNode } from 'react';
import { prng } from './color.ts';
import './gore.css';

export type GoreKind = 'head' | 'limb' | 'torso' | 'splat' | 'ash' | 'goo';

interface GoreProps {
  x: number;
  y: number;
  /** Y пола в тех же координатах — туда падают ошмётки. */
  floor: number;
  kind: GoreKind;
  seed?: number;
  /** Задержка старта, мс. */
  delay?: number;
}

const BLOOD = ['#8a0707', '#a10d0d', '#6b0404', '#c01616'];

type Shape = (r: () => number) => ReactNode;

const drop: Shape = (r) => <circle r={1.5 + r() * 3.5} fill={BLOOD[Math.floor(r() * BLOOD.length)]} />;
const mist: Shape = (r) => <circle r={0.8 + r() * 1.4} fill="#b31212" opacity={0.8} />;
const brain: Shape = (r) => {
  const s = 3 + r() * 4;
  return (
    <g>
      <path d={`M${-s} 0 q${s / 2} ${-s} ${s} 0 q${s / 2} ${-s} ${s} 0 q0 ${s} ${-s} ${s} q${-s} 0 ${-s} ${-s}z`} fill="#e59a9a" stroke="#9c4a52" strokeWidth={0.8} />
      <path d={`M${-s * 0.6} ${s * 0.1} q${s * 0.4} ${-s * 0.4} ${s * 0.8} 0`} stroke="#b0606a" strokeWidth={0.6} fill="none" />
    </g>
  );
};
const bone: Shape = (r) => {
  const s = 2 + r() * 3;
  return <path d={`M${-s} ${-s * 0.4} L${s} ${-s * 0.2} L${s * 0.6} ${s * 0.5} L${-s * 0.8} ${s * 0.3}z`} fill="#eee4cf" stroke="#9b8f78" strokeWidth={0.5} />;
};
const eyeball: Shape = () => (
  <g>
    <circle r={4.5} fill="#f4efe6" stroke="#a33" strokeWidth={0.6} />
    <circle cx={1.4} r={2} fill="#3f6e3a" />
    <circle cx={1.8} r={0.9} fill="#000" />
    <path d="M-4.5 0 q-4 1 -7 4" stroke="#a11" strokeWidth={1.2} fill="none" />
  </g>
);
const gut: Shape = (r) => {
  const s = 5 + r() * 6;
  return <path d={`M${-s} 0 q${s / 2} ${-s / 1.5} ${s} 0 t${s} 0`} stroke="#d88a8a" strokeWidth={3.2} strokeLinecap="round" fill="none" />;
};
const meat: Shape = (r) => {
  const s = 2.5 + r() * 4;
  return <ellipse rx={s} ry={s * 0.7} fill="#9e1c1c" stroke="#5a0808" strokeWidth={0.6} />;
};
const ash: Shape = (r) => <rect width={1.5 + r() * 3} height={1.5 + r() * 3} fill={r() > 0.5 ? '#3a3633' : '#5b5550'} />;
const goo: Shape = (r) => <circle r={2 + r() * 4} fill={r() > 0.5 ? '#7dff3a' : '#3cbf1c'} opacity={0.9} />;

const RECIPES: Record<GoreKind, Array<[Shape, number]>> = {
  head: [[drop, 26], [mist, 24], [brain, 9], [bone, 8], [eyeball, 2], [meat, 6]],
  limb: [[drop, 18], [mist, 14], [meat, 4], [bone, 2]],
  torso: [[drop, 26], [mist, 20], [gut, 7], [meat, 10], [bone, 4]],
  splat: [[drop, 8], [mist, 8]],
  ash: [[ash, 40]],
  goo: [[goo, 34]],
};

/** Разлёт ошмётков по баллистической дуге с приземлением на пол. */
export function Gore({ x, y, floor, kind, seed = 1, delay = 0 }: GoreProps) {
  const r = prng(seed * 977 + x * 13 + y);
  const power = kind === 'splat' ? 0.35 : kind === 'ash' ? 0.25 : 1;
  const particles: ReactNode[] = [];
  let i = 0;
  for (const [shape, count] of RECIPES[kind]) {
    for (let n = 0; n < count; n++, i++) {
      const angle = kind === 'ash' || kind === 'goo' ? Math.PI * (0.1 + r() * 0.8) : r() * Math.PI * 2;
      const speed = (30 + r() * 110) * power;
      const dx = Math.cos(angle) * speed * (kind === 'ash' ? 0.6 : 1.3);
      const up = -Math.abs(Math.sin(angle)) * speed * (kind === 'ash' ? 0.2 : 0.9) - 10 * power;
      const landed = floor - y - r() * 10;
      const style = {
        '--dx': dx.toFixed(1),
        '--up': up.toFixed(1),
        '--dy': (landed + r() * 6).toFixed(1),
        '--r': ((r() - 0.5) * 900).toFixed(0),
        animationDelay: `${delay + r() * 80}ms`,
        animationDuration: `${(kind === 'ash' ? 1300 : 800) + r() * 500}ms`,
      } as CSSProperties;
      particles.push(
        <g key={i} className="gore__p" style={style}>
          {shape(r)}
        </g>,
      );
    }
  }
  const poolColor = kind === 'goo' ? '#3cbf1c' : kind === 'ash' ? '#2e2a27' : '#6b0404';
  return (
    <g className="gore" transform={`translate(${x} ${y})`}>
      {kind !== 'splat' && (
        <ellipse
          className="gore__pool"
          cx={0}
          cy={floor - y + 2}
          rx={kind === 'ash' ? 38 : 52}
          ry={kind === 'ash' ? 9 : 7}
          fill={poolColor}
          style={{ animationDelay: `${delay + 350}ms` }}
        />
      )}
      {kind !== 'ash' && kind !== 'goo' && kind !== 'splat' && <circle className="gore__flash" r={22} fill="#ff2a1a" style={{ animationDelay: `${delay}ms` }} />}
      {particles}
    </g>
  );
}

/** Брызги при попадании (без смерти) — короткие и не остаются на полу надолго. */
export function HitSplat({ x, y, seed, crit }: { x: number; y: number; seed: number; crit?: boolean }) {
  const r = prng(seed);
  return (
    <g className="hit-splat" transform={`translate(${x} ${y})`}>
      <circle className="hit-splat__ring" r={crit ? 18 : 11} fill="none" stroke={crit ? '#ffdd33' : '#ff3b2f'} strokeWidth={2} />
      {Array.from({ length: crit ? 16 : 9 }, (_, i) => {
        const a = r() * Math.PI * 2;
        const d = 10 + r() * (crit ? 34 : 22);
        return (
          <circle
            key={i}
            className="hit-splat__drop"
            r={1 + r() * 2.4}
            fill={BLOOD[i % BLOOD.length]}
            style={{ '--tx': `${Math.cos(a) * d}px`, '--ty': `${Math.sin(a) * d + 6}px` } as CSSProperties}
          />
        );
      })}
    </g>
  );
}

/** Пятна крови на покалеченной части тела. */
export function Wound({ x, y, seed }: { x: number; y: number; seed: number }) {
  const r = prng(seed);
  return (
    <g transform={`translate(${x} ${y})`} opacity={0.9}>
      {Array.from({ length: 5 }, (_, i) => (
        <ellipse key={i} cx={(r() - 0.5) * 12} cy={(r() - 0.3) * 12} rx={2 + r() * 4} ry={1.5 + r() * 3} fill={BLOOD[i % 3]} />
      ))}
      <path d={`M0 0 q${r() * 3} 8 ${r() * 2} 16`} stroke="#7a0505" strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  );
}
