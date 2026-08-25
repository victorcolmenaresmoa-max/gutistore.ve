'use client';

import { useEffect, useState } from 'react';
import { Promotion } from '@/types';
import Icon from './Icons';

const EMPTY_FORM = {
  titulo: '',
  descripcion: '',
  productos: '',
  precio: '',
  precioRegular: '',
  imagen: '',
  imagenes: [''] as string[],
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
        imagenes:
          editingPromotion.imagenes && editingPromotion.imagenes.length > 0
            ? [...editingPromotion.imagenes]
            : [''],
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

  const handleGalleryChange = (index: number, value: string) => {
    setForm((previous) => {
      const imagenes = [...previous.imagenes];
      imagenes[index] = value;
      return { ...previous, imagenes };
    });
  };

  const addGalleryField = () => {
    setForm((previous) => ({ ...previous, imagenes: [...previous.imagenes, ''] }));
  };

  const removeGalleryField = (index: number) => {
    setForm((previous) => {
      const imagenes = previous.imagenes.filter((_, itemIndex) => itemIndex !== index);
      return { ...previous, imagenes: imagenes.length > 0 ? imagenes : [''] };
    });
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
    <section className="admin-panel admin-product-form-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">Ofertas</span>
          <h3>{editingPromotion ? 'Editar oferta' : 'Nueva oferta en combo'}</h3>
        </div>
        {editingPromotion && (
          <button className="icon-btn" onClick={onCancelEdit} aria-label="Cancelar edición">
            <Icon name="close" size={18} />
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="admin-product-form">
        <div className="field">
          <label htmlFor="titulo">Título de la oferta *</label>
          <input id="titulo" name="titulo" value={form.titulo} onChange={handleChange} placeholder="Ej. Combo Volumen 3x" />
        </div>

        <div className="field">
          <label htmlFor="descripcion">Descripción</label>
          <textarea id="descripcion" name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Explica en qué consiste la promoción." />
        </div>

        <div className="field">
          <label htmlFor="productos">Productos incluidos</label>
          <textarea id="productos" name="productos" value={form.productos} onChange={handleChange} placeholder={'Escribe un producto por línea\nEjemplo:\nCreatina Monohidratada\nWhey Protein Isolate\nShaker de regalo'} />
          <small className="field-hint">Un producto por línea. Se mostrarán como lista dentro de la oferta.</small>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="precio">Precio de la oferta (USD) *</label>
            <div className="input-prefix"><span>$</span><input id="precio" name="precio" value={form.precio} onChange={handleChange} placeholder="79.99" inputMode="decimal" /></div>
          </div>
          <div className="field">
            <label htmlFor="precioRegular">Precio regular (USD)</label>
            <div className="input-prefix"><span>$</span><input id="precioRegular" name="precioRegular" value={form.precioRegular} onChange={handleChange} placeholder="99.99" inputMode="decimal" /></div>
            <small className="field-hint">Opcional. Si lo indicas, se mostrará tachado para resaltar el ahorro.</small>
          </div>
        </div>

        <div className="field">
          <label htmlFor="promo-imagen">Imagen principal de la oferta</label>
          <input id="promo-imagen" name="imagen" value={form.imagen} onChange={handleChange} placeholder="https://..." />
          <small className="field-hint">Esta será la primera foto visible en la tarjeta de la oferta.</small>
        </div>

        <div className="field">
          <label>Fotos adicionales de la oferta</label>
          <div className="gallery-inputs">
            {form.imagenes.map((url, index) => (
              <div className="gallery-input-row" key={index}>
                <input
                  value={url}
                  onChange={(event) => handleGalleryChange(index, event.target.value)}
                  placeholder={`https://... (foto ${index + 2})`}
                />
                <button
                  type="button"
                  className="admin-action-btn danger"
                  onClick={() => removeGalleryField(index)}
                  aria-label="Quitar foto"
                  title="Quitar foto"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-outline btn-sm gallery-add-btn" onClick={addGalleryField}>
            <Icon name="plus" size={15} /> Agregar otra foto
          </button>
          <small className="field-hint">Puedes añadir fotos del frente, parte trasera, laterales o detalles de la etiqueta.</small>
        </div>

        <label className="admin-check-row">
          <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
          <span><strong>Oferta activa</strong><small>Solo las ofertas activas aparecen en el catálogo.</small></span>
        </label>

        <label className="admin-check-row">
          <input type="checkbox" name="destacado" checked={form.destacado} onChange={handleChange} />
          <span><strong>Destacar oferta</strong><small>Resáltala dentro de la sección de promociones.</small></span>
        </label>

        <div className="admin-form-actions">
          {editingPromotion && (
            <button type="button" className="btn btn-outline" onClick={onCancelEdit} disabled={loading}>
              Cancelar
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : <><Icon name={editingPromotion ? 'check' : 'plus'} size={17} /> {editingPromotion ? 'Guardar cambios' : 'Crear oferta'}</>}
          </button>
        </div>
      </form>
    </section>
  );
}
