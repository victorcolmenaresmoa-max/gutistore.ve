'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { Product } from '@/types';
import CategoryArt from '@/components/CategoryArt';
import Icon from '@/components/Icons';
import ProductImage from '@/components/ProductImage';
import { ProductGrid } from '@/components/product/ProductCard';
import PromotionsSection from '@/components/promotions/PromotionsSection';
import SectionHeading from '@/components/ui/SectionHeading';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useCurrency } from '@/context/CurrencyContext';
import { useCategories, useProducts } from '@/hooks/useStoreData';
import { buildStoreCategories, categoryArtKind, StoreCategory } from '@/lib/categories';
import { categoryHref } from '@/lib/catalog';
import { formatBs, formatUSD, hasRate } from '@/lib/currency';
import { DELIVERY_METHODS, PAYMENT_METHODS } from '@/lib/orders';
import { comparePrice, isInStock, isOnSale, priceRange, productUrl } from '@/lib/product';
import { normalizeText } from '@/lib/text';

const STEPS = [
  { title: 'Arma tu carrito', text: 'Elige productos, tallas y colores. Ves el precio en dólares y en bolívares.' },
  { title: 'Registra el pedido', text: 'Solo te pedimos nombre, WhatsApp y dónde lo quieres recibir. No se cobra nada en línea.' },
  { title: 'Confirmamos por WhatsApp', text: 'Un asesor te escribe para confirmar disponibilidad, forma de pago y entrega.' },
];

const FAQ = [
  {
    q: '¿Tengo que pagar al hacer el pedido?',
    a: 'No. La tienda no cobra en línea. Un asesor te contacta para confirmar disponibilidad y coordinar el método de pago que prefieras.',
  },
  {
    q: '¿En qué moneda están los precios?',
    a: 'Los precios están en dólares (USD). Cuando hay una tasa configurada, también verás su equivalente en bolívares (Bs).',
  },
  {
    q: '¿Cómo recibo mis productos?',
    a: 'Puedes elegir envío a domicilio, agencia de encomiendas o retiro coordinado. El costo y los tiempos se confirman con tu asesor.',
  },
  {
    q: '¿Qué pasa si una talla o color se agota?',
    a: 'La tienda solo te deja elegir combinaciones con stock. Si algo cambia antes de confirmar, tu asesor te ofrecerá alternativas.',
  },
];

/* ---------- Vitrina del hero: productos reales con su etiqueta de precio ---------- */

function PriceTag({ product }: { product: Product }) {
  const { rate } = useCurrency();
  const { min, max } = priceRange(product);
  const compare = min === max ? comparePrice(product, min) : 0;
  return (
    <span className="price-tag" aria-hidden="true">
      <span className="price-tag-hole" />
      {compare > min && <s>{formatUSD(compare)}</s>}
      <strong>
        {min !== max && <small>desde </small>}
        {formatUSD(min)}
      </strong>
      {hasRate(rate) && <span>{formatBs(min, rate)}</span>}
    </span>
  );
}

