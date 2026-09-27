'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { Category, CategoryInput, Product } from '@/types';
import CategoryArt from '@/components/CategoryArt';
import Icon from '@/components/Icons';
import ProductImage from '@/components/ProductImage';
import { categoryArtKind } from '@/lib/categories';
import { normalizeText } from '@/lib/text';

interface Props {
  categories: Category[];
  products: Product[];
  error: string;
  saving: boolean;
  onSave: (category: CategoryInput & { id?: string }) => Promise<boolean>;
  onDelete: (category: Category) => void;
}

const EMPTY = { nombre: '', descripcion: '', imagen: '', parentId: '', orden: '0', activo: true };

export default function AdminCategoryManager({ categories, products, error, saving, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');

  const top = useMemo(() => categories.filter((c) => !c.parentId).sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es')), [categories]);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id).sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'));

  const countFor = (category: Category) => {
    if (!category.parentId) return products.filter((p) => normalizeText(p.categoria) === normalizeText(category.nombre)).length;
    const parent = categories.find((c) => c.id === category.parentId);
    return products.filter(
      (p) => parent && normalizeText(p.categoria) === normalizeText(parent.nombre) && normalizeText(p.subcategoria) === normalizeText(category.nombre)
    ).length;
  };

  // Categorías usadas en productos que aún no están registradas en la tabla.
  const unregistered = useMemo(() => {
    const known = new Set(top.map((c) => normalizeText(c.nombre)));
    return Array.from(new Set(products.map((p) => p.categoria))).filter((name) => name && !known.has(normalizeText(name)));
  }, [products, top]);

  const startEdit = (category: Category) => {
    setEditing(category);
    setForm({
      nombre: category.nombre,
      descripcion: category.descripcion,
      imagen: category.imagen,
      parentId: category.parentId || '',
      orden: String(category.orden),
      activo: category.activo,
    });
    setFormError('');
  };

  const reset = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.nombre.trim()) {
      setFormError('Escribe el nombre de la categoría.');
      return;
    }
    const ok = await onSave({
      id: editing?.id,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      imagen: form.imagen.trim(),
      parentId: form.parentId || null,
      orden: Math.trunc(Number(form.orden) || 0),
      activo: form.activo,
    });
    if (ok) reset();
  };

  if (error) {
    return (
      <section className="admin-panel">
        <div className="notice notice-info">
          <Icon name="info" size={18} />
          <div>
            <strong>Las categorías administrables aún no están activadas</strong>
            <p>{error}</p>
            <p>Mientras tanto, la tienda genera las categorías automáticamente a partir de tus productos.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="admin-split">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="eyebrow">Estructura</span>
            <h3>{editing ? 'Editar categoría' : 'Nueva categoría'}</h3>
            <p>Las categorías solo se muestran en la tienda cuando tienen productos activos.</p>
          </div>
          {editing && (
            <button type="button" className="admin-icon-btn" onClick={reset} aria-label="Cancelar edición">
              <Icon name="close" size={17} />
            </button>
          )}
        </div>
        <form className="stack-form" onSubmit={submit}>
          {formError && <p className="field-error">{formError}</p>}
          <div className="field">
            <label htmlFor="cat-nombre">Nombre *</label>
            <input id="cat-nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej.: Calzado" />
            {editing && <small className="field-hint">Si cambias el nombre, los productos de esta categoría se actualizan automáticamente.</small>}
          </div>
          <div className="field">
            <label htmlFor="cat-parent">Pertenece a</label>
            <div className="select-wrap">
              <select id="cat-parent" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <option value="">— Es una categoría principal —</option>
                {top
                  .filter((c) => c.id !== editing?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      Subcategoría de {c.nombre}
                    </option>
                  ))}
              </select>
              <Icon name="chevronDown" size={16} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="cat-desc">Descripción</label>
            <input id="cat-desc" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Opcional" />
          </div>
          <div className="field">
            <label htmlFor="cat-img">Imagen de portada (URL)</label>
            <input id="cat-img" value={form.imagen} onChange={(e) => setForm({ ...form, imagen: e.target.value })} placeholder="Opcional. Si no hay, se usa una ilustración." />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="cat-orden">Orden</label>
              <input id="cat-orden" value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} inputMode="numeric" />
            </div>
            <label className="switch-row">
              <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
              <span className="switch" aria-hidden="true" />
              <span>
                <strong>Visible</strong>
                <small>Mostrar en la tienda</small>
              </span>
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : <Icon name={editing ? 'check' : 'plus'} size={16} />}
            {editing ? 'Guardar cambios' : 'Crear categoría'}
          </button>
        </form>

        {unregistered.length > 0 && (
          <div className="unregistered">
            <strong>Categorías usadas en productos sin registrar</strong>
            <p className="field-hint">Regístralas para ordenarlas o ponerles imagen.</p>
            <div className="filter-chips">
              {unregistered.map((name) => (
                <button key={name} type="button" className="chip" onClick={() => onSave({ nombre: name, descripcion: '', imagen: '', parentId: null, orden: 50, activo: true })}>
                  <Icon name="plus" size={13} /> {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="eyebrow">Catálogo</span>
            <h3>Categorías</h3>
          </div>
          <span className="admin-count-pill">{categories.length}</span>
        </div>
        {top.length === 0 ? (
          <div className="admin-empty-state">
            <h4>Sin categorías registradas</h4>
            <p>Crea la primera con el formulario.</p>
          </div>
        ) : (
          <ul className="category-tree">
            {top.map((category) => (
              <li key={category.id}>
                <div className={`category-row ${category.activo ? '' : 'is-inactive'}`}>
                  <span className="category-thumb">
                    {category.imagen ? <ProductImage src={category.imagen} alt="" /> : <CategoryArt kind={categoryArtKind(category.nombre)} />}
                  </span>
                  <span className="category-row-info">
                    <strong>{category.nombre}</strong>
                    <small>
                      {countFor(category)} productos · orden {category.orden}
                      {!category.activo && ' · oculta'}
                    </small>
                  </span>
                  <span className="admin-row-actions">
                    <button type="button" className="admin-icon-btn" onClick={() => startEdit(category)} aria-label={`Editar ${category.nombre}`}>
                      <Icon name="edit" size={15} />
                    </button>
                    <button type="button" className="admin-icon-btn danger" onClick={() => onDelete(category)} aria-label={`Eliminar ${category.nombre}`}>
                      <Icon name="trash" size={15} />
                    </button>
                  </span>
                </div>
                {childrenOf(category.id).length > 0 && (
                  <ul>
                    {childrenOf(category.id).map((child) => (
                      <li key={child.id}>
                        <div className={`category-row is-child ${child.activo ? '' : 'is-inactive'}`}>
                          <span className="category-row-info">
                            <strong>{child.nombre}</strong>
                            <small>{countFor(child)} productos</small>
                          </span>
                          <span className="admin-row-actions">
                            <button type="button" className="admin-icon-btn" onClick={() => startEdit(child)} aria-label={`Editar ${child.nombre}`}>
                              <Icon name="edit" size={15} />
                            </button>
                            <button type="button" className="admin-icon-btn danger" onClick={() => onDelete(child)} aria-label={`Eliminar ${child.nombre}`}>
                              <Icon name="trash" size={15} />
                            </button>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
