'use client';

import { useState } from 'react';
import type { Promotion } from '@/types';
import Icon from '@/components/Icons';
import Price from '@/components/Price';
import ProductImage from '@/components/ProductImage';
import { useCart } from '@/context/CartContext';
import { lineFromPromotion } from '@/lib/cart';
import { formatUSD } from '@/lib/currency';
import { splitLines } from '@/lib/text';

export default function PromotionCard({ promotion }: { promotion: Promotion }) {
  const { addItem } = useCart();
  const gallery = Array.from(new Set([promotion.imagen, ...(promotion.imagenes || [])].map((url) => (url || '').trim()).filter(Boolean)));
  const [selected, setSelected] = useState('');
  const activeImage = gallery.includes(selected) ? selected : gallery[0] || '';
  const items = splitLines(promotion.productos);
  const regular = promotion.precioRegular || 0;
  const hasDiscount = regular > promotion.precio && promotion.precio > 0;
  const discount = hasDiscount ? Math.round((1 - promotion.precio / regular) * 100) : 0;

  return (
    <article className="promo-card">
      <div className="promo-media">
        <ProductImage src={activeImage} alt={promotion.titulo} />
        {discount > 0 && (
          <div className="badges promo-badges">
            <span className="badge badge-red">-{discount}%</span>
          </div>
        )}
        {gallery.length > 1 && (
          <div className="promo-thumbs" aria-label={`Fotos de ${promotion.titulo}`}>
            {gallery.map((url, index) => (
              <button
                type="button"
                key={url}
                className={url === activeImage ? 'active' : ''}
                onClick={() => setSelected(url)}
                aria-label={`Ver foto ${index + 1}`}
              >
                <ProductImage src={url} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="promo-body">
        <h3>{promotion.titulo}</h3>
        {promotion.descripcion && <p className="promo-desc">{promotion.descripcion}</p>}
        {items.length > 0 && (
          <ul className="check-list promo-items">
            {items.map((item, index) => (
              <li key={`${item}-${index}`}>
                <Icon name="check" size={14} /> <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="promo-footer">
          <div>
            <Price amount={promotion.precio} compareAt={hasDiscount ? regular : 0} size="lg" />
            {hasDiscount && <span className="promo-saving">Ahorras {formatUSD(regular - promotion.precio)}</span>}
          </div>
          <button type="button" className="btn btn-primary" onClick={() => addItem(lineFromPromotion(promotion), 1)}>
            Agregar al carrito
          </button>
        </div>
      </div>
    </article>
  );
}
