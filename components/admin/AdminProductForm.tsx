'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Category, Product, ProductInput } from '@/types';
import Icon, { IconName } from '@/components/Icons';
import { normalizeText, slugify } from '@/lib/text';
import ImageEditor from './product-form/ImageEditor';
import VariantEditor from './product-form/VariantEditor';
import {
  DraftErrors,
  EMPTY_DRAFT,
  ProductDraft,
  draftFromProduct,
  draftToInput,
  newId,
  validateDraft,
} from './product-form/types';

interface Props {
  editingProduct: Product | null;
  categories: Category[];
  products: Product[];
  onSubmit: (data: ProductInput) => Promise<boolean>;
  onCancel: () => void;
  saving: boolean;
}

const GENDERS = ['', 'Unisex', 'Hombre', 'Mujer', 'Niños'];

function Section({
  id,
  title,
  description,
  icon,
  children,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  description?: string;
  icon: IconName;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="form-section" open={defaultOpen} id={id}>
      <summary>
        <span className="form-section-icon">
          <Icon name={icon} size={18} />
        </span>
        <span className="form-section-title">
          <strong>{title}</strong>
          {description && <small>{description}</small>}
        </span>
        <Icon name="chevronDown" size={18} className="form-section-chevron" />
      </summary>
      <div className="form-section-body">{children}</div>
    </details>
  );
}

