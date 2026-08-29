'use client';

import { useEffect, useState } from 'react';
import type { Promotion } from '@/types';
import Icon from './Icons';
import MediaManager from './MediaManager';

const EMPTY = { titulo: '', descripcion: '', productos: '', precio: '', precioRegular: '', activo: true, destacado: false };

export default function AdminPromotionForm({ editingPromotion, onSubmit, onCancelEdit, loading }: { editingPromotion: Promotion | null; onSubmit: (data: Omit<Promotion, 'id'>) => Promise<void>; onCancelEdit: () => void; loading: boolean }) {
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingPromotion) {
      setForm({ titulo: editingPromotion.titulo, descripcion: editingPromotion.descripcion || '', productos: editingPromotion.productos || '', precio: String(editingPromotion.precio), precioRegular: editingPromotion.precioRegular ? String(editingPromotion.precioRegular) : '', activo: editingPromotion.activo !== false, destacado: Boolean(editingPromotion.destacado) });
      setImages(Array.from(new Set([editingPromotion.imagen, ...(editingPromotion.imagenes || [])].filter(Boolean))));
    } else { setForm(EMPTY); setImages([]); }
    setError('');
  }, [editingPromotion]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    const price = Number(form.precio);
    const regular = form.precioRegular ? Number(form.precioRegular) : 0;
    if (!form.titulo.trim() || !Number.isFinite(price) || price < 0) { setError('Indica un título y un precio válido.'); return; }
    if (form.precioRegular && (!Number.isFinite(regular) || regular < 0)) { setError('El precio regular no es válido.'); return; }
    await onSubmit({ titulo: form.titulo.trim(), descripcion: form.descripcion.trim(), productos: form.productos.trim(), precio: price, precioRegular: regular, imagen: images[0] || '', imagenes: images.slice(1), activo: form.activo, destacado: form.destacado });
  };

  return <section className="admin-panel admin-product-form-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Promociones</span><h3>{editingPromotion ? 'Editar promoción' : 'Nueva promoción'}</h3><p>Conservamos el módulo existente y ahora sus imágenes también se pueden subir desde el dispositivo.</p></div>{editingPromotion && <button className="icon-btn" onClick={onCancelEdit}><Icon name="close" size={18} /></button>}</div>{error && <div className="alert alert-error">{error}</div>}<form onSubmit={submit} className="admin-product-form"><div className="field"><label>Título *</label><input value={form.titulo} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} /></div><div className="field"><label>Descripción</label><textarea value={form.descripcion} onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))} /></div><div className="field"><label>Productos incluidos</label><textarea value={form.productos} onChange={(event) => setForm((current) => ({ ...current, productos: event.target.value }))} placeholder="Un producto por línea" /></div><div className="field-row"><div className="field"><label>Precio de la promoción</label><div className="input-prefix"><span>$</span><input value={form.precio} onChange={(event) => setForm((current) => ({ ...current, precio: event.target.value }))} inputMode="decimal" /></div></div><div className="field"><label>Precio regular</label><div className="input-prefix"><span>$</span><input value={form.precioRegular} onChange={(event) => setForm((current) => ({ ...current, precioRegular: event.target.value }))} inputMode="decimal" /></div></div></div><MediaManager value={images} onChange={setImages} folder="promotions" max={8} label="Imágenes de la promoción" /><div className="check-grid"><label className="admin-check-row"><input type="checkbox" checked={form.activo} onChange={(event) => setForm((current) => ({ ...current, activo: event.target.checked }))} /><span><strong>Promoción activa</strong><small>Visible para los clientes.</small></span></label><label className="admin-check-row"><input type="checkbox" checked={form.destacado} onChange={(event) => setForm((current) => ({ ...current, destacado: event.target.checked }))} /><span><strong>Destacada</strong><small>Mayor prioridad visual.</small></span></label></div><div className="admin-form-actions">{editingPromotion && <button type="button" className="btn btn-outline" onClick={onCancelEdit}>Cancelar</button>}<button className="btn btn-primary" disabled={loading}>{loading ? <span className="spinner" /> : <><Icon name="check" size={16} /> Guardar promoción</>}</button></div></form></section>;
}
