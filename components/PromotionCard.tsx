'use client';

import { useState } from 'react';
import { Promotion } from '@/types';
import Icon from './Icons';
import { formatUSD } from '@/lib/currency';

interface Props {
  promotion: Promotion;
  onRequest: (promotion: Promotion) => void;
}

export default function PromotionCard({ promotion, onRequest }: Props) {
  const gallery = Array.from(
    new Set(
      [promotion.imagen, ...(promotion.imagenes || [])]
        .map((url) => (url || '').trim())
        .filter((url) => url !== '')
    )
  );
  const [selectedImage, setSelectedImage] = useState('');
  const activeImage = gallery.includes(selectedImage) ? selectedImage : gallery[0] || '';

  const items = promotion.productos
    .split(/[\r\n]+/)
    .map((item) => item.trim())
    .filter((item) => item !== '');

  const hasDiscount =
    typeof promotion.precioRegular === 'number' &&
    promotion.precioRegular > promotion.precio &&
    promotion.precio > 0;

  const discountPercent = hasDiscount
    ? Math.round((1 - promotion.precio / (promotion.precioRegular as number)) * 100)
    : 0;

  return (
    <article className="promo-card">
      <div className="promo-media">
        <img
          src={
            activeImage ||
            'https://placehold.co/900x600/6d0b2f/ffffff?text=Oferta+GutiSupplements'
          }
          alt={promotion.titulo}
          loading="lazy"
        />
        <span className="promo-ribbon">
          <Icon name="tag" size={13} /> Oferta
        </span>
        {hasDiscount && discountPercent > 0 && (
          <span className="promo-discount">-{discountPercent}%</span>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="promo-thumb-strip" role="list" aria-label={`Fotos de ${promotion.titulo}`}>
          {gallery.map((url, index) => (
            <button
              type="button"
              role="listitem"
              key={`${url}-${index}`}
              className={`promo-thumb ${activeImage === url ? 'active' : ''}`}
              onClick={() => setSelectedImage(url)}
              aria-label={`Ver foto ${index + 1} de la oferta`}
            >
              <img src={url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className="promo-body">
        <h3>{promotion.titulo}</h3>
        {promotion.descripcion && <p className="promo-desc">{promotion.descripcion}</p>}

        {items.length > 0 && (
          <ul className="promo-items">
            {items.map((item, index) => (
              <li key={index}>
                <Icon name="check" size={14} /> {item}
              </li>
            ))}
          </ul>
        )}

        <div className="promo-price-block">
          <div className="promo-price-main">
            <strong>{formatUSD(promotion.precio)}</strong>
            {hasDiscount && (
              <span className="promo-price-old">{formatUSD(promotion.precioRegular as number)}</span>
            )}
          </div>
          <span className="promo-price-note">El pago y cualquier equivalente en Bs se coordinan por WhatsApp.</span>
        </div>

        <button className="btn btn-primary btn-block" onClick={() => onRequest(promotion)}>
          <Icon name="gift" size={17} /> Solicitar esta oferta
        </button>
      </div>
    </article>
  );
}
