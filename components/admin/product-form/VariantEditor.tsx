'use client';

import { useState } from 'react';
import Icon from '@/components/Icons';
import ColorSwatch from '@/components/product/ColorSwatch';
import { resolveColorHex, sanitizeHex } from '@/lib/colors';
import { splitTags } from '@/lib/text';
import { VariantDraft, emptyVariant, newId } from './types';

interface Props {
  variants: VariantDraft[];
  optionLabel: string;
  basePrice: string;
  onChange: (variants: VariantDraft[]) => void;
  onOptionLabelChange: (value: string) => void;
  error?: string;
  optionLabelError?: string;
}

/**
 * Editor de variantes: una fila por combinación (Color | Talla | Opción | SKU |
 * Precio | Stock | Imagen). Incluye un generador de combinaciones para crear,
 * por ejemplo, 3 colores × 5 tallas de una vez.
 */
export default function VariantEditor({
  variants,
  optionLabel,
  basePrice,
  onChange,
  onOptionLabelChange,
  error,
  optionLabelError,
}: Props) {
  const [generatorOpen, setGeneratorOpen] = useState(variants.length === 0);
  const [colors, setColors] = useState('');
  const [sizes, setSizes] = useState('');
  const [options, setOptions] = useState('');
  const [initialStock, setInitialStock] = useState('0');

  const update = (id: string, patch: Partial<VariantDraft>) =>
    onChange(variants.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)));
  const remove = (id: string) => onChange(variants.filter((variant) => variant.id !== id));
  const duplicate = (variant: VariantDraft) => {
    const index = variants.findIndex((item) => item.id === variant.id);
    const next = [...variants];
    next.splice(index + 1, 0, { ...variant, id: newId(), sku: '' });
    onChange(next);
  };

  const generate = () => {
    const colorList = splitTags(colors);
    const sizeList = splitTags(sizes);
    const optionList = splitTags(options);
    if (!colorList.length && !sizeList.length && !optionList.length) return;

    const axis = <T,>(list: T[]) => (list.length ? list : [null]);
    const existing = new Set(variants.map((v) => [v.colorNombre, v.talla, v.opcion].map((x) => x.toLowerCase()).join('|')));
    const created: VariantDraft[] = [];

    axis(colorList).forEach((colorEntry) => {
      // Formato admitido: "Negro" o "Negro #000000"
      const [colorName, colorHexRaw] = colorEntry ? colorEntry.split(/\s+(?=#?[0-9a-f]{3,6}$)/i) : ['', ''];
      axis(sizeList).forEach((size) => {
        axis(optionList).forEach((option) => {
          const key = [colorName || '', size || '', option || ''].map((x) => x.toLowerCase()).join('|');
          if (existing.has(key)) return;
          existing.add(key);
          created.push(
            emptyVariant({
              colorNombre: colorName || '',
              colorHex: sanitizeHex(colorHexRaw) || resolveColorHex(colorName || ''),
              talla: size || '',
              opcion: option || '',
              stock: initialStock || '0',
            })
          );
        });
      });
    });

    onChange([...variants, ...created]);
    setColors('');
    setSizes('');
    setOptions('');
    setGeneratorOpen(false);
  };

  const totalStock = variants.filter((v) => v.activo).reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  return (
    <div className="variant-editor">
      <p className="field-hint">
        Úsalas cuando el producto se vende en varias tallas, colores u opciones. Con variantes, el stock y la disponibilidad
        se controlan por cada combinación. Déjalo vacío para productos simples (por ejemplo, un suplemento de una sola
        presentación).
      </p>

      <div className="field">
        <label htmlFor="opcionVariante">Nombre de la opción adicional (opcional)</label>
        <input
          id="opcionVariante"
          value={optionLabel}
          onChange={(event) => onOptionLabelChange(event.target.value)}
          placeholder="Ej.: Capacidad, Sabor, Medida"
          aria-invalid={Boolean(optionLabelError) || undefined}
        />
        {optionLabelError && <p className="field-error">{optionLabelError}</p>}
      </div>

      <div className="variant-generator">
        <button type="button" className="variant-generator-toggle" onClick={() => setGeneratorOpen((value) => !value)} aria-expanded={generatorOpen}>
          <Icon name="layers" size={17} /> Generar combinaciones automáticamente
          <Icon name="chevronDown" size={16} />
        </button>
        {generatorOpen && (
          <div className="variant-generator-body">
            <div className="field">
              <label htmlFor="gen-colors">Colores</label>
              <input id="gen-colors" value={colors} onChange={(e) => setColors(e.target.value)} placeholder="Negro #000000, Blanco, Rojo #E0202E" />
            </div>
            <div className="field">
              <label htmlFor="gen-sizes">Tallas</label>
              <input id="gen-sizes" value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="S, M, L, XL  ·  o  38, 39, 40, 41" />
            </div>
            <div className="field">
              <label htmlFor="gen-options">{optionLabel || 'Opción adicional'}</label>
              <input id="gen-options" value={options} onChange={(e) => setOptions(e.target.value)} placeholder="750 ml, 1 L" />
            </div>
            <div className="field">
              <label htmlFor="gen-stock">Stock inicial por combinación</label>
              <input id="gen-stock" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} inputMode="numeric" />
            </div>
            <p className="field-hint">Separa los valores con comas. Se crearán todas las combinaciones que aún no existan.</p>
            <button type="button" className="btn btn-dark btn-sm" onClick={generate}>
              <Icon name="plus" size={15} /> Crear combinaciones
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      {variants.length > 0 && (
        <div className="variant-table" role="table" aria-label="Variantes">
          <div className="variant-row variant-head" role="row">
            <span role="columnheader">Color</span>
            <span role="columnheader">Talla</span>
            <span role="columnheader">{optionLabel || 'Opción'}</span>
            <span role="columnheader">SKU</span>
            <span role="columnheader">Precio</span>
            <span role="columnheader">Stock</span>
            <span role="columnheader">Imagen</span>
            <span role="columnheader">Activa</span>
            <span role="columnheader" className="sr-only">
              Acciones
            </span>
          </div>
          {variants.map((variant, index) => (
            <div className={`variant-row ${variant.activo ? '' : 'is-off'}`} role="row" key={variant.id}>
              <div className="variant-cell variant-color-cell" role="cell">
                <span className="variant-cell-label">Color</span>
                <div className="color-input">
                  <input
                    type="color"
                    value={sanitizeHex(variant.colorHex) && sanitizeHex(variant.colorHex).length === 7 ? sanitizeHex(variant.colorHex) : '#000000'}
                    onChange={(e) => update(variant.id, { colorHex: e.target.value.toUpperCase() })}
                    aria-label={`Elegir color de la variante ${index + 1}`}
                  />
                  <input
                    value={variant.colorNombre}
                    onChange={(e) => {
                      const name = e.target.value;
                      update(variant.id, {
                        colorNombre: name,
                        colorHex: variant.colorHex || resolveColorHex(name),
                      });
                    }}
                    placeholder="Nombre"
                    aria-label={`Nombre del color, variante ${index + 1}`}
                  />
                </div>
                <input
                  className="hex-input"
                  value={variant.colorHex}
                  onChange={(e) => update(variant.id, { colorHex: e.target.value })}
                  placeholder="#000000"
                  aria-label={`Código hexadecimal, variante ${index + 1}`}
                />
                {variant.colorNombre && <ColorSwatch nombre={variant.colorNombre} hex={variant.colorHex} size="xs" />}
              </div>
              <label className="variant-cell" role="cell">
                <span className="variant-cell-label">Talla</span>
                <input value={variant.talla} onChange={(e) => update(variant.id, { talla: e.target.value })} placeholder="M" />
              </label>
              <label className="variant-cell" role="cell">
                <span className="variant-cell-label">{optionLabel || 'Opción'}</span>
                <input value={variant.opcion} onChange={(e) => update(variant.id, { opcion: e.target.value })} placeholder="—" />
              </label>
              <label className="variant-cell" role="cell">
                <span className="variant-cell-label">SKU</span>
                <input value={variant.sku} onChange={(e) => update(variant.id, { sku: e.target.value })} placeholder="Opcional" />
              </label>
              <label className="variant-cell" role="cell">
                <span className="variant-cell-label">Precio</span>
                <input
                  value={variant.precio}
                  onChange={(e) => update(variant.id, { precio: e.target.value })}
                  placeholder={basePrice ? `${basePrice} (base)` : 'Base'}
                  inputMode="decimal"
                />
              </label>
              <label className="variant-cell" role="cell">
                <span className="variant-cell-label">Stock</span>
                <input value={variant.stock} onChange={(e) => update(variant.id, { stock: e.target.value })} inputMode="numeric" />
              </label>
              <label className="variant-cell" role="cell">
                <span className="variant-cell-label">Imagen</span>
                <input value={variant.imagen} onChange={(e) => update(variant.id, { imagen: e.target.value })} placeholder="https://…" />
              </label>
              <label className="variant-cell variant-active" role="cell">
                <span className="variant-cell-label">Activa</span>
                <input type="checkbox" checked={variant.activo} onChange={(e) => update(variant.id, { activo: e.target.checked })} />
              </label>
              <div className="variant-cell variant-actions" role="cell">
                <button type="button" className="admin-icon-btn" onClick={() => duplicate(variant)} aria-label={`Duplicar variante ${index + 1}`} title="Duplicar">
                  <Icon name="copy" size={15} />
                </button>
                <button type="button" className="admin-icon-btn danger" onClick={() => remove(variant.id)} aria-label={`Eliminar variante ${index + 1}`} title="Eliminar">
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="variant-footer">
        <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => onChange([...variants, emptyVariant()])}>
          <Icon name="plus" size={15} /> Agregar variante
        </button>
        {variants.length > 0 && (
          <span className="variant-total">
            {variants.length} variante{variants.length === 1 ? '' : 's'} · {totalStock} unidades activas
          </span>
        )}
      </div>
    </div>
  );
}
