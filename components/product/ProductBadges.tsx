import type { Product } from '@/types';
import { discountPercent, isInStock, isOnSale } from '@/lib/product';

export default function ProductBadges({ product, price, className = '' }: { product: Product; price?: number; className?: string }) {
  const soldOut = !isInStock(product);
  const discount = discountPercent(product, price ?? product.precio);
  const badges: Array<{ key: string; label: string; tone: string }> = [];

  if (soldOut) badges.push({ key: 'agotado', label: 'Agotado', tone: 'dark' });
  if (isOnSale(product)) badges.push({ key: 'oferta', label: discount > 0 ? `-${discount}%` : 'Oferta', tone: 'red' });
  if (product.nuevo) badges.push({ key: 'nuevo', label: 'Nuevo', tone: 'light' });
  if (product.destacado) badges.push({ key: 'destacado', label: 'Destacado', tone: 'outline' });

  if (!badges.length) return null;
  return (
    <div className={`badges ${className}`}>
      {badges.map((badge) => (
        <span key={badge.key} className={`badge badge-${badge.tone}`}>
          {badge.label}
        </span>
      ))}
    </div>
  );
}
