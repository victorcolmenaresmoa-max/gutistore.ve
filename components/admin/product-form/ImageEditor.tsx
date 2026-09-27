'use client';

import Icon from '@/components/Icons';
import ProductImage from '@/components/ProductImage';

export default function ImageEditor({
  main,
  gallery,
  onMainChange,
  onGalleryChange,
}: {
  main: string;
  gallery: string[];
  onMainChange: (value: string) => void;
  onGalleryChange: (value: string[]) => void;
}) {
  const update = (index: number, value: string) => onGalleryChange(gallery.map((url, i) => (i === index ? value : url)));
  const remove = (index: number) => onGalleryChange(gallery.filter((_, i) => i !== index));
  const move = (index: number, step: number) => {
    const target = index + step;
    if (target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    [next[index], next[target]] = [next[target], next[index]];
    onGalleryChange(next);
  };
  const makeMain = (index: number) => {
    const next = [...gallery];
    const [picked] = next.splice(index, 1);
    if (main.trim()) next.unshift(main);
    onMainChange(picked);
    onGalleryChange(next);
  };

  return (
    <div className="image-editor">
      <div className="image-editor-main">
        <div className="image-preview image-preview-lg">
          <ProductImage src={main.trim()} alt="Vista previa de la imagen principal" />
        </div>
        <div className="field">
          <label htmlFor="imagen">Imagen principal</label>
          <input id="imagen" value={main} onChange={(e) => onMainChange(e.target.value)} placeholder="https://… o /catalogo/foto.webp" />
          <small className="field-hint">Pega la URL de la foto. Se muestra completa, sin recortes ni deformación.</small>
        </div>
      </div>

      <div className="image-editor-gallery">
        <span className="field-label">Galería ({gallery.length})</span>
        {gallery.length === 0 && <p className="field-hint">Agrega otras vistas: espalda, detalles, etiqueta, uso…</p>}
        {gallery.map((url, index) => (
          <div className="gallery-row" key={index}>
            <div className="image-preview">
              <ProductImage src={url.trim()} alt="" />
            </div>
            <input value={url} onChange={(e) => update(index, e.target.value)} placeholder={`https://… (foto ${index + 2})`} aria-label={`URL de la foto ${index + 2}`} />
            <div className="gallery-row-actions">
              <button type="button" className="admin-icon-btn" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Mover arriba" title="Mover arriba">
                <Icon name="chevronDown" size={15} className="rotate-180" />
              </button>
              <button type="button" className="admin-icon-btn" onClick={() => move(index, 1)} disabled={index === gallery.length - 1} aria-label="Mover abajo" title="Mover abajo">
                <Icon name="chevronDown" size={15} />
              </button>
              <button type="button" className="admin-icon-btn" onClick={() => makeMain(index)} disabled={!url.trim()} aria-label="Usar como principal" title="Usar como principal">
                <Icon name="star" size={15} />
              </button>
              <button type="button" className="admin-icon-btn danger" onClick={() => remove(index)} aria-label="Quitar foto" title="Quitar foto">
                <Icon name="trash" size={15} />
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => onGalleryChange([...gallery, ''])}>
          <Icon name="plus" size={15} /> Agregar foto
        </button>
      </div>
    </div>
  );
}
