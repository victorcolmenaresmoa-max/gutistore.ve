'use client';

import Link from 'next/link';
import { Product } from '@/types';
import Icon from './Icons';
import { formatUSD } from '@/lib/currency';

export default function ProductCard({ product }: { product: Product }) {
  const productUrl = `/producto/${encodeURIComponent(product.id)}`;

  return (
    <article className="product-card">
      <Link href={productUrl} className="product-card-link">
        <div className="product-media">
          <img
            src={
              product.imagen ||
              'https://placehold.co/900x900/5d0a2a/ffffff?text=GutiSupplements'
            }
            alt={product.nombre}
            loading="lazy"
          />
          <div className="product-media-shade" />
          {product.categoria && <span className="product-tag">{product.categoria}</span>}
          {product.destacado && (
            <span className="product-featured">
              <Icon name="sparkles" size={14} /> Destacado
            </span>
          )}
        </div>

        <div className="product-body">
          <div className="product-heading-row">
            <div>
              <h3>{product.nombre}</h3>
              {product.presentacion && <span>{product.presentacion}</span>}
            </div>
            <div className="product-price">{formatUSD(product.precio)}</div>
          </div>

          <p>{product.descripcion}</p>

          <div className="product-meta-row">
            <span className={product.stock > 0 ? 'stock-ok' : 'stock-out'}>
              {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
            </span>
            <span className="details-link">
              Ver detalles <Icon name="arrowRight" size={15} />
            </span>
          </div>
        </div>
      </Link>

      <div className="product-card-action">
        <Link
          href={productUrl}
          className={`btn btn-primary btn-block ${product.stock <= 0 ? 'disabled' : ''}`}
          aria-disabled={product.stock <= 0}
        >
          <Icon name="arrowRight" size={17} />
          {product.stock <= 0 ? 'Producto agotado' : 'Ver producto y solicitar'}
        </Link>
      </div>
    </article>
  );
}