function Showcase({ products }: { products: Product[] }) {
  return (
    <ul className="showcase" aria-label="Productos destacados">
      {products.map((product, index) => (
        <li key={product.id} className={`showcase-item showcase-item-${index + 1}`}>
          <Link href={productUrl(product)} className="showcase-link">
            <span className="showcase-media">
              <ProductImage src={product.imagen} alt="" eager />
            </span>
            <span className="showcase-name">{product.nombre}</span>
            <PriceTag product={product} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Categorías ---------- */

function CategoryTile({ category, cover }: { category: StoreCategory; cover: string }) {
  const image = category.imagen || cover;
  return (
    <Link href={categoryHref(category.nombre)} className="category-tile">
      <span className="category-tile-media">
        {image ? <ProductImage src={image} alt="" /> : <CategoryArt kind={categoryArtKind(category.nombre)} />}
      </span>
      <span className="category-tile-name">{category.nombre}</span>
      <span className="category-tile-count">
        {category.count} producto{category.count === 1 ? '' : 's'}
      </span>
    </Link>
  );
}

function Rail({ id, title, href, products, loading }: { id: string; title: string; href: string; products: Product[]; loading: boolean }) {
  if (!loading && products.length === 0) return null;
  return (
    <section className="section" aria-labelledby={`${id}-title`}>
      <div className="container">
        <SectionHeading id={`${id}-title`} title={title} href={href} />
        <ProductGrid products={products} loading={loading} skeletons={4} className="product-grid-rail" />
      </div>
    </section>
  );
}

export default function HomeView() {
  const { data: products, loading, error, reload } = useProducts();
  const categories = useCategories();
  const storeCategories = useMemo(() => buildStoreCategories(products, categories.data), [products, categories.data]);

  const { showcase, featured, onSale, fresh, covers } = useMemo(() => {
    const available = products.filter(isInStock);
    const withImage = available.filter((p) => p.imagen);
    const showcaseList = [
      ...withImage.filter((p) => p.destacado),
      ...withImage.filter((p) => !p.destacado),
    ].slice(0, 3);

    const featuredList = available.filter((p) => p.destacado).slice(0, 8);
    const used = new Set(featuredList.map((p) => p.id));
    const saleList = available.filter((p) => isOnSale(p) && !used.has(p.id)).slice(0, 8);
    saleList.forEach((p) => used.add(p.id));
    const byDate = [...available].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
    const newList = (available.some((p) => p.nuevo) ? available.filter((p) => p.nuevo) : byDate)
      .filter((p) => !used.has(p.id))
      .slice(0, 8);

    // Portada de cada categoría: la foto de su primer producto destacado (o cualquiera).
    const coverMap = new Map<string, string>();
    [...withImage.filter((p) => p.destacado), ...withImage].forEach((p) => {
      const key = normalizeText(p.categoria);
      if (!coverMap.has(key)) coverMap.set(key, p.imagen);
    });

    return { showcase: showcaseList, featured: featuredList, onSale: saleList, fresh: newList, covers: coverMap };
  }, [products]);

  const hasShowcase = showcase.length >= 2;

  return (
    <>
      {/* ============ PORTADA ============ */}
      <section className={`hero ${hasShowcase ? 'has-showcase' : ''}`} aria-labelledby="hero-title">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1 id="hero-title">Entrena, viste y vive a tu ritmo.</h1>
            <p>
              Suplementos, ropa deportiva y accesorios. Haces tu pedido aquí y un asesor te escribe por WhatsApp para
              confirmar el pago y la entrega.
            </p>
            <div className="hero-actions">
              <Link href="/tienda" className="btn btn-primary btn-lg">
                Ver la tienda
              </Link>
              <Link href="/ofertas" className="btn btn-ghost-light btn-lg">
                Ofertas
              </Link>
            </div>
          </div>

          {hasShowcase ? (
            <Showcase products={showcase} />
          ) : (
            !loading &&
            storeCategories.length > 0 && (
              <nav className="hero-categories" aria-label="Categorías">
                {storeCategories.slice(0, 6).map((category) => (
                  <Link key={category.nombre} href={categoryHref(category.nombre)}>
                    <span>{category.nombre}</span>
                    <small>{category.count}</small>
                  </Link>
                ))}
              </nav>
            )
          )}
        </div>
      </section>

      {/* ============ CATEGORÍAS ============ */}
      <section className="section" aria-labelledby="categories-title">
        <div className="container">
          <SectionHeading id="categories-title" title="Compra por categoría" href="/tienda" linkLabel="Toda la tienda" />
          {error && !products.length ? (
            <ErrorState message={error} onRetry={reload} />
          ) : loading ? (
            <div className="category-row" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <div className="category-tile" key={index}>
                  <span className="category-tile-media skeleton" />
                  <span className="skeleton skeleton-line short" />
                </div>
              ))}
            </div>
          ) : storeCategories.length === 0 ? (
            <EmptyState icon="package" title="Estamos preparando el catálogo" description="Muy pronto encontrarás aquí todas nuestras categorías." />
          ) : (
            <div className="category-row">
              {storeCategories.map((category) => (
                <CategoryTile key={category.nombre} category={category} cover={covers.get(normalizeText(category.nombre)) || ''} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Rail id="featured" title="Destacados" href="/tienda?destacado=1" products={featured} loading={loading} />

      <PromotionsSection limit={3} />

      <Rail id="sale" title="En oferta" href="/ofertas" products={onSale} loading={loading} />
      <Rail id="new" title="Recién llegados" href="/tienda?orden=recientes" products={fresh} loading={loading} />

      {/* ============ CÓMO FUNCIONA ============ */}
      <section className="how" id="como-comprar" aria-labelledby="how-title">
        <div className="container how-grid">
          <div className="how-intro">
            <h2 id="how-title">Cómo funciona tu pedido</h2>
            <p>No necesitas tarjeta ni crear una cuenta. Pagas cuando el asesor confirma que todo está listo.</p>
          </div>
          <ol className="how-steps">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="how-step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <dl className="how-facts">
            <div>
              <dt>
                <Icon name="dollar" size={18} /> Formas de pago
              </dt>
              <dd>{PAYMENT_METHODS.filter((method) => !method.startsWith('Por definir')).join(', ')}.</dd>
            </div>
            <div>
              <dt>
                <Icon name="truck" size={18} /> Entrega
              </dt>
              <dd>{DELIVERY_METHODS.join(', ')}.</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ============ PREGUNTAS ============ */}
      <section className="section faq-section" id="preguntas" aria-labelledby="faq-title">
        <div className="container faq-grid">
          <h2 id="faq-title">Preguntas frecuentes</h2>
          <div className="faq-list">
            {FAQ.map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>
                  <span>{item.q}</span>
                  <Icon name="plus" size={18} />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
