import { BODY_PARTS, type BodyPart, type CreatureLook, type DeathKind } from '@radclub/engine';
import { useId, type ReactNode } from 'react';
import { cx } from '../ui/cx.ts';
import { shade } from './color.ts';
import { Gore, HitSplat, Wound, type GoreKind } from './Gore.tsx';
import './creature.css';

/** Координатная система любого существа: 240×300, пол на y=296. */
export const VIEW_W = 240;
export const VIEW_H = 300;
export const FLOOR_Y = 296;

export interface CreatureHit {
  part: BodyPart;
  key: number;
  hit: boolean;
  crit: boolean;
}

export interface CreatureDeath {
  kind: DeathKind;
  part: BodyPart;
}

interface CreatureProps {
  look: CreatureLook;
  variant?: 'color' | 'vats';
  crippled?: readonly BodyPart[];
  hit?: CreatureHit | null;
  death?: CreatureDeath | null;
  selected?: readonly BodyPart[];
  onPart?: (part: BodyPart) => void;
  /** Обрезать пустое поле вокруг фигуры (для мелких превью). */
  crop?: boolean;
  className?: string;
}

interface Paint {
  skin: string;
  skinShade: string;
  cloth: string;
  clothShade: string;
  accent: string;
  hair: string;
  eye: string;
  line: string;
  lineW: number;
  metal: string;
  vats: boolean;
}

type Pt = { x: number; y: number };

// ── Геометрия ──

const bulkX = (look: CreatureLook) => {
  const b = look.bulk ?? 1;
  return (x: number) => 120 + (x - 120) * b;
};

const mirror = (x: number) => VIEW_W - x;

function humanAnchors(look: CreatureLook): Record<BodyPart, Pt> {
  const X = bulkX(look);
  return {
    head: { x: 120, y: 30 },
    eyes: { x: 120, y: 44 },
    torso: { x: 120, y: 120 },
    groin: { x: 120, y: 186 },
    rightArm: { x: X(70), y: 150 },
    leftArm: { x: mirror(X(70)), y: 150 },
    rightLeg: { x: X(104), y: 250 },
    leftLeg: { x: mirror(X(104)), y: 250 },
  };
}

function beastAnchors(look: CreatureLook): Record<BodyPart, Pt> {
  const X = bulkX(look);
  return {
    head: { x: 54, y: 172 },
    eyes: { x: 44, y: 164 },
    torso: { x: X(135), y: 196 },
    groin: { x: X(140), y: 226 },
    rightArm: { x: X(92), y: 256 },
    leftArm: { x: X(108), y: 254 },
    rightLeg: { x: X(178), y: 256 },
    leftLeg: { x: X(194), y: 254 },
  };
}

/** Точки частей тела с учётом масштаба — для оверлеев (ошмётки, подписи прицела). */
export function creatureAnchors(look: CreatureLook): Record<BodyPart, Pt> {
  const raw = look.body === 'beast' ? beastAnchors(look) : humanAnchors(look);
  const s = look.scale ?? 1;
  const out = {} as Record<BodyPart, Pt>;
  for (const part of BODY_PARTS) out[part] = { x: 120 + (raw[part].x - 120) * s, y: FLOOR_Y + (raw[part].y - FLOOR_Y) * s };
  return out;
}

// ── Примитивы ──

