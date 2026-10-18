'use client';

import { useRef } from 'react';
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
  // Dirección del cambio para animar el número hacia arriba o hacia abajo.
  const previous = useRef(value);
  const direction = value > previous.current ? 'up' : value < previous.current ? 'down' : 'none';
  previous.current = value;
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
      <output aria-live="polite">
        <span key={value} className={`qty-value qty-${direction}`}>
          {value}
        </span>
      </output>
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
