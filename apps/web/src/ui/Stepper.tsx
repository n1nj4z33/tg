interface StepperProps {
  value: number;
  onDec: () => void;
  onInc: () => void;
  canDec: boolean;
  canInc: boolean;
}

export function Stepper({ value, onDec, onInc, canDec, canInc }: StepperProps) {
  return (
    <span className="stepper">
      <button type="button" className="stepper__btn" onClick={onDec} disabled={!canDec} aria-label="Меньше">
        −
      </button>
      <span className="stepper__value">{String(value).padStart(2, '0')}</span>
      <button type="button" className="stepper__btn" onClick={onInc} disabled={!canInc} aria-label="Больше">
        +
      </button>
    </span>
  );
}
