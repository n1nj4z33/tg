import type { ReactNode } from 'react';

/** Строка «Метка ....... значение» в духе терминала. */
export function Readout({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={`readout ${className ?? ''}`}>
      <span className="readout__label">{label}</span>
      <span className="readout__dots" />
      <span className="readout__value">{value}</span>
    </div>
  );
}
