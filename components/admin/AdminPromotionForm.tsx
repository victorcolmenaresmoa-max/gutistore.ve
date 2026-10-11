'use client';

import { useEffect, useState } from 'react';
import { Promotion } from '@/types';
import Icon from '@/components/Icons';
import ProductImage from '@/components/ProductImage';
import { GalleryUploadButton, ImageUploader } from '@/components/admin/ImageUploader';

const EMPTY_FORM = {
  titulo: '',
  descripcion: '',
  productos: '',
  precio: '',
  precioRegular: '',
  imagen: '',
  imagenes: [] as string[],
  activo: true,
  destacado: false,
};

interface Props {
  editingPromotion: Promotion | null;
  onSubmit: (data: Omit<Promotion, 'id'>) => Promise<void>;
  onCancelEdit: () => void;
  loading: boolean;
}

export default function AdminPromotionForm({
  editingPromotion,
  onSubmit,
  onCancelEdit,
  loading,
}: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingPromotion) {
      setForm({
        titulo: editingPromotion.titulo,
        descripcion: editingPromotion.descripcion || '',
        productos: editingPromotion.productos || '',
        precio: String(editingPromotion.precio),
        precioRegular: editingPromotion.precioRegular
          ? String(editingPromotion.precioRegular)
          : '',
        imagen: editingPromotion.imagen || '',
        imagenes: (editingPromotion.imagenes || []).filter((url) => url.trim()),
        activo: editingPromotion.activo !== false,
        destacado: Boolean(editingPromotion.destacado),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [editingPromotion]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value,
    }));
  };

  const addGalleryPhotos = (urls: string[]) => {
    setForm((previous) => ({ ...previous, imagenes: [...previous.imagenes, ...urls] }));
  };

  const removeGalleryPhoto = (index: number) => {
    setForm((previous) => ({ ...previous, imagenes: previous.imagenes.filter((_, itemIndex) => itemIndex !== index) }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.titulo.trim() || !form.precio.trim()) {
      setError('El título y el precio de la oferta son obligatorios.');
      return;
    }

    const precio = Number(form.precio);
    if (!Number.isFinite(precio) || precio < 0) {
      setError('El precio de la oferta debe ser un número válido.');
      return;
    }

    const precioRegular = form.precioRegular.trim() ? Number(form.precioRegular) : 0;
    if (form.precioRegular.trim() && (!Number.isFinite(precioRegular) || precioRegular < 0)) {
      setError('El precio regular debe ser un número válido.');
      return;
    }

    const imagenes = form.imagenes
      .map((url) => url.trim())
      .filter((url) => url !== '');

    await onSubmit({
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      productos: form.productos.trim(),
      precio,
      precioRegular,
      imagen: form.imagen.trim(),
      imagenes,
      activo: form.activo,
      destacado: form.destacado,
    });

    if (!editingPromotion) setForm(EMPTY_FORM);
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">Promociones</span>
          <h3>{editingPromotion ? 'Editar promoción' : 'Nueva promoción'}</h3>
        </div>
        {editingPromotion && (
          <button className="icon-btn" onClick={onCancelEdit} aria-label="Cancelar edición">
            <Icon name="close" size={18} />
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="stack-form">
        <div className="field">
          <label htmlFor="promo-titulo">Título de la oferta *</label>
          <input id="promo-titulo" name="titulo" value={form.titulo} onChange={handleChange} placeholder="Ej.: Combo Gym, 2 franelas por $25, Semana GutiStore" />
        </div>

        <div className="field">
          <label htmlFor="promo-descripcion">Descripción</label>
          <textarea id="promo-descripcion" name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Explica en qué consiste la promoción y hasta cuándo aplica." />
        </div>

        <div className="field">
          <label htmlFor="promo-productos">Productos incluidos</label>
          <textarea id="promo-productos" name="productos" value={form.productos} onChange={handleChange} placeholder={'Un producto por línea\nEjemplo:\n2 franelas Dry-Fit\nShaker de regalo'} />
          <small className="field-hint">Un producto por línea. Se muestran como lista en la tarjeta de la promoción.</small>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="promo-precio">Precio promocional (USD) *</label>
            <div className="input-prefix"><span>$</span><input id="promo-precio" name="precio" value={form.precio} onChange={handleChange} placeholder="79.99" inputMode="decimal" /></div>
          </div>
          <div className="field">
            <label htmlFor="promo-precioRegular">Precio regular (USD)</label>
            <div className="input-prefix"><span>$</span><input id="promo-precioRegular" name="precioRegular" value={form.precioRegular} onChange={handleChange} placeholder="99.99" inputMode="decimal" /></div>
            <small className="field-hint">Opcional. Si lo indicas, se mostrará tachado para resaltar el ahorro.</small>
          </div>
        </div>

        <ImageUploader
          value={form.imagen}
          onChange={(url) => setForm((previous) => ({ ...previous, imagen: url }))}
          folder="promociones"
          label="Imagen principal de la oferta"
          hint="Esta será la primera foto visible en la tarjeta de la oferta."
        />

        <div className="field">
          <span className="field-label">Fotos adicionales de la oferta ({form.imagenes.length})</span>
          {form.imagenes.length > 0 && (
            <ul className="gallery-grid">
              {form.imagenes.map((url, index) => (
                <li className="gallery-tile" key={`${url}-${index}`}>
                  <div className="image-preview">
                    <ProductImage src={url} alt={`Foto ${index + 2}`} />
                  </div>
                  <div className="gallery-tile-actions">
                    <button type="button" className="admin-icon-btn danger" onClick={() => removeGalleryPhoto(index)} aria-label="Quitar foto" title="Quitar foto">
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <GalleryUploadButton folder="promociones" onUploaded={addGalleryPhotos} />
          <small className="field-hint">Puedes añadir fotos del frente, parte trasera, laterales o detalles de la etiqueta.</small>
        </div>

        <label className="admin-check-row">
          <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
          <span><strong>Promoción activa</strong><small>Solo las promociones activas aparecen en la tienda.</small></span>
        </label>

        <label className="admin-check-row">
          <input type="checkbox" name="destacado" checked={form.destacado} onChange={handleChange} />
          <span><strong>Destacar</strong><small>Aparece primero y resaltada.</small></span>
        </label>

        <div className="admin-form-actions">
          {editingPromotion && (
            <button type="button" className="btn btn-outline" onClick={onCancelEdit} disabled={loading}>
              Cancelar
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : <><Icon name={editingPromotion ? 'check' : 'plus'} size={17} /> {editingPromotion ? 'Guardar cambios' : 'Crear promoción'}</>}
          </button>
        </div>
      </form>
    </section>
  );
}
