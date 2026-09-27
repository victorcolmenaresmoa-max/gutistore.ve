'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Imagen de producto que nunca se deforma (object-fit: contain en CSS) y que
 * muestra un respaldo elegante con el isotipo si falta o falla la foto.
 */
export default function ProductImage({
  src,
  alt,
  className = '',
  eager = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  // Si la imagen falló antes de hidratar React, onError no se dispara.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0 && src) setFailed(true);
  }, [src]);

  if (!src || failed) {
    return (
      <span className={`product-image-fallback ${className}`} role="img" aria-label={alt}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/gutistore-mark.png" alt="" width={351} height={357} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={`product-image ${className}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
