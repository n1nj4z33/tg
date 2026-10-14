import type { SceneKey } from '@radclub/engine';
import { useId, type CSSProperties, type ReactNode } from 'react';
import { cx } from '../ui/cx.ts';
import { prng } from './color.ts';
import './scene.css';

const W = 400;
const H = 300;
const HORIZON = 210;

// ── Общие слои ──

function Sky({ id, top, bottom }: { id: string; top: string; bottom: string }) {
  return (
    <>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={top} />
        <stop offset="1" stopColor={bottom} />
      </linearGradient>
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />
    </>
  );
}

function Ground({ color, y = HORIZON, seed = 1, speckle = 'rgba(0,0,0,0.25)' }: { color: string; y?: number; seed?: number; speckle?: string }) {
  const r = prng(seed);
  return (
    <>
      <rect y={y} width={W} height={H - y} fill={color} />
      {Array.from({ length: 70 }, (_, i) => (
        <ellipse key={i} cx={r() * W} cy={y + 4 + r() * (H - y)} rx={1 + r() * 5} ry={0.6 + r() * 1.6} fill={speckle} />
      ))}
    </>
  );
}

function Stars({ count = 40, seed = 3, maxY = 140 }: { count?: number; seed?: number; maxY?: number }) {
  const r = prng(seed);
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} cx={r() * W} cy={r() * maxY} r={0.4 + r() * 0.9} fill="#fff" opacity={0.3 + r() * 0.6} className={i % 5 === 0 ? 'scene__twinkle' : undefined} />
      ))}
    </>
  );
}

/** Частицы: пыль, снег, пепел, искры — плавают по кругу бесконечно. */
function Particles({ kind, count = 24, seed = 5 }: { kind: 'dust' | 'snow' | 'ember' | 'spore' | 'drip'; count?: number; seed?: number }) {
  const r = prng(seed);
  const color = { dust: '#c9b48a', snow: '#ffffff', ember: '#ff7a2a', spore: '#9dff5a', drip: '#7fb0b0' }[kind];
  return (
    <g className={`scene__particles scene__particles--${kind}`}>
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx={r() * W}
          cy={r() * H}
          r={kind === 'snow' ? 0.8 + r() * 1.6 : 0.5 + r() * 1.2}
          fill={color}
          opacity={0.35 + r() * 0.5}
          style={{ animationDelay: `${-r() * 12}s`, animationDuration: `${8 + r() * 10}s` } as CSSProperties}
        />
      ))}
    </g>
  );
}