function Limb({ d, width, color, p }: { d: string; width: number; color: string; p: Paint }) {
  return (
    <>
      <path d={d} stroke={p.line} strokeWidth={width + p.lineW * 2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

const stroke = (p: Paint) => ({ stroke: p.line, strokeWidth: p.lineW, strokeLinejoin: 'round' as const });

// ── Гуманоид ──

function humanHead(look: CreatureLook, p: Paint): ReactNode {
  const kind = look.head ?? 'normal';
  const extras = look.extras ?? [];
  const gear = look.headgear ?? 'none';
  let head: ReactNode;
  switch (kind) {
    case 'alien':
      head = <path d="M120 8 C154 8 160 38 148 56 C138 72 128 80 120 80 C112 80 102 72 92 56 C80 38 86 8 120 8Z" fill={p.skin} {...stroke(p)} />;
      break;
    case 'mutant':
      head = (
        <>
          <path d="M94 32 Q96 12 120 12 Q144 12 146 32 L148 58 Q142 78 120 78 Q98 78 92 58 Z" fill={p.skin} {...stroke(p)} />
          <path d="M96 36 Q120 26 144 36" stroke={p.skinShade} strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M106 66 L110 58 L114 66 M126 66 L130 58 L134 66" fill={p.vats ? 'none' : '#efe6c8'} stroke={p.line} strokeWidth={1} />
        </>
      );
      break;
    case 'robot':
      head = (
        <>
          <rect x={98} y={16} width={44} height={52} rx={7} fill={p.metal} {...stroke(p)} />
          <path d="M104 56 H136 M104 61 H136" stroke={p.line} strokeWidth={1.4} />
          <circle cx={101} cy={22} r={1.8} fill={p.line} />
          <circle cx={139} cy={22} r={1.8} fill={p.line} />
        </>
      );
      break;
    case 'skull':
      head = (
        <>
          <ellipse cx={120} cy={44} rx={20} ry={25} fill={p.skin} {...stroke(p)} />
          <path d="M104 50 Q100 30 112 22 M136 52 Q142 38 132 24" stroke={p.skinShade} strokeWidth={4} fill="none" />
          <path d="M118 50 L120 55 L122 50" fill={p.line} />
          <path d="M110 61 H130 M113 58 V64 M117 58 V64 M121 58 V64 M125 58 V64" stroke={p.line} strokeWidth={1.2} />
        </>
      );
      break;
    default:
      head = (
        <>
          <ellipse cx={99} cy={46} rx={4} ry={6} fill={p.skin} {...stroke(p)} />
          <ellipse cx={141} cy={46} rx={4} ry={6} fill={p.skin} {...stroke(p)} />
          <ellipse cx={120} cy={44} rx={21} ry={25} fill={p.skin} {...stroke(p)} />
          <path d="M118 46 L116 54 L121 54" stroke={p.skinShade} strokeWidth={1.4} fill="none" />
          <path d="M113 61 Q120 64 127 61" stroke={p.line} strokeWidth={1.4} fill="none" />
          {kind === 'normal' && gear === 'none' && (
            <path d="M99 40 Q98 16 120 16 Q142 16 141 40 Q134 28 120 28 Q106 28 99 40Z" fill={p.hair} {...stroke(p)} />
          )}
        </>
      );
  }
  let gearNode: ReactNode = null;
  if (gear === 'helmet') {
    gearNode = <path d="M94 38 Q94 10 120 10 Q146 10 146 38 L152 41 L88 41 Z" fill={p.vats ? p.cloth : '#4f5d3c'} {...stroke(p)} />;
  } else if (gear === 'sphere') {
    gearNode = (
      <>
        <path d="M95 46 Q94 12 120 12 Q146 12 145 46 L145 54 L95 54 Z" fill={p.vats ? p.cloth : '#2c332e'} {...stroke(p)} />
        <path d="M100 52 L140 52" stroke={p.line} strokeWidth={1} />
      </>
    );
  } else if (gear === 'power') {
    gearNode = (
      <>
        <path d="M92 50 Q90 8 120 8 Q150 8 148 50 L144 72 Q120 84 96 72 Z" fill={p.metal} {...stroke(p)} />
        <path d="M104 62 H136 M106 67 H134" stroke={p.line} strokeWidth={1.6} />
        <rect x={113} y={14} width={14} height={14} rx={2} fill={p.vats ? 'none' : p.accent} stroke={p.line} strokeWidth={1} />
      </>
    );
  } else if (gear === 'gasmask') {
    gearNode = (
      <>
        <path d="M100 34 Q120 26 140 34 L142 58 Q134 74 120 74 Q106 74 98 58 Z" fill={p.vats ? p.cloth : '#3b4534'} {...stroke(p)} />
        <ellipse cx={120} cy={74} rx={9} ry={8} fill={p.vats ? p.cloth : '#5b6b4a'} {...stroke(p)} />
        <path d="M113 74 H127 M113 78 H127" stroke={p.line} strokeWidth={1} />
      </>
    );
  }
  return (
    <>
      {extras.includes('horns') && (
        <path d="M104 26 Q86 18 84 -2 Q96 12 108 18 Z M136 26 Q154 18 156 -2 Q144 12 132 18 Z" fill={p.vats ? p.cloth : '#d8c9a6'} {...stroke(p)} />
      )}
      {extras.includes('antenna') && (
        <>
          <path d="M132 16 L142 -6" stroke={p.line} strokeWidth={2} />
          <circle cx={142} cy={-6} r={4} fill={p.eye} className="creature__blink" />
        </>
      )}
      {head}
      {gearNode}
    </>
  );
}

function humanEyes(look: CreatureLook, p: Paint): ReactNode {
  const kind = look.head ?? 'normal';
  const gear = look.headgear ?? 'none';
  const glow = (look.extras ?? []).includes('glow') ? 'creature__glow-eye' : undefined;
  if (gear === 'gasmask') {
    return (
      <>
        <circle cx={110} cy={44} r={7} fill={p.vats ? p.cloth : '#14171a'} {...stroke(p)} />
        <circle cx={130} cy={44} r={7} fill={p.vats ? p.cloth : '#14171a'} {...stroke(p)} />
        <circle cx={108} cy={42} r={2} fill={p.vats ? p.line : '#9fb6c4'} opacity={0.7} />
        <circle cx={128} cy={42} r={2} fill={p.vats ? p.line : '#9fb6c4'} opacity={0.7} />
      </>
    );
  }
  if (gear === 'sphere' || gear === 'power') {
    return <rect x={100} y={36} width={40} height={11} rx={4} fill={p.eye} className={glow ?? 'creature__visor'} {...stroke(p)} />;
  }
  if (kind === 'robot') {
    return <rect x={102} y={30} width={36} height={12} rx={3} fill={p.eye} className="creature__glow-eye" {...stroke(p)} />;
  }
  if (kind === 'alien') {
    return (
      <>
        <path d="M98 40 Q108 38 116 50 Q104 56 98 40Z" fill={p.eye} {...stroke(p)} />
        <path d="M142 40 Q132 38 124 50 Q136 56 142 40Z" fill={p.eye} {...stroke(p)} />
      </>
    );
  }
  const dark = !p.vats && !glow;
  return (
    <>
      {dark && <ellipse cx={111} cy={42} rx={4.5} ry={3} fill="#efe9dc" />}
      {dark && <ellipse cx={129} cy={42} rx={4.5} ry={3} fill="#efe9dc" />}
      <circle cx={111} cy={42} r={2.4} fill={p.eye} className={glow} />
      <circle cx={129} cy={42} r={2.4} fill={p.eye} className={glow} />
      <path d="M105 37 L117 38 M123 38 L135 37" stroke={p.line} strokeWidth={1.6} />
    </>
  );
}

function humanTorso(look: CreatureLook, p: Paint): ReactNode {
  const X = bulkX(look);
  const style = look.armor ?? 'cloth';
  const extras = look.extras ?? [];
  const d = `M${X(82)} 82 Q120 70 ${X(158)} 82 L${X(152)} 132 Q${X(148)} 158 ${X(146)} 172 L${X(94)} 172 Q${X(92)} 158 ${X(88)} 132 Z`;
  const details: ReactNode[] = [];
  if (style === 'cloth' || style === 'hazmat') {
    for (let y = 96; y < 168; y += 12) details.push(<path key={y} d={`M${X(92)} ${y} Q120 ${y + 3} ${X(148)} ${y}`} stroke={p.clothShade} strokeWidth={1.4} fill="none" />);
  }
  if (style === 'jacket') {
    details.push(
      <path key="z" d="M120 76 V170" stroke={p.accent} strokeWidth={2} />,
      <path key="l" d={`M110 76 L${X(96)} 110 L118 120 Z M130 76 L${X(144)} 110 L122 120 Z`} fill={p.clothShade} stroke={p.line} strokeWidth={1} />,
    );
  }
  if (style === 'hazmat') {
    details.push(<path key="s" d={`M${X(90)} 88 L${X(150)} 160 M${X(150)} 88 L${X(90)} 160`} stroke={p.accent} strokeWidth={4} />);
  }
  if (style === 'plate' || style === 'power') {
    details.push(
      <rect key="p1" x={X(96)} y={88} width={X(144) - X(96)} height={36} rx={4} fill={p.metal} stroke={p.line} strokeWidth={1.4} />,
      <rect key="p2" x={X(100)} y={128} width={X(140) - X(100)} height={38} rx={4} fill={p.metal} stroke={p.line} strokeWidth={1.4} />,
      ...[X(100), X(140)].flatMap((x) => [92, 120, 132, 162].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill={p.line} />)),
    );
  }
  if (style === 'vest') {
    details.push(
      <rect key="v" x={X(94)} y={86} width={X(146) - X(94)} height={74} rx={6} fill={p.cloth} stroke={p.line} strokeWidth={1.6} />,
      ...[X(98), X(112), X(126)].map((x) => <rect key={x} x={x} y={134} width={12} height={16} rx={2} fill={p.accent} stroke={p.line} strokeWidth={1} />),
    );
  }
  if (style === 'power') {
    details.push(
      <circle key="sl" cx={X(82)} cy={88} r={16} fill={p.metal} stroke={p.line} strokeWidth={2} />,
      <circle key="sr" cx={X(158)} cy={88} r={16} fill={p.metal} stroke={p.line} strokeWidth={2} />,
    );
  }
  if (extras.includes('spikes')) {
    details.push(<path key="sp" d={`M${X(86)} 80 L${X(80)} 62 L${X(96)} 76 M${X(154)} 80 L${X(160)} 62 L${X(144)} 76`} fill={p.skinShade} stroke={p.line} strokeWidth={1.4} />);
  }
  if (extras.includes('crystals')) {
    details.push(
      <path key="cr" d={`M${X(90)} 84 L${X(84)} 58 L${X(98)} 80 Z M${X(150)} 84 L${X(160)} 54 L${X(156)} 86 Z M${X(140)} 120 L${X(152)} 104 L${X(146)} 126 Z`} fill={p.vats ? p.cloth : '#9ff4ff'} stroke={p.line} strokeWidth={1.2} className="creature__glow-crystal" />,
    );
  }
  return (
    <>
      <rect x={111} y={62} width={18} height={22} fill={p.skin} {...stroke(p)} />
      <path d={d} fill={p.cloth} {...stroke(p)} />
      {details}
    </>
  );
}

function humanGroin(look: CreatureLook, p: Paint): ReactNode {
  const X = bulkX(look);
  return (
    <>
      <path d={`M${X(94)} 168 L${X(146)} 168 L${X(150)} 204 L${X(90)} 204 Z`} fill={p.clothShade} {...stroke(p)} />
      <rect x={X(93)} y={166} width={X(147) - X(93)} height={8} fill={p.accent} stroke={p.line} strokeWidth={1.2} />
      <rect x={115} y={165} width={10} height={10} fill={p.vats ? 'none' : '#a89060'} stroke={p.line} strokeWidth={1} />
    </>
  );
}

function humanArm(look: CreatureLook, p: Paint, side: 'right' | 'left'): ReactNode {
  const X = bulkX(look);
  const m = side === 'right' ? (x: number) => x : mirror;
  const power = look.armor === 'power';
  const w = (power ? 26 : 19) * Math.sqrt(look.bulk ?? 1);
  const sh = { x: m(X(86)), y: 90 };
  const el = { x: m(X(72)), y: 142 };
  const ha = { x: m(X(66)), y: 192 };
  const sleeve = look.armor === 'vest' ? p.accent : p.cloth;
  const extras = look.extras ?? [];
  return (
    <>
      <Limb d={`M${sh.x} ${sh.y} L${el.x} ${el.y} L${ha.x} ${ha.y - 6}`} width={w} color={sleeve} p={p} />
      {power && <rect x={el.x - 14} y={el.y - 4} width={28} height={30} rx={5} fill={p.metal} stroke={p.line} strokeWidth={1.6} />}
      <circle cx={ha.x} cy={ha.y} r={power ? 11 : 8.5} fill={power ? p.metal : p.skin} {...stroke(p)} />
      {extras.includes('claws') && (
        <path d={`M${ha.x - 5} ${ha.y + 6} l-3 14 M${ha.x} ${ha.y + 8} l0 15 M${ha.x + 5} ${ha.y + 6} l3 14`} stroke={p.vats ? p.line : '#e8dcc0'} strokeWidth={2.2} strokeLinecap="round" />
      )}
    </>
  );
}

function humanLeg(look: CreatureLook, p: Paint, side: 'right' | 'left'): ReactNode {
  const X = bulkX(look);
  const m = side === 'right' ? (x: number) => x : mirror;
  const w = (look.armor === 'power' ? 28 : 23) * Math.sqrt(look.bulk ?? 1);
  const hip = { x: m(X(108)), y: 200 };
  const knee = { x: m(X(104)), y: 248 };
  const foot = { x: m(X(102)), y: 282 };
  const toe = side === 'right' ? -1 : 1;
  return (
    <>
      <Limb d={`M${hip.x} ${hip.y} L${knee.x} ${knee.y} L${foot.x} ${foot.y}`} width={w} color={p.clothShade} p={p} />
      <path
        d={`M${foot.x - 11} ${foot.y - 4} L${foot.x + 11} ${foot.y - 4} L${foot.x + 12 + toe * 6} ${FLOOR_Y} L${foot.x - 12 + toe * 6} ${FLOOR_Y} Z`}
        fill={p.vats ? p.clothShade : '#1d1915'}
        {...stroke(p)}
      />
    </>
  );
}

function humanTail(look: CreatureLook, p: Paint): ReactNode {
  if (!(look.extras ?? []).includes('tail')) return null;
  return <Limb d="M130 196 Q190 220 196 270 Q200 292 220 288" width={10} color={p.skinShade} p={p} />;
}

// ── Зверь ──

function beastPart(part: BodyPart, look: CreatureLook, p: Paint): ReactNode {
  const X = bulkX(look);
  const extras = look.extras ?? [];
  const far = (c: string) => (p.vats ? c : shade(c, -0.3));
  const leg = (x1: number, x2: number, color: string) => (
    <>
      <Limb d={`M${X(x1)} 210 L${X(x2) - 4} 246 L${X(x2)} 284`} width={16 * (look.bulk ?? 1)} color={color} p={p} />
      <ellipse cx={X(x2) - 3} cy={290} rx={10} ry={5} fill={p.vats ? color : '#1d1915'} {...stroke(p)} />
    </>
  );
  switch (part) {
    case 'leftArm':
      return leg(108, 110, far(p.skin));
    case 'leftLeg':
      return leg(192, 198, far(p.skin));
    case 'rightArm':
      return leg(92, 88, p.skin);
    case 'rightLeg':
      return leg(176, 182, p.skin);
    case 'torso':
      return (
        <>
          <ellipse cx={X(138)} cy={196} rx={78 * (look.bulk ?? 1)} ry={40} fill={p.skin} {...stroke(p)} />
          <path d={`M${X(80)} 186 Q${X(140)} 172 ${X(200)} 186`} stroke={p.skinShade} strokeWidth={3} fill="none" />
          {extras.includes('mane') && (
            <path d={`M${X(76)} 166 l8 -16 l6 14 l8 -18 l6 16 l8 -16 l6 16 l8 -12 l4 14`} fill={p.skinShade} stroke={p.line} strokeWidth={1.4} />
          )}
          {extras.includes('spikes') && (
            <path d={`M${X(110)} 160 l8 -22 l8 20 M${X(140)} 158 l9 -24 l9 22 M${X(172)} 162 l8 -20 l7 20`} fill={p.skinShade} stroke={p.line} strokeWidth={1.4} />
          )}
          {extras.includes('crystals') && (
            <path d={`M${X(120)} 162 l6 -26 l8 24 Z M${X(160)} 164 l10 -30 l6 30 Z`} fill={p.vats ? p.cloth : '#ffe08a'} stroke={p.line} strokeWidth={1.2} className="creature__glow-crystal" />
          )}
        </>
      );
    case 'groin':
      return (
        <>
          {extras.includes('tail') && <Limb d={`M${X(212)} 196 Q${X(246)} 180 ${X(250)} 150`} width={8} color={p.skinShade} p={p} />}
          <ellipse cx={X(140)} cy={224} rx={42 * (look.bulk ?? 1)} ry={12} fill={p.skinShade} {...stroke(p)} />
        </>
      );
    case 'head':
      return (
        <>
          {extras.includes('horns') && (
            <path d="M58 150 Q50 120 30 112 M58 150 Q70 120 66 100 M44 118 L36 124 M64 116 L74 112" stroke={p.vats ? p.line : '#d8c9a6'} strokeWidth={5} fill="none" strokeLinecap="round" />
          )}
          <path d="M84 184 Q78 150 52 150 Q30 150 18 170 Q10 184 26 192 Q50 202 84 196 Z" fill={p.skin} {...stroke(p)} />
          <path d="M18 176 L30 180 L22 186" fill={p.vats ? 'none' : '#efe6c8'} stroke={p.line} strokeWidth={1} />
          <circle cx={16} cy={174} r={2.4} fill={p.line} />
          <path d="M58 152 L66 136 L70 156" fill={p.skinShade} stroke={p.line} strokeWidth={1.4} />
        </>
      );
    case 'eyes':
      return <circle cx={44} cy={164} r={4} fill={p.eye} className={(extras.includes('glow') || p.vats) ? 'creature__glow-eye' : undefined} {...stroke(p)} />;
  }
}

const HUMAN_ORDER: BodyPart[] = ['rightLeg', 'leftLeg', 'groin', 'torso', 'rightArm', 'leftArm', 'head', 'eyes'];
const BEAST_ORDER: BodyPart[] = ['leftArm', 'leftLeg', 'groin', 'torso', 'rightLeg', 'rightArm', 'head', 'eyes'];

function renderPart(part: BodyPart, look: CreatureLook, p: Paint): ReactNode {
  if (look.body === 'beast') return beastPart(part, look, p);
  switch (part) {
    case 'head':
      return humanHead(look, p);
    case 'eyes':
      return humanEyes(look, p);
    case 'torso':
      return humanTorso(look, p);
    case 'groin':
      return humanGroin(look, p);
    case 'rightArm':
      return humanArm(look, p, 'right');
    case 'leftArm':
      return humanArm(look, p, 'left');
    case 'rightLeg':
      return humanLeg(look, p, 'right');
    case 'leftLeg':
      return humanLeg(look, p, 'left');
  }
}

const GORE_FOR: Record<DeathKind, GoreKind | null> = {
  headExplode: 'head',
  limbOff: 'limb',
  torsoBurst: 'torso',
  ash: 'ash',
  goo: 'goo',
  collapse: 'splat',
};

/**
 * Существо из отдельных частей тела. Каждая часть — своя группа, поэтому
 * её можно подсветить в режиме прицеливания, залить кровью, оторвать или взорвать.
 */
function cropBox(look: CreatureLook): string {
  const s = look.scale ?? 1;
  if (look.body === 'beast') {
    const top = FLOOR_Y - (FLOOR_Y - 100) * s;
    const left = 120 - 120 * s - 10;
    return `${left} ${top} ${260 * s + 10} ${FLOOR_Y - top + 4}`;
  }
  const top = FLOOR_Y - FLOOR_Y * s - 4;
  return `${120 - 120 * s} ${top} ${VIEW_W * s} ${FLOOR_Y - top + 4}`;
}

export function Creature({ look, variant = 'color', crippled = [], hit, death, selected = [], onPart, crop, className }: CreatureProps) {
  const uid = useId().replace(/:/g, '');
  const vats = variant === 'vats';
  const gridId = `grid-${uid}`;
  const skin = look.skin;
  const cloth = look.cloth ?? shade(skin, -0.25);
  const p: Paint = vats
    ? {
        skin: `url(#${gridId})`,
        skinShade: 'rgba(77,255,124,0.18)',
        cloth: `url(#${gridId})`,
        clothShade: `url(#${gridId})`,
        accent: 'rgba(77,255,124,0.25)',
        hair: `url(#${gridId})`,
        eye: '#4dff7c',
        line: '#4dff7c',
        lineW: 1.4,
        metal: `url(#${gridId})`,
        vats: true,
      }
    : {
        skin,
        skinShade: shade(skin, -0.3),
        cloth,
        clothShade: shade(cloth, -0.3),
        accent: look.accent ?? shade(cloth, -0.5),
        hair: look.hair ?? '#2a1d14',
        eye: look.eyes ?? '#111111',
        line: '#0d0a08',
        lineW: 2,
        metal: look.head === 'robot' ? skin : shade(cloth, 0.12),
        vats: false,
      };

  const anchors = look.body === 'beast' ? beastAnchors(look) : humanAnchors(look);
  const order = look.body === 'beast' ? BEAST_ORDER : HUMAN_ORDER;
  const scale = look.scale ?? 1;
  const severed = death?.kind === 'limbOff' ? death.part : null;
  const headGone = death?.kind === 'headExplode';
  const goreKind = death ? GORE_FOR[death.kind] : null;
  const goreAt = death ? (death.kind === 'ash' || death.kind === 'goo' ? anchors.torso : anchors[death.part]) : null;
  const glow = !vats && (look.extras ?? []).includes('glow');

  const partNode = (part: BodyPart) => {
    const isHit = hit && hit.hit && hit.part === part;
    return (
      <g
        key={isHit ? `${part}-${hit.key}` : part}
        className={cx(
          'part',
          onPart && 'part--interactive',
          selected.includes(part) && 'part--selected',
          isHit && (hit.crit ? 'part--crit' : 'part--hit'),
          severed === part && 'part--severed',
        )}
        style={severed === part ? ({ '--dx': look.body === 'beast' ? -60 : part.startsWith('right') ? -70 : 70, '--up': -90, '--dy': FLOOR_Y - anchors[part].y - 6, '--r': 280 } as React.CSSProperties) : undefined}
        onClick={onPart ? () => onPart(part) : undefined}
      >
        {renderPart(part, look, p)}
        {!vats && crippled.includes(part) && <Wound x={anchors[part].x} y={anchors[part].y} seed={part.length * 31} />}
      </g>
    );
  };

  return (
    <svg
      viewBox={crop ? cropBox(look) : `0 0 ${VIEW_W} ${VIEW_H}`}
      className={cx('creature', vats && 'creature--vats', glow && 'creature--glow', className)}
      style={glow ? ({ '--glow': look.eyes ?? '#fff' } as React.CSSProperties) : undefined}
      overflow="visible"
    >
      <defs>
        <pattern id={gridId} width={7} height={7} patternUnits="userSpaceOnUse">
          <rect width={7} height={7} fill="rgba(10,40,18,0.55)" />
          <path d="M7 0 H0 V7" fill="none" stroke="#2fbf5a" strokeWidth={0.7} />
        </pattern>
      </defs>
      <g transform={`translate(120 ${FLOOR_Y}) scale(${scale}) translate(-120 ${-FLOOR_Y})`}>
        {!vats && <ellipse cx={look.body === 'beast' ? 130 : 120} cy={FLOOR_Y - 1} rx={look.body === 'beast' ? 90 : 46} ry={7} fill="rgba(0,0,0,0.45)" />}
        <g className={cx('creature__body', death && `creature__body--${look.body === 'beast' ? 'beast' : 'human'}-${death.kind}`)}>
          {look.body !== 'beast' && humanTail(look, p)}
          {order.filter((part) => part !== severed && !(headGone && (part === 'head' || part === 'eyes'))).map(partNode)}
          {headGone && look.body !== 'beast' && <ellipse cx={120} cy={66} rx={10} ry={5} fill="#7a0505" stroke="#2a0202" strokeWidth={1.5} />}
        </g>
        {severed && partNode(severed)}
        {hit && hit.hit && !death && <HitSplat key={hit.key} x={anchors[hit.part].x} y={anchors[hit.part].y} seed={hit.key} crit={hit.crit} />}
        {goreKind && goreAt && <Gore x={goreAt.x} y={goreAt.y} floor={FLOOR_Y} kind={goreKind} seed={7} />}
        {death?.kind === 'limbOff' && goreAt && <Gore x={goreAt.x} y={goreAt.y} floor={FLOOR_Y} kind="splat" seed={3} delay={150} />}
      </g>
    </svg>
  );
}
