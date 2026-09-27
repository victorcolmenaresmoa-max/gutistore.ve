'use client';

import { useRef, useState } from 'react';
import Icon from '@/components/Icons';
import ProductImage from '@/components/ProductImage';
import { useDialog } from '@/hooks/useDialog';

const MAX_ZOOM = 3;

export default function ProductGallery({
  images,
  activeImage,
  onChange,
  name,
  children,
}: {
  images: string[];
  activeImage: string;
  onChange: (url: string) => void;
  name: string;
  children?: React.ReactNode;
}) {
  const [zoomOpen, setZoomOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState('50% 50%');
  const dialogRef = useRef<HTMLDivElement>(null);
  const current = activeImage || images[0] || '';
  const index = Math.max(0, images.indexOf(current));

  const close = () => {
    setZoomOpen(false);
    setScale(1);
  };
  useDialog(zoomOpen, dialogRef, close);

  const go = (step: number) => {
    if (images.length < 2) return;
    onChange(images[(index + step + images.length) % images.length]);
    setScale(1);
  };

  return (
    <div className="gallery">
      <div className="gallery-stage">
        <button
          type="button"
          className="gallery-main"
          onClick={() => current && setZoomOpen(true)}
          aria-label={`Ampliar foto de ${name}`}
          disabled={!current}
        >
          <ProductImage src={current} alt={name} eager />
          {current && (
            <span className="gallery-zoom-hint">
              <Icon name="zoomIn" size={17} /> Ampliar
            </span>
          )}
        </button>
        {children}
        {images.length > 1 && (
          <>
            <button type="button" className="gallery-arrow prev" onClick={() => go(-1)} aria-label="Foto anterior">
              <Icon name="chevronLeft" size={20} />
            </button>
            <button type="button" className="gallery-arrow next" onClick={() => go(1)} aria-label="Foto siguiente">
              <Icon name="chevronRight" size={20} />
            </button>
            <span className="gallery-counter">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="gallery-thumbs" role="list" aria-label="Fotos del producto">
          {images.map((url, thumbIndex) => (
            <button
              type="button"
              role="listitem"
              key={url}
              className={`gallery-thumb ${url === current ? 'active' : ''}`}
              onClick={() => onChange(url)}
              aria-label={`Ver foto ${thumbIndex + 1}`}
              aria-current={url === current}
            >
              <ProductImage src={url} alt="" />
            </button>
          ))}
        </div>
      )}

      {zoomOpen && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Vista ampliada de ${name}`} ref={dialogRef} tabIndex={-1}>
          <div className="lightbox-toolbar">
            <span className="lightbox-title">{name}</span>
            <div className="lightbox-actions">
              <button type="button" onClick={() => setScale((v) => Math.max(1, v - 0.5))} disabled={scale <= 1} aria-label="Alejar">
                <Icon name="minus" size={18} />
              </button>
              <span aria-live="polite">{Math.round(scale * 100)}%</span>
              <button type="button" onClick={() => setScale((v) => Math.min(MAX_ZOOM, v + 0.5))} disabled={scale >= MAX_ZOOM} aria-label="Acercar">
                <Icon name="plus" size={18} />
              </button>
              <button type="button" onClick={close} aria-label="Cerrar vista ampliada" data-autofocus>
                <Icon name="close" size={20} />
              </button>
            </div>
          </div>
          <div
            className={`lightbox-stage ${scale > 1 ? 'is-zoomed' : ''}`}
            onClick={(event) => {
              if (event.target === event.currentTarget) close();
            }}
            onDoubleClick={() => setScale((v) => (v > 1 ? 1 : 2))}
            onMouseMove={(event) => {
              if (scale <= 1) return;
              const rect = event.currentTarget.getBoundingClientRect();
              setOrigin(`${((event.clientX - rect.left) / rect.width) * 100}% ${((event.clientY - rect.top) / rect.height) * 100}%`);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt={name} style={{ transform: `scale(${scale})`, transformOrigin: origin }} draggable={false} />
            {images.length > 1 && (
              <>
                <button type="button" className="gallery-arrow prev" onClick={() => go(-1)} aria-label="Foto anterior">
                  <Icon name="chevronLeft" size={22} />
                </button>
                <button type="button" className="gallery-arrow next" onClick={() => go(1)} aria-label="Foto siguiente">
                  <Icon name="chevronRight" size={22} />
                </button>
              </>
            )}
          </div>
          <p className="lightbox-hint">Doble clic para acercar · Esc para cerrar</p>
        </div>
      )}
    </div>
  );
}
