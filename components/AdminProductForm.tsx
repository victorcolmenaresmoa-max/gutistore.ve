'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Category, Product, ProductAttribute, ProductVariant } from '@/types';
import { slugify } from '@/lib/slug';
import Icon from './Icons';
import MediaManager from './MediaManager';

type OptionRow = { name: string; values: string };

const EMPTY = {
  nombre: '', slug: '', descripcion: '', descripcionCorta: '', precio: '', precioAnterior: '', categoriaId: '', marca: '', sku: '', stock: '0', estado: 'active' as Product['estado'], activo: true, destacado: false, promocionActiva: false,
  presentacion: '', beneficios: '', modoUso: '', ingredientes: '',
};

function signature(attributes: Record<string, string>) {
  return JSON.stringify(Object.entries(attributes).sort(([a], [b]) => a.localeCompare(b)));
}

function inferOptions(variants: ProductVariant[]): OptionRow[] {
  const map = new Map<string, Set<string>>();
  variants.forEach((variant) => Object.entries(variant.attributes).forEach(([name, value]) => {
    if (!map.has(name)) map.set(name, new Set());
    map.get(name)!.add(value);
  }));
  return Array.from(map.entries()).map(([name, values]) => ({ name, values: Array.from(values).join(', ') }));
}

function combinations(rows: OptionRow[]): Record<string, string>[] {
  const clean = rows.map((row) => ({ name: row.name.trim(), values: row.values.split(',').map((value) => value.trim()).filter(Boolean) })).filter((row) => row.name && row.values.length);
  if (!clean.length) return [];
  return clean.reduce<Record<string, string>[]>((acc, row) => acc.flatMap((base) => row.values.map((value) => ({ ...base, [row.name]: value }))), [{}]);
}

