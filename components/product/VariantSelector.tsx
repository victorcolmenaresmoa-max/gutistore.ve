'use client';

import type { Product } from '@/types';
import {
  AXIS_LABELS,
  VariantAxis,
  VariantSelection,
  activeVariants,
  optionState,
  productAxes,
  productColors,
  productOptions,
  productSizes,
} from '@/lib/product';
import ColorSwatch from './ColorSwatch';

const STATE_HINT = {
  available: '',
  'unavailable-combination': 'No disponible en esta combinación',
  'sold-out': 'Agotado',
} as const;

export default function VariantSelector({
  product,
  selection,
  onSelect,
  showErrors = false,
}: {
  product: Product;
  selection: VariantSelection;
  onSelect: (axis: VariantAxis, value: string) => void;
  showErrors?: boolean;
}) {
  const axes = productAxes(product);
  if (!axes.length || !activeVariants(product).length) return null;

  const valuesFor = (axis: VariantAxis) => {
    if (axis === 'color') return productColors(product).map((color) => ({ value: color.nombre, hex: color.hex }));
    if (axis === 'talla') return productSizes(product).map((value) => ({ value, hex: undefined }));
    return productOptions(product).map((value) => ({ value, hex: undefined }));
  };

  return (
    <div className="variant-selector">
      {axes.map((axis) => {
        const label = axis === 'opcion' ? product.opcionVariante || 'Opción' : AXIS_LABELS[axis];
        const values = valuesFor(axis);
        const selected = selection[axis];
        const missing = showErrors && !selected;
        const groupId = `axis-${axis}`;

        return (
          <fieldset className={`variant-group ${missing ? 'has-error' : ''}`} key={axis} aria-describedby={missing ? `${groupId}-error` : undefined}>
            <legend>
              {label}
              {selected ? <span className="variant-selected">: {selected}</span> : <span className="variant-required"> · elige una opción</span>}
            </legend>

            <div className={`variant-options ${axis === 'color' ? 'is-colors' : 'is-chips'}`}>
              {values.map(({ value, hex }) => {
                const state = optionState(product, axis, value, selection);
                const isSelected = selected === value;
                const disabled = state !== 'available';
                const title = [value, STATE_HINT[state]].filter(Boolean).join(' · ');
                return (
                  <button
                    key={value}
                    type="button"
                    className={`variant-option ${axis === 'color' ? 'variant-color' : 'variant-chip'} state-${state} ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelect(axis, value)}
                    disabled={disabled}
                    aria-pressed={isSelected}
                    aria-label={title}
                    title={title}
                  >
                    {axis === 'color' ? (
                      <>
                        <ColorSwatch nombre={value} hex={hex} size="md" />
                        <span className="variant-color-name">{value}</span>
                      </>
                    ) : (
                      <span>{value}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {missing && (
              <p className="field-error" id={`${groupId}-error`}>
                Selecciona {label.toLowerCase()} para continuar.
              </p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