export default function AdminProductForm({ editingProduct, categories, products, onSubmit, onCancel, saving }: Props) {
  const [draft, setDraft] = useState<ProductDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<DraftErrors>({});

  useEffect(() => {
    setDraft(editingProduct ? draftFromProduct(editingProduct) : { ...EMPTY_DRAFT, variantes: [], imagenes: [], especificaciones: [] });
    setErrors({});
  }, [editingProduct]);

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      if (key === 'nombre' && !current.slugTouched) next.slug = slugify(value as string);
      return next;
    });
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const input = (key: keyof ProductDraft) => ({
    id: `product-${key}`,
    value: draft[key] as string,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      set(key, event.target.value as never),
    'aria-invalid': Boolean(errors[key]) || undefined,
  });

  const toggle = (key: 'activo' | 'destacado' | 'nuevo' | 'oferta') => ({
    checked: draft[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => set(key, event.target.checked),
  });

  // Sugerencias para categoría, subcategoría y marca (tabla + productos existentes).
  const suggestions = useMemo(() => {
    const top = categories.filter((c) => !c.parentId);
    const parent = top.find((c) => normalizeText(c.nombre) === normalizeText(draft.categoria));
    const categoryNames = new Set([...top.map((c) => c.nombre), ...products.map((p) => p.categoria)].filter(Boolean));
    const subNames = new Set(
      [
        ...categories.filter((c) => parent && c.parentId === parent.id).map((c) => c.nombre),
        ...products.filter((p) => normalizeText(p.categoria) === normalizeText(draft.categoria)).map((p) => p.subcategoria),
      ].filter(Boolean)
    );
    const brands = new Set(products.map((p) => p.marca).filter(Boolean));
    return {
      categories: Array.from(categoryNames).sort((a, b) => a.localeCompare(b, 'es')),
      subcategories: Array.from(subNames).sort((a, b) => a.localeCompare(b, 'es')),
      brands: Array.from(brands).sort((a, b) => a.localeCompare(b, 'es')),
    };
  }, [categories, products, draft.categoria]);

  const isSupplement = /suplement|protein|creatin|vitamin/.test(normalizeText(`${draft.categoria} ${draft.subcategoria}`));
  const hasSupplementData = Boolean(draft.beneficios || draft.ingredientes || draft.modoUso);
  const hasVariants = draft.variantes.some((variant) => variant.activo);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateDraft(draft);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      const first = Object.keys(found).find((key) => found[key as keyof DraftErrors]);
      const element = document.getElementById(first === 'variantes' ? 'section-variantes' : `product-${first}`);
      if (element) {
        element.closest('details')?.setAttribute('open', '');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ('focus' in element) (element as HTMLElement).focus({ preventScroll: true });
      }
      return;
    }
    await onSubmit(draftToInput(draft));
  };

  const errorText = (key: keyof DraftErrors) => (errors[key] ? <p className="field-error">{errors[key]}</p> : null);

  return (
    <form className="admin-product-form" onSubmit={submit} noValidate>
      <div className="admin-form-header">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          <Icon name="arrowLeft" size={16} /> Volver a productos
        </button>
        <div>
          <span className="eyebrow">Catálogo</span>
          <h2>{editingProduct?.id ? `Editar: ${editingProduct.nombre}` : editingProduct ? 'Nuevo producto (duplicado)' : 'Nuevo producto'}</h2>
        </div>
      </div>

      <div className="admin-form-layout">
        <div className="admin-form-main">
          <Section id="section-info" title="Información principal" description="Nombre, descripción, categoría y marca" icon="edit">
            <div className="form-grid">
              <div className="field field-span-2">
                <label htmlFor="product-nombre">Nombre del producto *</label>
                <input {...input('nombre')} placeholder="Ej.: Franela Dry-Fit Oversize" />
                {errorText('nombre')}
              </div>
              <div className="field field-span-2">
                <label htmlFor="product-slug">URL amigable</label>
                <div className="input-prefix">
                  <span>/producto/</span>
                  <input
                    id="product-slug"
                    value={draft.slug}
                    onChange={(e) => setDraft((current) => ({ ...current, slug: slugify(e.target.value), slugTouched: true }))}
                    placeholder="se-genera-desde-el-nombre"
                  />
                </div>
                <small className="field-hint">Se genera automáticamente. Si ya existe, se agrega un número al final.</small>
              </div>
              <div className="field field-span-2">
                <label htmlFor="product-descripcionCorta">Descripción corta</label>
                <input {...input('descripcionCorta')} maxLength={180} placeholder="Una línea que resuma el producto (se ve en la ficha)." />
              </div>
              <div className="field field-span-2">
                <label htmlFor="product-descripcion">Descripción completa</label>
                <textarea {...input('descripcion')} rows={5} placeholder="Qué es, para quién es y qué lo hace especial. Separa párrafos con una línea en blanco." />
              </div>
              <div className="field">
                <label htmlFor="product-categoria">Categoría *</label>
                <input {...input('categoria')} list="list-categorias" placeholder="Ropa, Calzado, Suplementos…" autoComplete="off" />
                <datalist id="list-categorias">
                  {suggestions.categories.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                {errorText('categoria')}
              </div>
              <div className="field">
                <label htmlFor="product-subcategoria">Subcategoría</label>
                <input {...input('subcategoria')} list="list-subcategorias" placeholder="Franelas, Sneakers, Proteínas…" autoComplete="off" />
                <datalist id="list-subcategorias">
                  {suggestions.subcategories.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div className="field">
                <label htmlFor="product-marca">Marca</label>
                <input {...input('marca')} list="list-marcas" placeholder="Opcional" autoComplete="off" />
                <datalist id="list-marcas">
                  {suggestions.brands.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div className="field">
                <label htmlFor="product-etiquetas">Etiquetas</label>
                <input {...input('etiquetas')} placeholder="gym, verano, algodón" />
                <small className="field-hint">Separadas por comas. Ayudan en la búsqueda.</small>
              </div>
            </div>
          </Section>

          <Section id="section-precio" title="Precio e inventario" description="Precio en USD, precio anterior, SKU y stock" icon="dollar">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="product-precio">Precio (USD) *</label>
                <div className="input-prefix">
                  <span>$</span>
                  <input {...input('precio')} inputMode="decimal" placeholder="29.99" />
                </div>
                {errorText('precio')}
              </div>
              <div className="field">
                <label htmlFor="product-precioAnterior">Precio anterior (USD)</label>
                <div className="input-prefix">
                  <span>$</span>
                  <input {...input('precioAnterior')} inputMode="decimal" placeholder="Opcional" />
                </div>
                <small className="field-hint">Se muestra tachado junto al porcentaje de ahorro.</small>
                {errorText('precioAnterior')}
              </div>
              <div className="field">
                <label htmlFor="product-sku">SKU</label>
                <input {...input('sku')} placeholder="Opcional" />
              </div>
              <div className="field">
                <label htmlFor="product-stock">Stock general</label>
                <input {...input('stock')} inputMode="numeric" disabled={hasVariants} />
                <small className="field-hint">
                  {hasVariants ? 'Este producto usa variantes: el stock se controla en cada variante.' : 'Unidades disponibles.'}
                </small>
                {errorText('stock')}
              </div>
            </div>
          </Section>

          <Section id="section-imagenes" title="Imágenes" description="Foto principal y galería" icon="image">
            <ImageEditor
              main={draft.imagen}
              gallery={draft.imagenes}
              onMainChange={(value) => set('imagen', value)}
              onGalleryChange={(value) => set('imagenes', value)}
            />
          </Section>

          <Section
            id="section-variantes"
            title="Variantes"
            description={draft.variantes.length ? `${draft.variantes.length} combinaciones` : 'Tallas, colores u otras opciones'}
            icon="layers"
            defaultOpen={draft.variantes.length > 0 || !editingProduct}
          >
            <VariantEditor
              variants={draft.variantes}
              optionLabel={draft.opcionVariante}
              basePrice={draft.precio}
              onChange={(value) => set('variantes', value)}
              onOptionLabelChange={(value) => set('opcionVariante', value)}
              error={errors.variantes}
              optionLabelError={errors.opcionVariante}
            />
          </Section>

          <Section id="section-atributos" title="Atributos y especificaciones" description="Material, género, capacidad y datos técnicos" icon="sliders" defaultOpen={Boolean(editingProduct)}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="product-material">Material</label>
                <input {...input('material')} placeholder="Algodón, poliéster, acero…" />
              </div>
              <div className="field">
                <label htmlFor="product-genero">Género</label>
                <div className="select-wrap">
                  <select {...input('genero')}>
                    {GENDERS.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender || 'No aplica'}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevronDown" size={16} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="product-presentacion">Presentación</label>
                <input {...input('presentacion')} placeholder="300 g · 60 porciones / Pack x2" />
              </div>
              <div className="field">
                <label htmlFor="product-capacidad">Peso, volumen o capacidad</label>
                <input {...input('capacidad')} placeholder="750 ml · 1 kg" />
              </div>
              <div className="field field-span-2">
                <label htmlFor="product-caracteristicas">Características</label>
                <textarea {...input('caracteristicas')} rows={4} placeholder={'Una por línea\nTela transpirable\nCosturas reforzadas'} />
              </div>
              <div className="field field-span-2">
                <span className="field-label">Especificaciones personalizadas</span>
                <div className="spec-editor">
                  {draft.especificaciones.map((spec, index) => (
                    <div className="spec-row" key={spec.id}>
                      <input
                        value={spec.nombre}
                        onChange={(e) =>
                          set(
                            'especificaciones',
                            draft.especificaciones.map((item) => (item.id === spec.id ? { ...item, nombre: e.target.value } : item))
                          )
                        }
                        placeholder="Nombre (ej.: Fit, Tipo de lente)"
                        aria-label={`Nombre de la especificación ${index + 1}`}
                      />
                      <input
                        value={spec.valor}
                        onChange={(e) =>
                          set(
                            'especificaciones',
                            draft.especificaciones.map((item) => (item.id === spec.id ? { ...item, valor: e.target.value } : item))
                          )
                        }
                        placeholder="Valor (ej.: Oversize, Polarizado)"
                        aria-label={`Valor de la especificación ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="admin-icon-btn danger"
                        onClick={() => set('especificaciones', draft.especificaciones.filter((item) => item.id !== spec.id))}
                        aria-label="Quitar especificación"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    onClick={() => set('especificaciones', [...draft.especificaciones, { id: newId(), nombre: '', valor: '' }])}
                  >
                    <Icon name="plus" size={15} /> Agregar especificación
                  </button>
                </div>
              </div>
              <div className="field field-span-2">
                <label htmlFor="product-informacionAdicional">Información adicional</label>
                <textarea {...input('informacionAdicional')} rows={3} placeholder="Cuidados, garantía, recomendaciones…" />
              </div>
            </div>
          </Section>

          <Section
            id="section-suplementos"
            title="Información de suplementos"
            description="Beneficios, ingredientes y modo de uso (opcional)"
            icon="leaf"
            defaultOpen={isSupplement || hasSupplementData}
          >
            <div className="form-grid">
              <div className="field field-span-2">
                <label htmlFor="product-beneficios">Beneficios</label>
                <textarea {...input('beneficios')} rows={4} placeholder={'Uno por línea. Usa lenguaje responsable, sin promesas médicas.\nComplementa el consumo diario de proteína'} />
              </div>
              <div className="field field-span-2">
                <label htmlFor="product-ingredientes">Ingredientes</label>
                <textarea {...input('ingredientes')} rows={3} />
              </div>
              <div className="field field-span-2">
                <label htmlFor="product-modoUso">Modo de uso</label>
                <textarea {...input('modoUso')} rows={3} />
              </div>
            </div>
          </Section>
        </div>

        <aside className="admin-form-side">
          <div className="admin-card">
            <h3>Publicación</h3>
            <label className="switch-row">
              <input type="checkbox" {...toggle('activo')} />
              <span className="switch" aria-hidden="true" />
              <span>
                <strong>Activo</strong>
                <small>Visible en la tienda</small>
              </span>
            </label>
            <label className="switch-row">
              <input type="checkbox" {...toggle('destacado')} />
              <span className="switch" aria-hidden="true" />
              <span>
                <strong>Destacado</strong>
                <small>Aparece en la portada</small>
              </span>
            </label>
            <label className="switch-row">
              <input type="checkbox" {...toggle('nuevo')} />
              <span className="switch" aria-hidden="true" />
              <span>
                <strong>Nuevo</strong>
                <small>Etiqueta “Nuevo”</small>
              </span>
            </label>
            <label className="switch-row">
              <input type="checkbox" {...toggle('oferta')} />
              <span className="switch" aria-hidden="true" />
              <span>
                <strong>En oferta</strong>
                <small>Aparece en Ofertas</small>
              </span>
            </label>
          </div>

          <div className="admin-card admin-save-card">
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Guardando…
                </>
              ) : (
                <>
                  <Icon name="check" size={18} /> {editingProduct?.id ? 'Guardar cambios' : 'Crear producto'}
                </>
              )}
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={onCancel} disabled={saving}>
              Cancelar
            </button>
            {Object.values(errors).some(Boolean) && (
              <p className="field-error">
                <Icon name="alert" size={14} /> Revisa los campos marcados.
              </p>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}
