'use client';

import Icon from '@/components/Icons';

export default function QuantityStepper({
  value,
  max,
  min = 1,
  onChange,
  label = 'Cantidad',
  size = 'md',
  disabled = false,
}: {
  value: number;
  max: number;
  min?: number;
  onChange: (value: number) => void;
  label?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}) {
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  return (
    <div className={`qty-stepper qty-${size} ${disabled ? 'is-disabled' : ''}`} role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={!canDecrease}
        aria-label={`Disminuir ${label.toLowerCase()}`}
      >
        <Icon name="minus" size={size === 'sm' ? 14 : 16} />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={!canIncrease}
        aria-label={`Aumentar ${label.toLowerCase()}`}
        title={!canIncrease && !disabled ? 'Máximo disponible' : undefined}
      >
        <Icon name="plus" size={size === 'sm' ? 14 : 16} />
      </button>
    </div>
  );
}