export default function AdminProductForm({ editingProduct, categories, onSubmit, onCancelEdit, loading }: { editingProduct: Product | null; categories: Category[]; onSubmit: (data: Omit<Product, 'id'>) => Promise<void>; onCancelEdit: () => void; loading: boolean }) {
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [optionRows, setOptionRows] = useState<OptionRow[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setForm({
        nombre: editingProduct.nombre,
        slug: editingProduct.slug || '',
        descripcion: editingProduct.descripcion,
        descripcionCorta: editingProduct.descripcionCorta || '',
        precio: String(editingProduct.precio),
        precioAnterior: editingProduct.precioAnterior ? String(editingProduct.precioAnterior) : '',
        categoriaId: editingProduct.categoriaId || '',
        marca: editingProduct.marca || '',
        sku: editingProduct.sku || '',
        stock: String(editingProduct.stock),
        estado: editingProduct.estado || 'active',
        activo: editingProduct.activo !== false,
        destacado: Boolean(editingProduct.destacado),
        promocionActiva: Boolean(editingProduct.promocionActiva),
        presentacion: editingProduct.presentacion || '',
        beneficios: editingProduct.beneficios || '',
        modoUso: editingProduct.modoUso || '',
        ingredientes: editingProduct.ingredientes || '',
      });
      setImages(Array.from(new Set([editingProduct.imagen, ...(editingProduct.imagenes || [])].filter(Boolean))));
      setAttributes(editingProduct.atributos || []);
      setVariants(editingProduct.variantes || []);
      setOptionRows(inferOptions(editingProduct.variantes || []));
    } else {
      setForm({ ...EMPTY, categoriaId: categories.find((category) => category.isActive)?.id || '' });
      setImages([]); setAttributes([]); setVariants([]); setOptionRows([]);
    }
    setError('');
  }, [editingProduct, categories]);

  const selectedCategory = useMemo(() => categories.find((category) => category.id === form.categoriaId), [categories, form.categoriaId]);
  const totalVariantStock = useMemo(() => variants.filter((variant) => variant.active !== false).reduce((sum, variant) => sum + Math.max(0, Number(variant.stock) || 0), 0), [variants]);

  const setField = (name: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [name]: value }));

  const addAttribute = () => setAttributes((current) => [...current, { name: '', value: '' }]);
  const updateAttribute = (index: number, key: 'name' | 'value', value: string) => setAttributes((current) => current.map((attribute, i) => i === index ? { ...attribute, [key]: value } : attribute));
  const removeAttribute = (index: number) => setAttributes((current) => current.filter((_, i) => i !== index));

  const addOptionRow = () => setOptionRows((current) => [...current, { name: '', values: '' }]);
  const updateOptionRow = (index: number, key: keyof OptionRow, value: string) => setOptionRows((current) => current.map((row, i) => i === index ? { ...row, [key]: value } : row));

  const generateVariants = () => {
    const combos = combinations(optionRows);
    if (!combos.length) { setError('Añade al menos una opción de variante, por ejemplo Color: Negro, Blanco.'); return; }
    const existing = new Map(variants.map((variant) => [signature(variant.attributes), variant]));
    setVariants(combos.map((attributes) => existing.get(signature(attributes)) || { sku: '', price: null, compareAtPrice: null, stock: 0, image: '', active: true, attributes }));
    setError('');
  };

  const updateVariant = (index: number, patch: Partial<ProductVariant>) => setVariants((current) => current.map((variant, i) => i === index ? { ...variant, ...patch } : variant));
  const removeVariant = (index: number) => setVariants((current) => current.filter((_, i) => i !== index));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    const price = Number(form.precio);
    const compare = form.precioAnterior ? Number(form.precioAnterior) : null;
    const stock = variants.length ? totalVariantStock : Number(form.stock || 0);
    if (!form.nombre.trim() || !form.descripcion.trim()) { setError('Nombre y descripción son obligatorios.'); return; }
    if (!form.categoriaId) { setError('Selecciona una categoría.'); return; }
    if (!Number.isFinite(price) || price < 0) { setError('El precio debe ser válido.'); return; }
    if (compare !== null && (!Number.isFinite(compare) || compare < 0)) { setError('El precio anterior no es válido.'); return; }
    if (!Number.isInteger(stock) || stock < 0) { setError('El stock debe ser un entero igual o mayor que cero.'); return; }
    if (variants.some((variant) => !Object.keys(variant.attributes).length || variant.stock < 0)) { setError('Revisa las variantes y sus stocks.'); return; }

    await onSubmit({
      nombre: form.nombre.trim(),
      slug: slugify(form.slug || form.nombre),
      descripcion: form.descripcion.trim(),
      descripcionCorta: form.descripcionCorta.trim(),
      precio: price,
      precioAnterior: compare,
      categoria: selectedCategory?.name || 'General',
      categoriaId: form.categoriaId,
      categoriaSlug: selectedCategory?.slug,
      marca: form.marca.trim(),
      sku: form.sku.trim(),
      imagen: images[0] || '',
      imagenes: images.slice(1),
      stock,
      estado: form.estado,
      activo: form.activo,
      destacado: form.destacado,
      promocionActiva: form.promocionActiva,
      atributos: attributes.map((attribute) => ({ name: attribute.name.trim(), value: attribute.value.trim() })).filter((attribute) => attribute.name && attribute.value),
      variantes: variants.map((variant) => ({ ...variant, sku: variant.sku.trim(), stock: Math.max(0, Math.trunc(Number(variant.stock) || 0)), price: variant.price ? Number(variant.price) : null, compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null })),
      presentacion: form.presentacion.trim(), beneficios: form.beneficios.trim(), modoUso: form.modoUso.trim(), ingredientes: form.ingredientes.trim(),
    });
  };

  return <section className="admin-panel admin-product-editor">
    <div className="admin-panel-heading"><div><span className="eyebrow">Catálogo multirubro</span><h3>{editingProduct ? 'Editar producto' : 'Crear producto'}</h3><p>Los campos específicos son opcionales. Usa atributos y variantes para adaptar cualquier rubro.</p></div>{editingProduct && <button className="icon-btn" onClick={onCancelEdit}><Icon name="close" size={18} /></button>}</div>
    {error && <div className="alert alert-error">{error}</div>}
    <form onSubmit={submit} className="admin-editor-form">
      <details className="admin-form-section" open><summary><span>1</span><div><strong>Información general</strong><small>Nombre, categoría, marca y descripción.</small></div></summary><div className="admin-section-body">
        <div className="field-row"><div className="field"><label>Nombre *</label><input value={form.nombre} onChange={(event) => { setField('nombre', event.target.value); if (!editingProduct && !form.slug) setField('slug', slugify(event.target.value)); }} placeholder="Ej. Camisa GutiStore Essential" /></div><div className="field"><label>Slug</label><input value={form.slug} onChange={(event) => setField('slug', slugify(event.target.value))} placeholder="camisa-gutistore-essential" /></div></div>
        <div className="field-row"><div className="field"><label>Categoría *</label><select value={form.categoriaId} onChange={(event) => setField('categoriaId', event.target.value)}><option value="">Seleccionar...</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}{category.isActive ? '' : ' (inactiva)'}</option>)}</select></div><div className="field"><label>Marca</label><input value={form.marca} onChange={(event) => setField('marca', event.target.value)} placeholder="Nike, Ray-Ban, Optimum Nutrition..." /></div></div>
        <div className="field"><label>Descripción corta</label><input value={form.descripcionCorta} onChange={(event) => setField('descripcionCorta', event.target.value)} placeholder="Una frase breve para las tarjetas del catálogo." /></div>
        <div className="field"><label>Descripción *</label><textarea value={form.descripcion} onChange={(event) => setField('descripcion', event.target.value)} placeholder="Describe características, uso, materiales o cualquier información relevante." /></div>
      </div></details>

      <details className="admin-form-section" open><summary><span>2</span><div><strong>Precio e inventario</strong><small>Precio base, SKU y stock para productos sin variantes.</small></div></summary><div className="admin-section-body">
        <div className="field-row"><div className="field"><label>Precio USD *</label><div className="input-prefix"><span>$</span><input value={form.precio} onChange={(event) => setField('precio', event.target.value)} inputMode="decimal" /></div></div><div className="field"><label>Precio anterior</label><div className="input-prefix"><span>$</span><input value={form.precioAnterior} onChange={(event) => setField('precioAnterior', event.target.value)} inputMode="decimal" placeholder="Opcional" /></div></div></div>
        <div className="field-row"><div className="field"><label>SKU base</label><input value={form.sku} onChange={(event) => setField('sku', event.target.value)} /></div><div className="field"><label>Stock {variants.length ? '(calculado por variantes)' : ''}</label><input value={variants.length ? String(totalVariantStock) : form.stock} onChange={(event) => setField('stock', event.target.value)} inputMode="numeric" disabled={variants.length > 0} /></div></div>
      </div></details>

      <details className="admin-form-section" open><summary><span>3</span><div><strong>Imágenes</strong><small>Sube fotos directamente desde teléfono, tablet o computadora.</small></div></summary><div className="admin-section-body"><MediaManager value={images} onChange={setImages} folder="products" max={10} label="Galería del producto" /></div></details>

      <details className="admin-form-section"><summary><span>4</span><div><strong>Atributos</strong><small>Información flexible como material, sabor, modelo o presentación.</small></div></summary><div className="admin-section-body"><div className="attribute-editor">{attributes.map((attribute, index) => <div className="attribute-row" key={index}><input placeholder="Atributo (ej. Material)" value={attribute.name} onChange={(event) => updateAttribute(index, 'name', event.target.value)} /><input placeholder="Valor (ej. Algodón)" value={attribute.value} onChange={(event) => updateAttribute(index, 'value', event.target.value)} /><button type="button" className="admin-action-btn danger" onClick={() => removeAttribute(index)}><Icon name="trash" size={15} /></button></div>)}</div><button type="button" className="btn btn-outline btn-sm" onClick={addAttribute}><Icon name="plus" size={14} /> Añadir atributo</button></div></details>

      <details className="admin-form-section" open={variants.length > 0}><summary><span>5</span><div><strong>Variantes</strong><small>Genera combinaciones de color, talla, sabor u otras opciones con stock individual.</small></div></summary><div className="admin-section-body"><div className="variant-builder"><div className="variant-builder-help"><strong>Constructor de opciones</strong><p>Ejemplo: <b>Color</b> → Negro, Blanco y <b>Talla</b> → S, M, L. Luego presiona “Generar combinaciones”.</p></div>{optionRows.map((row, index) => <div className="option-row" key={index}><input placeholder="Nombre: Color" value={row.name} onChange={(event) => updateOptionRow(index, 'name', event.target.value)} /><input placeholder="Valores separados por coma: Negro, Blanco" value={row.values} onChange={(event) => updateOptionRow(index, 'values', event.target.value)} /><button type="button" className="admin-action-btn danger" onClick={() => setOptionRows((current) => current.filter((_, i) => i !== index))}><Icon name="trash" size={15} /></button></div>)}<div className="variant-builder-actions"><button type="button" className="btn btn-outline btn-sm" onClick={addOptionRow}><Icon name="plus" size={14} /> Añadir opción</button><button type="button" className="btn btn-primary btn-sm" onClick={generateVariants}>Generar combinaciones</button></div></div>
        {variants.length > 0 && <div className="variant-table-wrap"><div className="variant-table-head"><span>Combinación</span><span>SKU</span><span>Precio</span><span>Stock</span><span>Imagen</span><span>Estado</span><span /></div>{variants.map((variant, index) => <div className="variant-admin-row" key={variant.id || signature(variant.attributes)}><div className="variant-name">{Object.entries(variant.attributes).map(([name,value]) => <span key={name}>{name}: <b>{value}</b></span>)}</div><input value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} placeholder="SKU" /><input value={variant.price ?? ''} onChange={(event) => updateVariant(index, { price: event.target.value === '' ? null : Number(event.target.value) })} inputMode="decimal" placeholder={`Base ${form.precio || '0'}`} /><input value={variant.stock} onChange={(event) => updateVariant(index, { stock: Math.max(0, Number(event.target.value) || 0) })} inputMode="numeric" /><div className="variant-media-cell"><MediaManager value={variant.image ? [variant.image] : []} onChange={(urls) => updateVariant(index, { image: urls[0] || '' })} folder="variants" max={1} single label="Imagen" /></div><label className="switch-label"><input type="checkbox" checked={variant.active !== false} onChange={(event) => updateVariant(index, { active: event.target.checked })} /><span>{variant.active !== false ? 'Activa' : 'Inactiva'}</span></label><button type="button" className="admin-action-btn danger" onClick={() => removeVariant(index)} title="Quitar combinación"><Icon name="trash" size={15} /></button></div>)}</div>}
      </div></details>

      <details className="admin-form-section"><summary><span>6</span><div><strong>Información heredada de suplementos</strong><small>Se conserva para no perder contenido existente. Es completamente opcional.</small></div></summary><div className="admin-section-body"><div className="field"><label>Presentación</label><input value={form.presentacion} onChange={(event) => setField('presentacion', event.target.value)} /></div><div className="field"><label>Beneficios</label><textarea value={form.beneficios} onChange={(event) => setField('beneficios', event.target.value)} /></div><div className="field"><label>Ingredientes</label><textarea value={form.ingredientes} onChange={(event) => setField('ingredientes', event.target.value)} /></div><div className="field"><label>Modo de uso</label><textarea value={form.modoUso} onChange={(event) => setField('modoUso', event.target.value)} /></div></div></details>

      <details className="admin-form-section" open><summary><span>7</span><div><strong>Visibilidad</strong><small>Controla publicación, destacados y promoción.</small></div></summary><div className="admin-section-body"><div className="field-row"><div className="field"><label>Estado</label><select value={form.estado} onChange={(event) => setField('estado', event.target.value)}><option value="active">Activo</option><option value="draft">Borrador</option><option value="archived">Archivado</option></select></div></div><div className="check-grid"><label className="admin-check-row"><input type="checkbox" checked={form.activo} onChange={(event) => setField('activo', event.target.checked)} /><span><strong>Visible en la tienda</strong><small>Desactívalo para ocultarlo sin borrar historial.</small></span></label><label className="admin-check-row"><input type="checkbox" checked={form.destacado} onChange={(event) => setField('destacado', event.target.checked)} /><span><strong>Producto destacado</strong><small>Aparece en secciones prioritarias.</small></span></label><label className="admin-check-row"><input type="checkbox" checked={form.promocionActiva} onChange={(event) => setField('promocionActiva', event.target.checked)} /><span><strong>Promoción activa</strong><small>Permite identificarlo como promocionado.</small></span></label></div></div></details>

      <div className="admin-form-actions sticky-form-actions">{editingProduct && <button type="button" className="btn btn-outline" onClick={onCancelEdit} disabled={loading}>Cancelar</button>}<button type="submit" className="btn btn-primary btn-lg" disabled={loading}>{loading ? <><span className="spinner" /> Guardando...</> : <><Icon name="check" size={17} /> {editingProduct ? 'Guardar cambios' : 'Crear producto'}</>}</button></div>
    </form>
  </section>;
}
