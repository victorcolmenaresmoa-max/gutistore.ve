'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types';
import Icon from './Icons';

const EMPTY_FORM = {
  nombre: '',
  descripcion: '',
  precio: '',
  categoria: '',
  imagen: '',
  imagenes: [''] as string[],
  stock: '',
  presentacion: '',
  beneficios: '',
  modoUso: '',
  ingredientes: '',
  destacado: false,
};

interface Props {
  editingProduct: Product | null;
  onSubmit: (data: Omit<Product, 'id'>) => Promise<void>;
  onCancelEdit: () => void;
  loading: boolean;
}

export default function AdminProductForm({
  editingProduct,
  onSubmit,
  onCancelEdit,
  loading,
}: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setForm({
        nombre: editingProduct.nombre,
        descripcion: editingProduct.descripcion,
        precio: String(editingProduct.precio),
        categoria: editingProduct.categoria,
        imagen: editingProduct.imagen,
        imagenes:
          editingProduct.imagenes && editingProduct.imagenes.length > 0
            ? [...editingProduct.imagenes]
            : [''],
        stock: String(editingProduct.stock),
        presentacion: editingProduct.presentacion || '',
        beneficios: editingProduct.beneficios || '',
        modoUso: editingProduct.modoUso || '',
        ingredientes: editingProduct.ingredientes || '',
        destacado: Boolean(editingProduct.destacado),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [editingProduct]);

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
      const imagenes = previous.imagenes.filter((_, i) => i !== index);
      return { ...previous, imagenes: imagenes.length > 0 ? imagenes : [''] };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.nombre.trim() || !form.descripcion.trim() || !form.precio.trim()) {
      setError('Nombre, descripción y precio son obligatorios.');
      return;
    }

    const price = Number(form.precio);
    const stock = Number(form.stock || 0);

    if (!Number.isFinite(price) || price < 0) {
      setError('El precio debe ser un número válido.');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError('El stock debe ser un número entero igual o mayor que cero.');
      return;
    }

    const imagenes = form.imagenes
      .map((url) => url.trim())
      .filter((url) => url !== '');

    await onSubmit({
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: price,
      categoria: form.categoria.trim() || 'General',
      imagen: form.imagen.trim(),
      imagenes,
      stock,
      presentacion: form.presentacion.trim(),
      beneficios: form.beneficios.trim(),
      modoUso: form.modoUso.trim(),
      ingredientes: form.ingredientes.trim(),
      destacado: form.destacado,
    });

    if (!editingProduct) setForm(EMPTY_FORM);
  };

  return (
    <section className="admin-panel admin-product-form-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">Catálogo</span>
          <h3>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h3>
        </div>
        {editingProduct && (
          <button className="icon-btn" onClick={onCancelEdit} aria-label="Cancelar edición">
            <Icon name="close" size={18} />
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="admin-product-form">
        <div className="field">
          <label htmlFor="nombre">Nombre del producto *</label>
          <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. Creatina Monohidratada Premium" />
        </div>

        <div className="field">
          <label htmlFor="descripcion">Descripción amplia *</label>
          <textarea id="descripcion" name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Explica qué es, para quién está pensado y sus principales características." />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="precio">Precio en USD *</label>
            <div className="input-prefix"><span>$</span><input id="precio" name="precio" value={form.precio} onChange={handleChange} placeholder="49.99" inputMode="decimal" /></div>
            <small className="field-hint">El precio se publica en USD. El pago se confirma directamente con el asesor.</small>
          </div>
          <div className="field">
            <label htmlFor="stock">Unidades disponibles</label>
            <input id="stock" name="stock" value={form.stock} onChange={handleChange} placeholder="20" inputMode="numeric" />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="categoria">Categoría</label>
            <input id="categoria" name="categoria" value={form.categoria} onChange={handleChange} placeholder="Proteína, rendimiento, bienestar..." />
          </div>
          <div className="field">
            <label htmlFor="presentacion">Presentación</label>
            <input id="presentacion" name="presentacion" value={form.presentacion} onChange={handleChange} placeholder="300 g · 60 porciones" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="imagen">Imagen principal (portada)</label>
          <input id="imagen" name="imagen" value={form.imagen} onChange={handleChange} placeholder="https://..." />
          <small className="field-hint">Usa una imagen cuadrada, nítida y con fondo limpio para una presentación más premium.</small>
        </div>

        <div className="field">
          <label>Fotos adicionales del producto</label>
          <div className="gallery-inputs">
            {form.imagenes.map((url, index) => (
              <div className="gallery-input-row" key={index}>
                <input
                  value={url}
                  onChange={(event) => handleGalleryChange(index, event.target.value)}
                  placeholder={`https://... (foto ${index + 1})`}
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
          <small className="field-hint">Añade varias fotos del mismo producto (diferentes ángulos, etiqueta, etc.). Se mostrarán como galería en la ficha del producto.</small>
        </div>

        <div className="field">
          <label htmlFor="beneficios">Beneficios principales</label>
          <textarea id="beneficios" name="beneficios" value={form.beneficios} onChange={handleChange} placeholder={'Escribe un beneficio por línea\nEjemplo: Complementa el consumo diario de proteína'} />
        </div>

        <div className="field">
          <label htmlFor="modoUso">Modo de uso</label>
          <textarea id="modoUso" name="modoUso" value={form.modoUso} onChange={handleChange} placeholder="Indicaciones generales de preparación o consumo." />
        </div>

        <div className="field">
          <label htmlFor="ingredientes">Ingredientes</label>
          <textarea id="ingredientes" name="ingredientes" value={form.ingredientes} onChange={handleChange} placeholder="Lista o descripción de ingredientes." />
        </div>

        <label className="admin-check-row">
          <input type="checkbox" name="destacado" checked={form.destacado} onChange={handleChange} />
          <span><strong>Mostrar como producto destacado</strong><small>Aparecerá con una insignia especial en el catálogo.</small></span>
        </label>

        <div className="admin-form-actions">
          {editingProduct && (
            <button type="button" className="btn btn-outline" onClick={onCancelEdit} disabled={loading}>
              Cancelar
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : <><Icon name={editingProduct ? 'check' : 'plus'} size={17} /> {editingProduct ? 'Guardar cambios' : 'Crear producto'}</>}
          </button>
        </div>
      </form>
    </section>
  );
}
