'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import Icon from './Icons';
import { formatBs, formatUSD, hasRate } from '@/lib/currency';
import { useCurrency } from '@/context/CurrencyContext';

export default function ProductCard({ product }: { product: Product }) {
  const { rate } = useCurrency();
  const productUrl = `/producto/${encodeURIComponent(product.slug || product.id)}`;
  const hasVariants = Boolean(product.variantes?.length);
  const inStock = product.stock > 0;
  const comparePrice = product.precioAnterior && product.precioAnterior > product.precio ? product.precioAnterior : null;

  return (
    <article className="product-card">
      <Link href={productUrl} className="product-card-link">
        <div className="product-media">
          {product.imagen ? (
            <Image src={product.imagen} alt={product.nombre} fill sizes="(max-width: 700px) 50vw, (max-width: 1200px) 33vw, 280px" />
          ) : (
            <div className="product-placeholder"><Icon name="package" size={42} /></div>
          )}
          {product.categoria && <span className="product-tag">{product.categoria}</span>}
          {product.destacado && <span className="product-featured"><Icon name="sparkles" size={13} /> Destacado</span>}
        </div>

        <div className="product-body">
          <div className="product-card-brand-row">
            <span>{product.marca || product.categoria}</span>
            <span className={inStock ? 'stock-ok' : 'stock-out'}>{inStock ? 'Disponible' : 'Agotado'}</span>
          </div>
          <h3>{product.nombre}</h3>
          <p>{product.descripcionCorta || product.descripcion}</p>
          <div className="product-price-row">
            <div>
              <strong>{formatUSD(product.precio)}</strong>
              {comparePrice && <del>{formatUSD(comparePrice)}</del>}
              {hasRate(rate) && <small>{formatBs(product.precio, rate)}</small>}
            </div>
            {hasVariants && <span>{product.variantes?.length} variantes</span>}
          </div>
        </div>
      </Link>
      <Link href={productUrl} className={`btn btn-card ${!inStock ? 'disabled' : ''}`} aria-disabled={!inStock}>
        {inStock ? 'Ver opciones' : 'Sin stock'} <Icon name="arrowRight" size={15} />
      </Link>
    </article>
  );
}
