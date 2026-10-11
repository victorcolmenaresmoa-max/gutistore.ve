import type { Product } from '@/types';
import { discountPercent, isInStock, isOnSale } from '@/lib/product';

export default function ProductBadges({
  product,
  price,
  className = '',
  single = false,
}: {
  product: Product;
  price?: number;
  className?: string;
  /** Solo la etiqueta más importante (para tarjetas). */
  single?: boolean;
}) {
  const soldOut = !isInStock(product);
  const discount = discountPercent(product, price ?? product.precio);
  const badges: Array<{ key: string; label: string; tone: string }> = [];

  if (soldOut) badges.push({ key: 'agotado', label: 'Agotado', tone: 'dark' });
  if (isOnSale(product)) badges.push({ key: 'oferta', label: discount > 0 ? `-${discount}%` : 'Oferta', tone: 'red' });
  if (product.nuevo) badges.push({ key: 'nuevo', label: 'Nuevo', tone: 'light' });
  if (product.destacado && !single) badges.push({ key: 'destacado', label: 'Destacado', tone: 'outline' });

  if (!badges.length) return null;
  const shown = single ? badges.slice(0, 1) : badges;
  return (
    <div className={`badges ${className}`}>
      {shown.map((badge) => (
        <span key={badge.key} className={`badge badge-${badge.tone}`}>
          {badge.label}
        </span>
      ))}
    </div>
  );
}
