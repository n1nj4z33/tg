import type { LocationId, Settlement } from '@radclub/engine';
import { cx } from '../ui/cx.ts';
import './worldmap.css';

interface WorldMapProps {
  settlements: Settlement[];
  current: LocationId;
  selected: LocationId | null;
  level: number;
  onSelect: (id: LocationId) => void;
}

/** Стилизованная карта мира на ЭЛТ-терминале: Америка слева, Евразия справа. */
export function WorldMap({ settlements, current, selected, level, onSelect }: WorldMapProps) {
  const here = settlements.find((s) => s.id === current);
  return (
    <svg viewBox="0 0 100 70" className="worldmap">
      <defs>
        <pattern id="wm-grid" width={5} height={5} patternUnits="userSpaceOnUse">
          <path d="M5 0 H0 V5" fill="none" stroke="rgba(77,255,124,0.08)" strokeWidth={0.2} />
        </pattern>
      </defs>
      <rect width={100} height={70} fill="url(#wm-grid)" />
      <g className="worldmap__land">
        <path d="M1 30 Q2 20 8 18 L16 16 Q19 22 15 28 L13 36 Q16 44 12 52 L14 62 L10 66 Q6 56 4 50 Q0 42 1 30Z" />
        <path d="M18 34 Q18 26 22 22 L30 14 Q38 8 50 8 Q66 6 80 10 Q94 12 99 20 L98 34 Q92 40 86 44 L80 52 Q74 50 70 54 L62 56 Q56 50 50 52 L42 50 Q36 46 30 46 L24 44 Q18 42 18 34Z" />
        <path d="M30 50 Q36 52 38 60 L34 68 Q28 62 30 50Z" />
      </g>
      <text x={4} y={8} className="worldmap__label">С.АМЕРИКА</text>
      <text x={60} y={66} className="worldmap__label">ЕВРАЗИЯ</text>
      {here &&
        settlements
          .filter((s) => s.id !== current)
          .map((s) => (
            <path
              key={s.id}
              d={`M${here.map.x} ${here.map.y} L${s.map.x} ${s.map.y}`}
              className={cx('worldmap__route', s.id === selected && 'worldmap__route--selected')}
            />
          ))}
      {settlements.map((s) => {
        const locked = level < s.minLevel;
        return (
          <g
            key={s.id}
            className={cx('worldmap__node', s.id === current && 'worldmap__node--here', s.id === selected && 'worldmap__node--selected', locked && 'worldmap__node--danger')}
            onClick={() => onSelect(s.id)}
          >
            <circle cx={s.map.x} cy={s.map.y} r={4} className="worldmap__hit" />
            <circle cx={s.map.x} cy={s.map.y} r={1.6} className="worldmap__dot" />
            {s.id === current && <circle cx={s.map.x} cy={s.map.y} r={3.2} className="worldmap__ring" />}
            <text x={s.map.x} y={s.map.y - 3} className="worldmap__name">
              {s.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
