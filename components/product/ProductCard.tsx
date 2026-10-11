'use client';

import Link from 'next/link';
import type { Product } from '@/types';
import Icon from '@/components/Icons';
import Price from '@/components/Price';
import ProductImage from '@/components/ProductImage';
import { useCart } from '@/context/CartContext';
import { lineFromProduct } from '@/lib/cart';
import {
  comparePrice,
  hasVariants,
  isInStock,
  priceRange,
  productColors,
  productGallery,
  productSizes,
  productUrl,
  totalStock,
} from '@/lib/product';
import ColorSwatch from './ColorSwatch';
import ProductBadges from './ProductBadges';

const MAX_SWATCHES = 4;
const LOW_STOCK = 3;

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { addItem } = useCart();
  const href = productUrl(product);
  const gallery = productGallery(product);
  const secondImage = gallery.find((url) => url !== product.imagen);
  const inStock = isInStock(product);
  const withVariants = hasVariants(product);
  const range = priceRange(product);
  const colors = productColors(product);
  const sizes = productSizes(product);
  const stock = totalStock(product);
  const brandLine = product.marca || product.subcategoria || product.categoria;

  // Una sola línea de detalle: colores y tallas, o la presentación.
  const details: string[] = [];
  if (colors.length > 1) details.push(`${colors.length} colores`);
  else if (colors.length === 1) details.push(colors[0].nombre);
  if (sizes.length) details.push(sizes.length <= 4 ? sizes.join(', ') : `${sizes[0]} a ${sizes[sizes.length - 1]}`);
  if (!withVariants && product.presentacion) details.push(product.presentacion);

  return (
    <article className={`product-card ${inStock ? '' : 'is-sold-out'}`}>
      <div className="product-card-media">
        <Link href={href} className="product-card-media-link" tabIndex={-1} aria-hidden="true">
          <ProductImage src={product.imagen || gallery[0]} alt="" eager={priority} className="primary" />
          {secondImage && product.imagen && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={secondImage} alt="" className="product-image secondary" loading="lazy" />
          )}
        </Link>
        <ProductBadges product={product} price={range.min} single className="product-card-badges" />
        {inStock && !withVariants && (
          <button
            type="button"
            className="card-quick-add"
            onClick={() => addItem(lineFromProduct(product, null), 1)}
            aria-label={`Agregar ${product.nombre} al carrito`}
            title="Agregar al carrito"
          >
            <Icon name="plus" size={20} />
          </button>
        )}
      </div>

      <div className="product-card-body">
        <p className="product-card-brand">{brandLine}</p>
        <h3 className="product-card-title">
          <Link href={href}>{product.nombre}</Link>
        </h3>
        {(details.length > 0 || colors.length > 1) && (
          <div className="product-card-details">
            {colors.length > 1 && (
              <span className="card-swatches" aria-hidden="true">
                {colors.slice(0, MAX_SWATCHES).map((color) => (
                  <ColorSwatch key={color.nombre} nombre={color.nombre} hex={color.hex} size="xs" />
                ))}
              </span>
            )}
            <span className="card-detail-text">{details.join(' · ')}</span>
          </div>
        )}
        <div className="product-card-price">
          <Price
            amount={range.min}
            compareAt={range.min === range.max ? comparePrice(product, range.min) : 0}
            prefix={range.min !== range.max ? 'Desde' : undefined}
            size="md"
          />
          {inStock && stock > 0 && stock <= LOW_STOCK && (
            <span className="low-stock">
              {stock === 1 ? 'Queda 1' : `Quedan ${stock}`}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card product-card-skeleton" aria-hidden="true">
      <div className="product-card-media skeleton" />
      <div className="product-card-body">
        <span className="skeleton skeleton-line short" />
        <span className="skeleton skeleton-line" />
        <span className="skeleton skeleton-line medium" />
        <span className="skeleton skeleton-line short" />
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  loading = false,
  skeletons = 8,
  className = '',
}: {
  products: Product[];
  loading?: boolean;
  skeletons?: number;
  className?: string;
}) {
  return (
    <div className={`product-grid ${className}`}>
      {loading
        ? Array.from({ length: skeletons }, (_, index) => <ProductCardSkeleton key={index} />)
        : products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 4} />)}
    </div>
  );
}
