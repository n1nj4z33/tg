import type { IconKey } from '@radclub/engine';
import type { ReactNode } from 'react';

const F = 'rgba(77,255,124,0.18)';

/** Иконки предметов в стиле фосфорного терминала: линия currentColor + полупрозрачная заливка. */
const ICONS: Record<IconKey, ReactNode> = {
  knife: <path d="M8 40 L30 18 L40 8 L38 20 L16 42 Z M14 34 l-6 -6 M10 38 l4 4" fill={F} />,
  pipe: <path d="M8 38 L36 10 M12 42 L40 14 M6 36 l6 6 M34 8 l6 6" />,
  hammer: (
    <>
      <path d="M10 42 L28 24" strokeWidth={4} />
      <rect x={24} y={6} width={20} height={14} rx={2} transform="rotate(45 34 13)" fill={F} />
    </>
  ),
  fist: <path d="M12 30 V18 a4 4 0 0 1 8 0 V16 a4 4 0 0 1 8 0 v1 a4 4 0 0 1 8 0 v12 c0 8 -6 12 -12 12 h-4 c-5 0 -8 -4 -8 -9 Z M12 24 h24" fill={F} />,
  pistol: <path d="M6 14 H42 V22 H24 L22 26 H18 L16 38 H8 L10 22 H6 Z M20 26 v-4" fill={F} />,
  shotgun: <path d="M2 18 H40 V24 H22 L10 34 L4 30 L14 22 H2 Z M2 21 H40" fill={F} />,
  rifle: <path d="M2 20 H34 L46 18 V22 L34 24 H26 L24 32 H20 L18 26 H12 L4 32 L2 26 Z M14 24 v10 h4" fill={F} />,
  sniper: (
    <>
      <path d="M2 24 H38 L46 22 V26 L38 28 H24 L18 34 L10 34 L14 28 H2 Z" fill={F} />
      <rect x={16} y={14} width={14} height={6} rx={2} fill={F} />
      <path d="M20 20 v4 M26 20 v4" />
    </>
  ),
  laser: (
    <>
      <path d="M6 16 H34 L40 20 L34 24 H22 L18 36 H10 L12 24 H6 Z" fill={F} />
      <path d="M40 20 H47" strokeDasharray="2 2" />
      <circle cx={26} cy={20} r={2} />
    </>
  ),
  plasma: (
    <>
      <path d="M2 18 H36 V26 H22 L18 36 H12 L14 26 H2 Z" fill={F} />
      <circle cx={28} cy={14} r={5} fill={F} />
      <path d="M36 22 h10" />
    </>
  ),
  blaster: <path d="M8 22 Q8 12 24 12 Q40 12 44 22 Q40 26 30 26 L26 38 H18 L20 26 Q8 28 8 22 Z M18 18 h12" fill={F} />,
  jacket: <path d="M16 6 L24 12 L32 6 L42 12 L38 24 L34 22 V42 H14 V22 L10 24 L6 12 Z M24 12 V42" fill={F} />,
  vest: (
    <>
      <path d="M14 6 H20 L24 12 L28 6 H34 L38 14 V42 H10 V14 Z" fill={F} />
      <rect x={14} y={28} width={8} height={8} />
      <rect x={26} y={28} width={8} height={8} />
    </>
  ),
  hazmat: (
    <>
      <path d="M16 8 H32 L40 16 V42 H8 V16 Z" fill={F} />
      <path d="M8 16 L40 40 M40 16 L8 40" />
    </>
  ),
  plate: (
    <>
      <path d="M12 8 H36 L40 14 V40 L24 44 L8 40 V14 Z" fill={F} />
      <path d="M12 20 H36 M12 30 H36" />
      <circle cx={14} cy={14} r={1} />
      <circle cx={34} cy={14} r={1} />
    </>
  ),
  power: (
    <>
      <path d="M14 4 H34 L36 14 H12 Z" fill={F} />
      <rect x={18} y={8} width={12} height={4} />
      <path d="M8 18 H40 L38 34 L30 44 H18 L10 34 Z" fill={F} />
      <circle cx={8} cy={20} r={5} />
      <circle cx={40} cy={20} r={5} />
    </>
  ),
  gasmask: (
    <>
      <path d="M10 18 Q24 6 38 18 L38 30 Q32 40 24 40 Q16 40 10 30 Z" fill={F} />
      <circle cx={18} cy={22} r={5} />
      <circle cx={30} cy={22} r={5} />
      <rect x={18} y={36} width={12} height={10} rx={3} fill={F} />
    </>
  ),
  helmet: <path d="M6 32 Q6 8 24 8 Q42 8 42 32 H46 V36 H2 V32 Z M14 20 Q24 14 34 20" fill={F} />,
  syringe: (
    <>
      <path d="M12 36 L32 16 L36 20 L16 40 Z" fill={F} />
      <path d="M8 40 L12 36 M34 14 L40 8 M38 6 L42 10 M18 30 l3 3 M22 26 l3 3" />
    </>
  ),
  pills: (
    <>
      <rect x={12} y={12} width={24} height={30} rx={4} fill={F} />
      <rect x={14} y={6} width={20} height={6} rx={2} />
      <path d="M18 24 L24 30 L30 24 M24 30 V36" />
    </>
  ),
  bottle: <path d="M20 4 H28 V14 Q36 18 36 26 V44 H12 V26 Q12 18 20 14 Z M12 30 H36" fill={F} />,
  can: (
    <>
      <ellipse cx={24} cy={12} rx={14} ry={4} fill={F} />
      <path d="M10 12 V38 Q24 44 38 38 V12" fill={F} />
      <path d="M12 22 H36 M12 30 H36" />
    </>
  ),
  water: <path d="M24 4 Q38 22 38 30 A14 14 0 0 1 10 30 Q10 22 24 4 Z M18 32 Q20 38 26 38" fill={F} />,
  ammo: (
    <>
      {[10, 20, 30].map((x) => (
        <path key={x} d={`M${x} 42 V20 Q${x + 4} 8 ${x + 8} 20 V42 Z M${x} 34 h8`} fill={F} />
      ))}
    </>
  ),
  cell: (
    <>
      <rect x={12} y={10} width={24} height={32} rx={3} fill={F} />
      <rect x={18} y={6} width={12} height={4} />
      <path d="M26 16 L20 26 H28 L22 36" />
    </>
  ),
  scrap: <path d="M6 30 L14 18 L22 24 L30 12 L42 20 L38 34 L26 40 L12 38 Z M14 26 l6 4 M28 22 l4 8" fill={F} />,
  chip: (
    <>
      <rect x={12} y={12} width={24} height={24} rx={2} fill={F} />
      <path d="M16 6 v6 M24 6 v6 M32 6 v6 M16 36 v6 M24 36 v6 M32 36 v6 M6 16 h6 M6 24 h6 M6 32 h6 M36 16 h6 M36 24 h6 M36 32 h6" />
    </>
  ),
  crystal: <path d="M24 4 L34 16 L30 42 H18 L14 16 Z M14 16 H34 M24 4 V42" fill={F} />,
  core: (
    <>
      <rect x={16} y={6} width={16} height={36} rx={3} fill={F} />
      <path d="M16 14 H32 M16 22 L32 26 M16 32 H32" />
    </>
  ),
  vial: (
    <>
      <path d="M18 4 H30 M20 4 V34 A4 4 0 0 0 28 34 V4" fill={F} />
      <path d="M20 22 H28" />
      <circle cx={24} cy={30} r={2} />
    </>
  ),
  card: (
    <>
      <path d="M8 10 H36 L42 16 V40 H8 Z" fill={F} />
      {[14, 20, 26, 32].map((y) => (
        <path key={y} d={`M14 ${y} h4 M24 ${y} h3 M32 ${y} h4`} />
      ))}
    </>
  ),
  tape: (
    <>
      <circle cx={24} cy={24} r={18} fill={F} />
      <circle cx={24} cy={24} r={7} />
      <circle cx={24} cy={24} r={2} />
    </>
  ),
  alien: <path d="M24 4 Q42 4 40 20 Q38 34 24 44 Q10 34 8 20 Q6 4 24 4 Z M14 20 Q20 18 22 26 Q16 28 14 20 Z M34 20 Q28 18 26 26 Q32 28 34 20 Z" fill={F} />,
};

export function ItemIcon({ icon, className }: { icon: IconKey; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" aria-hidden>
      {ICONS[icon]}
    </svg>
  );
}
