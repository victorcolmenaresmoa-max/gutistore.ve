'use client';

import Link from 'next/link';
import Icon from '@/components/Icons';
import Price from '@/components/Price';
import ProductImage from '@/components/ProductImage';
import { useCart } from '@/context/CartContext';
import type { CartLine } from '@/lib/cart';
import { formatUSD } from '@/lib/currency';
import QuantityStepper from './QuantityStepper';

export default function CartLineItem({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const { setQuantity, removeItem, closeDrawer } = useCart();
  const href = line.tipo === 'producto' ? `/producto/${encodeURIComponent(line.slug || line.productId)}` : '/ofertas';
  const details = [
    line.color && { label: 'Color', value: line.color },
    line.talla && { label: 'Talla', value: line.talla },
    line.opcion && { label: line.opcionNombre || 'Opción', value: line.opcion },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <article className={`cart-line ${compact ? 'cart-line-compact' : ''}`}>
      <Link href={href} className="cart-line-media" onClick={closeDrawer} tabIndex={-1} aria-hidden="true">
        <ProductImage src={line.imagen} alt="" />
      </Link>
      <div className="cart-line-info">
        <div className="cart-line-top">
          <div>
            {line.tipo === 'promocion' && <span className="cart-line-kind">Promoción</span>}
            <Link href={href} className="cart-line-name" onClick={closeDrawer}>
              {line.nombre}
            </Link>
            {details.length > 0 && (
              <ul className="cart-line-details">
                {details.map((detail) => (
                  <li key={detail.label}>
                    {detail.label === 'Color' && line.colorHex && (
                      <span className="mini-swatch" style={{ background: line.colorHex }} aria-hidden="true" />
                    )}
                    <span>
                      {detail.label}: <strong>{detail.value}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {line.sku && !compact && <small className="cart-line-sku">SKU {line.sku}</small>}
          </div>
          <button
            type="button"
            className="cart-line-remove"
            onClick={() => removeItem(line.key)}
            aria-label={`Eliminar ${line.nombre} del carrito`}
          >
            <Icon name="trash" size={17} />
          </button>
        </div>
        <div className="cart-line-bottom">
          <QuantityStepper
            size="sm"
            value={line.cantidad}
            max={line.maxStock}
            onChange={(value) => setQuantity(line.key, value)}
            label={`Cantidad de ${line.nombre}`}
          />
          <div className="cart-line-price">
            <Price amount={line.precio * line.cantidad} size="sm" showBs={!compact} />
            {line.cantidad > 1 && <small>{formatUSD(line.precio)} c/u</small>}
          </div>
        </div>
        {line.cantidad >= line.maxStock && line.tipo === 'producto' && (
          <p className="cart-line-limit">
            <Icon name="info" size={13} /> Máximo disponible: {line.maxStock}
          </p>
        )}
      </div>
    </article>
  );
}