function Fog({ id, color, y = 170, opacity = 0.5 }: { id: string; color: string; y?: number; opacity?: number }) {
  return (
    <>
      <linearGradient id={`${id}-fog`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity={0} />
        <stop offset="0.6" stopColor={color} stopOpacity={opacity} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </linearGradient>
      <rect className="scene__fog" x={-40} y={y} width={W + 80} height={80} fill={`url(#${id}-fog)`} />
    </>
  );
}

function Glow({ id, x, y, r, color, className }: { id: string; x: number; y: number; r: number; color: string; className?: string }) {
  const gid = `${id}-glow-${x}-${y}`;
  return (
    <>
      <radialGradient id={gid}>
        <stop offset="0" stopColor={color} stopOpacity={0.8} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
      <circle cx={x} cy={y} r={r} fill={`url(#${gid})`} className={className} />
    </>
  );
}

/** Ряд деревьев-елей. */
function Pines({ y, count, color, seed, size = 1 }: { y: number; count: number; color: string; seed: number; size?: number }) {
  const r = prng(seed);
  return (
    <g fill={color}>
      {Array.from({ length: count }, (_, i) => {
        const x = (i / count) * W + r() * 20 - 10;
        const h = (30 + r() * 40) * size;
        return <path key={i} d={`M${x} ${y - h} L${x + h * 0.22} ${y} L${x - h * 0.22} ${y} Z`} />;
      })}
    </g>
  );
}

function DeadTrees({ y, count, color, seed }: { y: number; count: number; color: string; seed: number }) {
  const r = prng(seed);
  return (
    <g stroke={color} strokeLinecap="round" fill="none">
      {Array.from({ length: count }, (_, i) => {
        const x = 20 + r() * (W - 40);
        const h = 40 + r() * 50;
        return (
          <path
            key={i}
            strokeWidth={2 + r() * 2}
            d={`M${x} ${y} L${x + 2} ${y - h} M${x + 1} ${y - h * 0.6} l${-10 - r() * 8} ${-12 - r() * 8} M${x + 2} ${y - h * 0.75} l${8 + r() * 8} ${-10 - r() * 6}`}
          />
        );
      })}
    </g>
  );
}

/** Руины панельных домов. */
function Blocks({ y, color, window, seed, count = 6 }: { y: number; color: string; window: string; seed: number; count?: number }) {
  const r = prng(seed);
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const w = 40 + r() * 40;
        const x = (i / count) * W + r() * 20 - 20;
        const h = 50 + r() * 70;
        const broken = r() > 0.4;
        const top = broken ? `L${x + w} ${y - h + 18} L${x + w * 0.7} ${y - h + 8} L${x + w * 0.5} ${y - h + 22} L${x + w * 0.3} ${y - h}` : `L${x + w} ${y - h} L${x} ${y - h}`;
        const wins: ReactNode[] = [];
        for (let wy = y - h + 26; wy < y - 8; wy += 12) {
          for (let wx = x + 5; wx < x + w - 8; wx += 10) {
            if (r() > 0.55) wins.push(<rect key={`${wx}-${wy}`} x={wx} y={wy} width={5} height={6} fill={r() > 0.85 ? '#ffcf6a' : window} />);
          }
        }
        return (
          <g key={i}>
            <path d={`M${x} ${y} L${x + w} ${y} ${top} ${broken ? `L${x} ${y - h + 6}` : ''} Z`} fill={color} />
            {wins}
          </g>
        );
      })}
    </g>
  );
}

// ── Сцены ──

type SceneDef = { draw: (id: string) => ReactNode; tint: string };

