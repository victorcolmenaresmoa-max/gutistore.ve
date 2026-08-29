'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Promotion } from '@/types';
import Icon from './Icons';
import { formatUSD } from '@/lib/currency';
import { useCart } from '@/context/CartContext';

export default function PromotionCard({ promotion, onRequest }: { promotion: Promotion; onRequest?: (promotion: Promotion) => void }) {
  const { addItem } = useCart();
  const gallery = Array.from(new Set([promotion.imagen, ...(promotion.imagenes || [])].map((url) => (url || '').trim()).filter(Boolean)));
  const [selectedImage, setSelectedImage] = useState('');
  const [added, setAdded] = useState(false);
  const activeImage = gallery.includes(selectedImage) ? selectedImage : gallery[0] || '';
  const items = promotion.productos.split(/[\r\n]+/).map((item) => item.trim()).filter(Boolean);
  const hasDiscount = Boolean(promotion.precioRegular && promotion.precioRegular > promotion.precio && promotion.precio > 0);
  const discountPercent = hasDiscount ? Math.round((1 - promotion.precio / Number(promotion.precioRegular)) * 100) : 0;

  const addPromotion = () => {
    if (onRequest) { onRequest(promotion); return; }
    addItem({
      productId: promotion.id,
      promotionId: promotion.id,
      nombre: `Oferta: ${promotion.titulo}`,
      imagen: activeImage,
      precio: promotion.precio,
      atributosSeleccionados: items.length ? { Incluye: items.join(' + ') } : { Tipo: 'Promoción' },
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article className="promo-card">
      <div className="promo-media">
        {activeImage ? <Image src={activeImage} alt={promotion.titulo} fill sizes="(max-width: 700px) 90vw, 380px" /> : <div className="promo-placeholder"><Icon name="gift" size={42} /></div>}
        <span className="promo-ribbon"><Icon name="tag" size={13} /> Oferta</span>
        {discountPercent > 0 && <span className="promo-discount">-{discountPercent}%</span>}
      </div>
      {gallery.length > 1 && <div className="promo-thumb-strip">{gallery.map((url, index) => <button type="button" key={url} className={activeImage === url ? 'active' : ''} onClick={() => setSelectedImage(url)} aria-label={`Ver foto ${index + 1}`}><Image src={url} alt="" fill sizes="56px" /></button>)}</div>}
      <div className="promo-body">
        <h3>{promotion.titulo}</h3>
        {promotion.descripcion && <p className="promo-desc">{promotion.descripcion}</p>}
        {items.length > 0 && <ul className="promo-items">{items.slice(0, 5).map((item) => <li key={item}><Icon name="check" size={14} /> {item}</li>)}</ul>}
        <div className="promo-price-block"><div className="promo-price-main"><strong>{formatUSD(promotion.precio)}</strong>{hasDiscount && <del>{formatUSD(Number(promotion.precioRegular))}</del>}</div></div>
        <button className="btn btn-primary btn-block" onClick={addPromotion}><Icon name={added ? 'check' : 'gift'} size={17} /> {added ? 'Oferta añadida' : 'Añadir oferta al carrito'}</button>
      </div>
    </article>
  );
}
