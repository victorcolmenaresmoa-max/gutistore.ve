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

const MAX_SWATCHES = 5;
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

  return (
    <article className={`product-card ${inStock ? '' : 'is-sold-out'}`}>
      <Link href={href} className="product-card-media" aria-label={product.nombre}>
        <ProductImage src={product.imagen || gallery[0]} alt={product.nombre} eager={priority} className="primary" />
        {secondImage && product.imagen && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={secondImage} alt="" className="product-image secondary" loading="lazy" aria-hidden="true" />
        )}
        <ProductBadges product={product} price={range.min} className="product-card-badges" />
      </Link>

      <div className="product-card-body">
        <span className="product-card-eyebrow">{brandLine}</span>
        <h3 className="product-card-title">
          <Link href={href}>{product.nombre}</Link>
        </h3>

        <div className="product-card-variants">
          {colors.length > 0 && (
            <div className="card-swatches" aria-label={`Colores: ${colors.map((c) => c.nombre).join(', ')}`}>
              {colors.slice(0, MAX_SWATCHES).map((color) => (
                <span key={color.nombre} title={color.nombre}>
                  <ColorSwatch nombre={color.nombre} hex={color.hex} size="xs" />
                </span>
              ))}
              {colors.length > MAX_SWATCHES && <small>+{colors.length - MAX_SWATCHES}</small>}
            </div>
          )}
          {sizes.length > 0 && (
            <span className="card-sizes">
              {sizes.length <= 4 ? sizes.join(' · ') : `${sizes[0]} – ${sizes[sizes.length - 1]}`}
            </span>
          )}
          {!withVariants && product.presentacion && <span className="card-sizes">{product.presentacion}</span>}
        </div>

        <div className="product-card-footer">
          <div className="product-card-price">
            <Price
              amount={range.min}
              compareAt={range.min === range.max ? comparePrice(product, range.min) : 0}
              prefix={range.min !== range.max ? 'Desde' : undefined}
              size="md"
            />
            {inStock && stock <= LOW_STOCK && <span className="low-stock">¡Últimas {stock}!</span>}
          </div>

          {!inStock ? (
            <span className="card-action is-disabled" aria-disabled="true">
              Sin stock
            </span>
          ) : withVariants ? (
            <Link href={href} className="card-action" aria-label={`Elegir opciones de ${product.nombre}`}>
              <span>Opciones</span>
              <Icon name="arrowRight" size={16} />
            </Link>
          ) : (
            <button
              type="button"
              className="card-action card-action-primary"
              onClick={() => addItem(lineFromProduct(product, null), 1)}
              aria-label={`Agregar ${product.nombre} al carrito`}
            >
              <Icon name="cart" size={17} />
              <span>Agregar</span>
            </button>
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
