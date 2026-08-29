'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Category, Product } from '@/types';
import { slugify } from '@/lib/slug';
import Icon from './Icons';
import MediaManager from './MediaManager';
import ConfirmDialog from './ConfirmDialog';

const EMPTY = { name: '', slug: '', description: '', image: '', displayOrder: 0, isActive: true, isFeatured: false };

export default function AdminCategoryManager({ categories, products, saving, deletingId, onSave, onDelete }: { categories: Category[]; products: Product[]; saving: boolean; deletingId: string | null; onSave: (category: Omit<Category, 'id'> | Category) => Promise<boolean>; onDelete: (id: string) => Promise<void> }) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) setForm({ name: editing.name, slug: editing.slug, description: editing.description, image: editing.image, displayOrder: editing.displayOrder, isActive: editing.isActive, isFeatured: editing.isFeatured });
    else setForm(EMPTY);
  }, [editing]);

  const counts = useMemo(() => products.reduce<Record<string, number>>((map, product) => { if (product.categoriaId) map[product.categoriaId] = (map[product.categoriaId] || 0) + 1; return map; }, {}), [products]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return; }
    const payload = { ...form, name: form.name.trim(), slug: slugify(form.slug || form.name), description: form.description.trim(), displayOrder: Math.max(0, Math.trunc(Number(form.displayOrder) || 0)), ...(editing ? { id: editing.id, createdAt: editing.createdAt, updatedAt: editing.updatedAt } : {}) } as Omit<Category, 'id'> | Category;
    const ok = await onSave(payload);
    if (ok) setEditing(null);
  };

  return <div className="admin-two-column"><section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Categorías</span><h3>{editing ? 'Editar categoría' : 'Nueva categoría'}</h3><p>Cualquier categoría creada aquí se integra automáticamente con Home, catálogo y filtros.</p></div>{editing && <button className="icon-btn" onClick={() => setEditing(null)}><Icon name="close" size={18} /></button>}</div>{error && <div className="alert alert-error">{error}</div>}<form className="admin-editor-form" onSubmit={submit}><div className="field"><label>Nombre *</label><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))} placeholder="Ej. Ropa" /></div><div className="field"><label>Slug</label><input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} /></div><div className="field"><label>Descripción</label><textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div><MediaManager value={form.image ? [form.image] : []} onChange={(urls) => setForm((current) => ({ ...current, image: urls[0] || '' }))} folder="categories" max={1} single label="Imagen de la categoría" /><div className="field"><label>Orden de aparición</label><input type="number" min="0" value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: Number(event.target.value) }))} /></div><div className="check-grid"><label className="admin-check-row"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} /><span><strong>Categoría activa</strong><small>Visible en navegación y filtros.</small></span></label><label className="admin-check-row"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))} /><span><strong>Destacar en Home</strong><small>Aparece entre las categorías principales.</small></span></label></div><button className="btn btn-primary btn-block" disabled={saving}>{saving ? <><span className="spinner" /> Guardando...</> : <><Icon name="check" size={16} /> {editing ? 'Guardar cambios' : 'Crear categoría'}</>}</button></form></section>

    <section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Organización</span><h3>Categorías existentes</h3></div><span className="admin-count-pill">{categories.length}</span></div>{categories.length ? <div className="category-admin-list">{categories.map((category) => <article key={category.id}><div className="category-admin-thumb">{category.image ? <img src={category.image} alt="" /> : <Icon name="layers" size={23} />}</div><div className="category-admin-main"><div><strong>{category.name}</strong><span>/{category.slug}</span></div><small>{counts[category.id] || 0} producto{counts[category.id] === 1 ? '' : 's'} · Orden {category.displayOrder}</small><div className="mini-badges"><span className={category.isActive ? 'active' : 'inactive'}>{category.isActive ? 'Activa' : 'Inactiva'}</span>{category.isFeatured && <span>Destacada</span>}</div></div><div className="admin-row-actions"><button className="admin-action-btn" onClick={() => setEditing(category)}><Icon name="edit" size={16} /></button><button className="admin-action-btn danger" onClick={() => setDeleteTarget(category)} disabled={deletingId === category.id}><Icon name="trash" size={16} /></button></div></article>)}</div> : <div className="admin-empty-state"><Icon name="layers" size={28} /><h4>No hay categorías</h4><p>Crea la primera para comenzar.</p></div>}</section>

    <ConfirmDialog open={Boolean(deleteTarget)} title="¿Eliminar esta categoría?" message={deleteTarget && counts[deleteTarget.id] ? `Esta categoría contiene ${counts[deleteTarget.id]} productos. El sistema bloqueará la eliminación para protegerlos; puedes desactivarla en su lugar.` : 'La categoría se eliminará permanentemente. Esta acción solo se permite si no contiene productos.'} confirmLabel="Eliminar categoría" destructive loading={Boolean(deleteTarget && deletingId === deleteTarget.id)} onCancel={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) void onDelete(deleteTarget.id).finally(() => setDeleteTarget(null)); }} />
  </div>;
}