const SCENES: Record<SceneKey, SceneDef> = {
  academ: {
    tint: '#ff9a4a',
    draw: (id) => (
      <>
        <Sky id={id} top="#3a1d14" bottom="#d9733a" />
        <circle cx={300} cy={150} r={34} fill="#ffcf8a" opacity={0.85} />
        <Blocks y={HORIZON} color="#2a1e18" window="#120c09" seed={11} count={7} />
        <path d="M0 196 Q100 186 200 196 T400 192 V210 H0Z" fill="#1d1712" />
        <Pines y={HORIZON + 4} count={9} color="#151a10" seed={4} size={0.7} />
        <Ground color="#4a3826" seed={2} />
        <Particles kind="dust" />
        <Fog id={id} color="#d9733a" opacity={0.35} />
      </>
    ),
  },
  sewer: {
    tint: '#5a8a6a',
    draw: (id) => (
      <>
        <rect width={W} height={H} fill="#16130f" />
        <pattern id={`${id}-brick`} width={36} height={18} patternUnits="userSpaceOnUse">
          <rect width={36} height={18} fill="#2b231b" />
          <path d="M0 17.5 H36 M18 0 V9 M0 9 H36 M2 9 V18" stroke="#120e0a" strokeWidth={1.4} />
        </pattern>
        <path d="M0 0 H400 V210 H0Z" fill={`url(#${id}-brick)`} />
        <path d="M120 210 Q120 70 200 70 Q280 70 280 210Z" fill="#070605" />
        <Glow id={id} x={200} y={120} r={80} color="#3b6a4a" />
        <rect x={0} y={40} width={W} height={16} fill="#4a4036" stroke="#000" />
        <rect x={0} y={64} width={W} height={10} fill="#5a3a24" stroke="#000" />
        <circle cx={60} cy={30} r={6} fill="#ffd27a" className="scene__flicker" />
        <Glow id={id} x={60} y={30} r={40} color="#ffd27a" className="scene__flicker" />
        <rect y={210} width={W} height={90} fill="#1f2a1e" />
        <path d="M0 230 Q100 222 200 232 T400 228" stroke="#3a5a3a" strokeWidth={2} fill="none" className="scene__ripple" />
        <Particles kind="drip" count={14} />
      </>
    ),
  },
  lab: {
    tint: '#7dff5a',
    draw: (id) => (
      <>
        <pattern id={`${id}-tile`} width={22} height={22} patternUnits="userSpaceOnUse">
          <rect width={22} height={22} fill="#a8b3a0" />
          <path d="M0 21.5 H22 M21.5 0 V22" stroke="#6b7566" strokeWidth={1} />
        </pattern>
        <rect width={W} height={HORIZON} fill={`url(#${id}-tile)`} />
        <rect width={W} height={HORIZON} fill="rgba(10,30,10,0.55)" />
        {[60, 160, 340].map((x, i) => (
          <g key={x}>
            <rect x={x - 22} y={70} width={44} height={140} rx={20} fill="rgba(125,255,90,0.25)" stroke="#2a332a" strokeWidth={4} />
            <rect x={x - 22} y={i === 1 ? 130 : 96} width={44} height={i === 1 ? 80 : 114} rx={18} fill="rgba(125,255,90,0.45)" />
            {i === 1 && <path d={`M${x - 20} 100 l10 14 l-6 8 l12 6`} stroke="#c5ffd0" strokeWidth={2} fill="none" />}
            <rect x={x - 26} y={60} width={52} height={12} fill="#2a332a" />
          </g>
        ))}
        <g transform="translate(250 60)">
          <circle r={18} fill="#ffcc00" stroke="#000" strokeWidth={2} />
          <path d="M0 -3 m-9 -6 a6 6 0 1 0 6 10 M0 -3 m9 -6 a6 6 0 1 1 -6 10 M-6 9 a6 6 0 1 0 12 0" stroke="#000" strokeWidth={2.4} fill="none" />
        </g>
        <rect x={0} y={0} width={W} height={10} fill="#2a332a" />
        <rect x={80} y={10} width={80} height={6} fill="#e6ffe0" className="scene__flicker" />
        <Ground color="#4e564a" y={HORIZON} seed={8} speckle="rgba(120,255,90,0.15)" />
        <Particles kind="spore" />
      </>
    ),
  },
  tundra: {
    tint: '#6affc8',
    draw: (id) => (
      <>
        <Sky id={id} top="#03101a" bottom="#123247" />
        <Stars />
        <path className="scene__aurora" d="M-20 70 Q80 20 160 70 T340 50 T460 70 V110 Q380 80 300 100 T140 100 T-20 110Z" fill="rgba(80,255,170,0.25)" />
        <path className="scene__aurora scene__aurora--2" d="M-20 50 Q100 90 200 40 T420 60 V80 Q300 100 200 70 T-20 80Z" fill="rgba(120,140,255,0.18)" />
        <path d="M0 180 Q60 150 130 170 T260 160 T400 170 V215 H0Z" fill="#c9d6e0" />
        <g fill="#2a3440">
          <rect x={250} y={120} width={16} height={60} />
          <path d="M246 120 L258 70 L270 120Z" />
          <rect x={270} y={150} width={60} height={30} />
        </g>
        <circle cx={262} cy={110} r={2} fill="#ff3b2f" className="scene__twinkle" />
        <Ground color="#dfe8ee" seed={9} speckle="rgba(80,110,140,0.25)" />
        <Particles kind="snow" count={40} />
      </>
    ),
  },
  drill: {
    tint: '#ff5a2a',
    draw: (id) => (
      <>
        <rect width={W} height={H} fill="#0d0706" />
        {Array.from({ length: 7 }, (_, i) => (
          <ellipse key={i} cx={200} cy={40 + i * 26} rx={210 - i * 20} ry={26 - i * 2} fill="none" stroke={`rgba(120,60,40,${0.15 + i * 0.08})`} strokeWidth={6} />
        ))}
        <Glow id={id} x={200} y={250} r={170} color="#ff3a0a" className="scene__pulse" />
        <path d="M150 0 Q160 120 190 230 M250 0 Q240 120 210 230" stroke="#2a2420" strokeWidth={4} fill="none" />
        <path d="M120 0 L160 210 M280 0 L240 210" stroke="#3a2a22" strokeWidth={2} />
        <Ground color="#2a1510" y={225} seed={6} speckle="rgba(255,90,40,0.18)" />
        <ellipse cx={200} cy={240} rx={60} ry={12} fill="#ff4a10" className="scene__pulse" opacity={0.7} />
        <Particles kind="ember" count={30} />
      </>
    ),
  },
  taiga: {
    tint: '#ff8a3a',
    draw: (id) => (
      <>
        <Sky id={id} top="#2a1408" bottom="#c4581e" />
        <path d="M0 150 Q100 130 200 150 T400 140 V210 H0Z" fill="#3a1e10" opacity={0.6} />
        <Pines y={185} count={16} color="#1d150d" seed={21} />
        <Pines y={HORIZON + 6} count={11} color="#0f0b07" seed={22} size={1.3} />
        <g fill="#5a3a24" stroke="#000">
          <path d="M300 210 L330 150 L360 210Z" />
          <path d="M330 150 L326 140 M330 150 L336 140" stroke="#5a3a24" strokeWidth={2} />
        </g>
        <Glow id={id} x={320} y={205} r={30} color="#ffb03a" className="scene__flicker" />
        <Ground color="#2b2216" seed={3} />
        <Particles kind="ember" count={18} />
        <Fog id={id} color="#c4581e" opacity={0.3} y={150} />
      </>
    ),
  },
  crater: {
    tint: '#ffe08a',
    draw: (id) => (
      <>
        <Sky id={id} top="#1a1430" bottom="#e89a5a" />
        <path d="M330 10 L230 120" stroke="#fff8d0" strokeWidth={3} className="scene__meteor" />
        <Glow id={id} x={230} y={120} r={30} color="#fff2a0" className="scene__meteor" />
        <g stroke="#3a2a1a" strokeWidth={3} strokeLinecap="round">
          {Array.from({ length: 22 }, (_, i) => {
            const a = (i / 22) * Math.PI;
            return <path key={i} d={`M${200 + Math.cos(a) * 60} ${205 - Math.sin(a) * 6} l${Math.cos(a) * 90} ${-Math.sin(a) * 10}`} />;
          })}
        </g>
        <DeadTrees y={HORIZON} count={7} color="#241a10" seed={5} />
        <Ground color="#3a3020" seed={13} />
        <ellipse cx={200} cy={250} rx={110} ry={20} fill="#9ff4ff" opacity={0.25} className="scene__pulse" />
        <Particles kind="spore" count={16} />
      </>
    ),
  },
  mountain: {
    tint: '#9ab0c8',
    draw: (id) => (
      <>
        <Sky id={id} top="#0e1420" bottom="#4a5a6e" />
        <Stars count={20} />
        <path d="M0 210 L60 130 L110 160 L190 60 L260 140 L310 110 L400 190 V210Z" fill="#232b33" />
        <path d="M190 60 L170 90 L182 86 L190 100 L200 84 L214 92Z" fill="#c9d6e0" />
        <path d="M150 210 Q150 170 190 170 Q230 170 230 210Z" fill="#0b0d10" stroke="#555" strokeWidth={3} />
        <path className="scene__searchlight" d="M120 210 L40 40 L90 30Z" fill="rgba(255,255,220,0.12)" />
        <path className="scene__searchlight scene__searchlight--2" d="M280 210 L360 40 L310 30Z" fill="rgba(255,255,220,0.1)" />
        <g stroke="#3a3a3a" strokeWidth={2}>
          {Array.from({ length: 20 }, (_, i) => (
            <path key={i} d={`M${i * 20} 200 V214`} />
          ))}
          <path d="M0 202 H400 M0 208 H400" strokeWidth={1} />
        </g>
        <Ground color="#3a3a30" seed={17} />
        <Particles kind="snow" count={14} />
      </>
    ),
  },
  bunker: {
    tint: '#ff3a2a',
    draw: (id) => (
      <>
        <rect width={W} height={H} fill="#2a2a26" />
        <pattern id={`${id}-conc`} width={80} height={50} patternUnits="userSpaceOnUse">
          <rect width={80} height={50} fill="#3a3a34" />
          <path d="M0 49 H80 M79 0 V50" stroke="#24241f" strokeWidth={2} />
        </pattern>
        <rect width={W} height={HORIZON} fill={`url(#${id}-conc)`} />
        <circle cx={200} cy={120} r={86} fill="#4a4a40" stroke="#1a1a16" strokeWidth={6} />
        <circle cx={200} cy={120} r={64} fill="#5d5d50" stroke="#2a2a24" strokeWidth={4} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <circle key={i} cx={200 + Math.cos(a) * 76} cy={120 + Math.sin(a) * 76} r={4} fill="#22221d" />;
        })}
        <path d="M150 120 H250 M200 70 V170" stroke="#2a2a24" strokeWidth={6} />
        <path d="M0 30 H400" stroke="#ffcc00" strokeWidth={10} strokeDasharray="20 20" />
        <Glow id={id} x={60} y={60} r={60} color="#ff2a1a" className="scene__alarm" />
        <Glow id={id} x={340} y={60} r={60} color="#ff2a1a" className="scene__alarm scene__alarm--2" />
        <Ground color="#33332c" seed={19} />
      </>
    ),
  },
  marsh: {
    tint: '#b8c890',
    draw: (id) => (
      <>
        <Sky id={id} top="#3a3e38" bottom="#9aa08a" />
        <g fill="#2e322c">
          <rect x={250} y={130} width={90} height={60} />
          <path d="M240 140 Q295 80 350 140Z" />
          <rect x={300} y={90} width={10} height={50} />
          <path d="M296 90 h18 v4 h-18z M296 100 h18 v3 h-18z" fill="#5a5e56" />
        </g>
        <DeadTrees y={HORIZON} count={10} color="#1e201c" seed={31} />
        <Ground color="#3a4030" seed={23} />
        <path d="M0 240 Q80 230 160 244 T320 236 T400 242 V270 Q300 262 200 270 T0 262Z" fill="#4a6a50" opacity={0.6} className="scene__ripple" />
        <Fog id={id} color="#c9d0b8" opacity={0.45} />
        <Particles kind="dust" count={16} />
      </>
    ),
  },
  radar: {
    tint: '#9ff4ff',
    draw: (id) => (
      <>
        <Sky id={id} top="#1a2028" bottom="#6a7480" />
        <g stroke="#1b2026" strokeWidth={1.2}>
          {Array.from({ length: 34 }, (_, i) => (
            <path key={`v${i}`} d={`M${10 + i * 11.5} 50 V${HORIZON}`} strokeWidth={i % 4 === 0 ? 3 : 1.2} />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <path key={`h${i}`} d={`M10 ${50 + i * 16} H392`} />
          ))}
          {Array.from({ length: 17 }, (_, i) => (
            <path key={`d${i}`} d={`M${10 + i * 23} 50 L${33 + i * 23} ${HORIZON}`} strokeWidth={0.8} />
          ))}
        </g>
        <circle cx={60} cy={50} r={2.5} fill="#ff3b2f" className="scene__twinkle" />
        <circle cx={340} cy={50} r={2.5} fill="#ff3b2f" className="scene__twinkle" />
        <Pines y={HORIZON + 4} count={14} color="#141810" seed={41} size={0.6} />
        <Ground color="#2e3428" seed={29} />
        <Fog id={id} color="#9aa4b0" opacity={0.4} y={160} />
      </>
    ),
  },
  metro: {
    tint: '#ffd27a',
    draw: (id) => (
      <>
        <rect width={W} height={H} fill="#1a1612" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${i * 110 - 20} 0)`}>
            <path d="M10 210 V90 Q60 40 110 90 V210" fill="#0d0b09" stroke="#5a4e3e" strokeWidth={6} />
            <rect x={-6} y={60} width={16} height={150} fill="#7a6a54" />
            <rect x={-10} y={56} width={24} height={8} fill="#a89070" />
          </g>
        ))}
        <path d="M0 40 H400" stroke="#a89070" strokeWidth={4} />
        <circle cx={200} cy={24} r={10} fill="#ffe0a0" className="scene__flicker" />
        <Glow id={id} x={200} y={24} r={70} color="#ffd27a" className="scene__flicker" />
        <rect x={150} y={52} width={100} height={18} fill="#1e3a7a" stroke="#ccc" strokeWidth={1} />
        <text x={200} y={66} fill="#fff" fontSize={12} textAnchor="middle" fontFamily="Oswald, sans-serif">
          РАМЕНКИ
        </text>
        <Ground color="#2a2520" seed={37} />
        <path d="M0 250 H400 M0 270 H400" stroke="#6a6a6a" strokeWidth={3} />
      </>
    ),
  },
  tunnel: {
    tint: '#ffcf6a',
    draw: (id) => (
      <>
        <rect width={W} height={H} fill="#0a0907" />
        {Array.from({ length: 6 }, (_, i) => {
          const s = 1 - i * 0.16;
          return <circle key={i} cx={200} cy={150} r={190 * s} fill="none" stroke={`rgba(90,80,64,${0.6 - i * 0.08})`} strokeWidth={14 * s} />;
        })}
        <circle cx={200} cy={150} r={22} fill="#000" />
        {Array.from({ length: 5 }, (_, i) => (
          <circle key={i} cx={200 - 150 * (1 - i * 0.2)} cy={150 - 60 * (1 - i * 0.2)} r={3 * (1 - i * 0.15)} fill="#ffcf6a" className="scene__flicker" />
        ))}
        <path d="M120 300 L194 160 M280 300 L206 160" stroke="#7a7a7a" strokeWidth={4} />
        <path d="M60 300 L190 160 M340 300 L210 160" stroke="#2a2520" strokeWidth={30} opacity={0.6} />
        <Fog id={id} color="#3a3020" opacity={0.4} y={200} />
      </>
    ),
  },
  desert: {
    tint: '#ff9ad0',
    draw: (id) => (
      <>
        <Sky id={id} top="#1d1238" bottom="#e07a5a" />
        <Stars count={30} maxY={100} />
        <g className="scene__ufo">
          <ellipse cx={90} cy={60} rx={18} ry={5} fill="#c9d6e0" />
          <ellipse cx={90} cy={56} rx={7} ry={5} fill="#9ff4ff" />
          <Glow id={id} x={90} y={64} r={20} color="#9ff4ff" />
        </g>
        <path d="M0 200 L30 170 H90 L110 200 M240 200 L260 160 H340 L370 200" fill="#5a2a2a" />
        <path d="M0 210 L30 170 H90 L120 210Z M230 210 L260 160 H340 L380 210Z" fill="#6a3426" />
        <g stroke="#2a3a1a" strokeWidth={4} strokeLinecap="round" fill="none">
          <path d="M180 210 V176 M180 186 l-10 -10 M180 192 l10 -12" />
          <path d="M380 220 V196 M380 204 l8 -8" />
        </g>
        <g transform="translate(300 214)">
          <rect x={-2} y={-36} width={4} height={36} fill="#555" />
          <rect x={-28} y={-48} width={56} height={18} fill="#c8a020" stroke="#000" />
          <text y={-35} fill="#000" fontSize={8} textAnchor="middle" fontFamily="Oswald, sans-serif">
            ET HWY 375
          </text>
        </g>
        <Ground color="#9a6a40" seed={43} speckle="rgba(60,30,10,0.25)" />
        <Particles kind="dust" />
      </>
    ),
  },
  hangar: {
    tint: '#9ff4ff',
    draw: (id) => (
      <>
        <Sky id={id} top="#05070d" bottom="#2a2e40" />
        <Stars count={30} />
        <path className="scene__searchlight" d="M60 210 L0 20 L50 14Z" fill="rgba(200,240,255,0.1)" />
        <path className="scene__searchlight scene__searchlight--2" d="M340 210 L400 20 L350 14Z" fill="rgba(200,240,255,0.1)" />
        <path d="M70 210 V140 Q200 80 330 140 V210Z" fill="#2a2e36" stroke="#000" strokeWidth={2} />
        <rect x={130} y={150} width={140} height={60} fill="#0c0e12" />
        <g className="scene__pulse">
          <ellipse cx={200} cy={190} rx={60} ry={12} fill="#7a8a96" stroke="#000" />
          <ellipse cx={200} cy={180} rx={24} ry={12} fill="#9ff4ff" opacity={0.7} />
          {[-40, -20, 0, 20, 40].map((dx) => (
            <circle key={dx} cx={200 + dx} cy={194} r={2.4} fill="#9ff4ff" />
          ))}
        </g>
        <text x={200} y={135} fill="#c8c8c8" fontSize={11} textAnchor="middle" fontFamily="Oswald, sans-serif">
          S-4
        </text>
        <Ground color="#3a3a3a" seed={47} />
        <path d="M0 250 H400" stroke="#d8d8a0" strokeWidth={3} strokeDasharray="24 18" />
      </>
    ),
  },
  wasteland: {
    tint: '#d8b080',
    draw: (id) => (
      <>
        <Sky id={id} top="#4a3a28" bottom="#c8a070" />
        <Blocks y={HORIZON} color="#3a2e22" window="#1a140e" seed={53} count={4} />
        <DeadTrees y={HORIZON} count={5} color="#2a2018" seed={51} />
        <Ground color="#6a5236" seed={49} />
        <Particles kind="dust" />
      </>
    ),
  },
  arena: {
    tint: '#ffcf6a',
    draw: (id) => (
      <>
        <rect width={W} height={H} fill="#100d0a" />
        <g fill="#1e1915">
          {Array.from({ length: 22 }, (_, i) => (
            <circle key={i} cx={i * 19 + 4} cy={150 + (i % 3) * 6} r={9} />
          ))}
          <rect y={156} width={W} height={60} />
        </g>
        <pattern id={`${id}-chain`} width={12} height={12} patternUnits="userSpaceOnUse">
          <path d="M0 6 L6 0 L12 6 L6 12Z" fill="none" stroke="#6a6a6a" strokeWidth={0.8} />
        </pattern>
        <rect y={60} width={W} height={150} fill={`url(#${id}-chain)`} opacity={0.6} />
        <path d="M0 60 H400" stroke="#555" strokeWidth={5} />
        {[40, 200, 360].map((x) => (
          <rect key={x} x={x - 3} y={60} width={6} height={150} fill="#444" />
        ))}
        <path d="M120 0 L60 300 H180Z" fill="rgba(255,240,200,0.07)" />
        <path d="M280 0 L220 300 H340Z" fill="rgba(255,240,200,0.07)" />
        <Ground color="#4a3a2a" seed={57} />
        <ellipse cx={200} cy={258} rx={150} ry={30} fill="rgba(110,10,10,0.25)" />
      </>
    ),
  },
};

export const sceneTint = (scene: SceneKey): string => SCENES[scene].tint;

/** Фон локации. Дети рендерятся поверх (боец, кнопки). */
export function Scene({ scene, className, children }: { scene: SceneKey; className?: string; children?: ReactNode }) {
  const id = useId().replace(/:/g, '');
  return (
    <div className={cx('scene', className)}>
      <svg className="scene__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden>
        {SCENES[scene].draw(id)}
      </svg>
      <div className="scene__vignette" />
      {children && <div className="scene__content">{children}</div>}
    </div>
  );
}
