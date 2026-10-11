'use client';

import Icon from '@/components/Icons';
import ProductImage from '@/components/ProductImage';
import { GalleryUploadButton, ImageUploader } from '@/components/admin/ImageUploader';

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
  const photos = gallery.filter((url) => url.trim());
  const remove = (index: number) => onGalleryChange(photos.filter((_, i) => i !== index));
  const move = (index: number, step: number) => {
    const target = index + step;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    onGalleryChange(next);
  };
  const makeMain = (index: number) => {
    const next = [...photos];
    const [picked] = next.splice(index, 1);
    if (main.trim()) next.unshift(main);
    onMainChange(picked);
    onGalleryChange(next);
  };

  return (
    <div className="image-editor">
      <ImageUploader
        value={main}
        onChange={onMainChange}
        folder="productos"
        label="Imagen principal"
        hint="Se muestra completa, sin recortes ni deformación. Ideal: fondo blanco y producto centrado."
      />

      <div className="image-editor-gallery">
        <span className="field-label">Galería ({photos.length})</span>
        {photos.length === 0 && <p className="field-hint">Agrega otras vistas: espalda, detalles, etiqueta, uso…</p>}
        {photos.length > 0 && (
          <ul className="gallery-grid">
            {photos.map((url, index) => (
              <li className="gallery-tile" key={`${url}-${index}`}>
                <div className="image-preview">
                  <ProductImage src={url} alt={`Foto ${index + 2}`} />
                </div>
                <div className="gallery-tile-actions">
                  <button type="button" className="admin-icon-btn" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Mover a la izquierda" title="Mover antes">
                    <Icon name="chevronLeft" size={15} />
                  </button>
                  <button type="button" className="admin-icon-btn" onClick={() => move(index, 1)} disabled={index === photos.length - 1} aria-label="Mover a la derecha" title="Mover después">
                    <Icon name="chevronRight" size={15} />
                  </button>
                  <button type="button" className="admin-icon-btn" onClick={() => makeMain(index)} aria-label="Usar como principal" title="Usar como principal">
                    <Icon name="star" size={15} />
                  </button>
                  <button type="button" className="admin-icon-btn danger" onClick={() => remove(index)} aria-label="Quitar foto" title="Quitar foto">
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <GalleryUploadButton folder="productos" onUploaded={(urls) => onGalleryChange([...photos, ...urls])} />
      </div>
    </div>
  );
}
