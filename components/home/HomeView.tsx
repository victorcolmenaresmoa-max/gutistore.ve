'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { Product } from '@/types';
import CategoryArt from '@/components/CategoryArt';
import Icon, { IconName } from '@/components/Icons';
import ProductImage from '@/components/ProductImage';
import { ProductGrid } from '@/components/product/ProductCard';
import PromotionsSection from '@/components/promotions/PromotionsSection';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useCategories, useProducts } from '@/hooks/useStoreData';
import { buildStoreCategories, categoryArtKind, CategoryArtKind, StoreCategory } from '@/lib/categories';
import { categoryHref } from '@/lib/catalog';
import { isInStock, isOnSale } from '@/lib/product';

const HERO_PILLARS: Array<{ kind: CategoryArtKind; title: string; text: string }> = [
  { kind: 'ropa', title: 'Moda', text: 'Ropa deportiva y urbana' },
  { kind: 'calzado', title: 'Fitness', text: 'Calzado y equipo para entrenar' },
  { kind: 'lentes', title: 'Accesorios', text: 'Lentes, gorras y bolsos' },
  { kind: 'suplementos', title: 'Bienestar', text: 'Suplementos e hidratación' },
];

const MARQUEE = ['Ropa', 'Calzado', 'Lentes', 'Accesorios', 'Hidratación', 'Suplementos', 'Gym'];

const BENEFITS: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'shield', title: 'Sin pagos en línea', text: 'Registras tu pedido y pagas solo cuando todo está confirmado.' },
  { icon: 'message', title: 'Asesor personal', text: 'Te contactamos para confirmar disponibilidad, talla y detalles.' },
  { icon: 'dollar', title: 'USD y bolívares', text: 'Precios en dólares con su equivalente en Bs según la tasa vigente.' },
  { icon: 'truck', title: 'Entrega a tu medida', text: 'A domicilio, por agencia de encomiendas o retiro coordinado.' },
];

const STEPS = [
  { title: 'Elige', text: 'Explora la tienda y selecciona talla, color u opción.' },
  { title: 'Agrega', text: 'Suma todo lo que quieras a tu carrito.' },
  { title: 'Registra', text: 'Completa tus datos de contacto y entrega.' },
  { title: 'Confirma', text: 'Un asesor te escribe para coordinar pago y envío.' },
];

const FAQ = [
  {
    q: '¿Cómo hago un pedido?',
    a: 'Agrega los productos a tu carrito, elige talla, color u opción cuando corresponda y completa el formulario del checkout. Tu pedido queda registrado al instante.',
  },
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

function CategoryCard({ category }: { category: StoreCategory }) {
  return (
    <Link href={categoryHref(category.nombre)} className="category-card">
      <span className="category-card-media">
        {category.imagen ? (
          <ProductImage src={category.imagen} alt="" />
        ) : (
          <CategoryArt kind={categoryArtKind(category.nombre)} />
        )}
      </span>
      <span className="category-card-copy">
        <strong>{category.nombre}</strong>
        <small>
          {category.count} producto{category.count === 1 ? '' : 's'}
        </small>
      </span>
      <span className="category-card-arrow" aria-hidden="true">
        <Icon name="arrowRight" size={18} />
      </span>
    </Link>
  );
}

function Rail({
  id,
  eyebrow,
  title,
  href,
  products,
  loading,
}: {
  id: string;
  eyebrow: string;
  title: string;
  href: string;
  products: Product[];
  loading: boolean;
}) {
  if (!loading && products.length === 0) return null;
  return (
    <section className="section" aria-labelledby={`${id}-title`}>
      <div className="container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2 id={`${id}-title`}>{title}</h2>
          </div>
          <Link href={href} className="btn btn-outline-dark btn-sm">
            Ver todo <Icon name="arrowRight" size={15} />
          </Link>
        </div>
        <ProductGrid products={products} loading={loading} skeletons={4} className="product-grid-rail" />
      </div>
    </section>
  );
}

export default function HomeView() {
  const { data: products, loading, error, reload } = useProducts();
  const categories = useCategories();
  const storeCategories = useMemo(() => buildStoreCategories(products, categories.data), [products, categories.data]);

  const { featured, fresh, picks } = useMemo(() => {
    const available = products.filter(isInStock);
    const featuredList = available.filter((p) => p.destacado).slice(0, 8);
    const byDate = [...available].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
    const newList = (available.some((p) => p.nuevo) ? available.filter((p) => p.nuevo) : byDate).slice(0, 8);
    const used = new Set([...featuredList, ...newList].map((p) => p.id));
    const pickList = [
      ...available.filter((p) => !used.has(p.id) && isOnSale(p)),
      ...available.filter((p) => !used.has(p.id) && !isOnSale(p)),
    ].slice(0, 8);
    return { featured: featuredList, fresh: newList, picks: pickList };
  }, [products]);

  const pillarLink = (kind: CategoryArtKind) => {
    const match = storeCategories.find((category) => categoryArtKind(category.nombre) === kind);
    return match ? categoryHref(match.nombre) : '/tienda';
  };

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-kicker">
              <span className="hero-kicker-dot" /> Moda · Fitness · Accesorios · Bienestar
            </span>
            <h1 id="hero-title">
              Entrena, viste y vive <em>a tu ritmo.</em>
            </h1>
            <p>
              Ropa deportiva, calzado, lentes, accesorios y suplementos seleccionados. Pides en minutos y un asesor
              confirma todo contigo.
            </p>
            <div className="hero-actions">
              <Link href="/tienda" className="btn btn-primary btn-lg">
                Comprar ahora <Icon name="arrowRight" size={18} />
              </Link>
              <Link href="/ofertas" className="btn btn-ghost-light btn-lg">
                Ver ofertas
              </Link>
            </div>
            <ul className="hero-trust">
              <li>
                <Icon name="shield" size={17} /> Sin pagos en línea
              </li>
              <li>
                <Icon name="dollar" size={17} /> Precios en USD y Bs
              </li>
              <li>
                <Icon name="truck" size={17} /> Entrega coordinada
              </li>
            </ul>
          </div>

          <div className="hero-visual">
            <div className="hero-bento">
              {HERO_PILLARS.map((pillar, index) => (
                <Link key={pillar.title} href={pillarLink(pillar.kind)} className={`hero-tile hero-tile-${index + 1}`}>
                  <CategoryArt kind={pillar.kind} />
                  <span className="hero-tile-copy">
                    <strong>{pillar.title}</strong>
                    <small>{pillar.text}</small>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-marquee" aria-hidden="true">
          <div className="hero-marquee-track">
            {[0, 1].map((copy) => (
              <div className="hero-marquee-group" key={copy}>
                {MARQUEE.map((word) => (
                  <span key={`${copy}-${word}`}>
                    {word}
                    <i />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CATEGORÍAS ============ */}
      <section className="section categories-section" aria-labelledby="categories-title">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Explora</span>
              <h2 id="categories-title">Compra por categoría</h2>
            </div>
            <Link href="/tienda" className="btn btn-outline-dark btn-sm">
              Toda la tienda <Icon name="arrowRight" size={15} />
            </Link>
          </div>
          {error && !products.length ? (
            <ErrorState message={error} onRetry={reload} />
          ) : loading ? (
            <div className="category-grid" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <div className="category-card skeleton" key={index} />
              ))}
            </div>
          ) : storeCategories.length === 0 ? (
            <EmptyState icon="package" title="Estamos preparando el catálogo" description="Muy pronto encontrarás aquí todas nuestras categorías." />
          ) : (
            <div className="category-grid">
              {storeCategories.map((category) => (
                <CategoryCard key={category.nombre} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Rail id="featured" eyebrow="Lo mejor de GutiStore" title="Destacados" href="/tienda?destacado=1" products={featured} loading={loading} />
      <Rail id="new" eyebrow="Recién llegados" title="Novedades" href="/tienda?orden=recientes" products={fresh} loading={loading} />

      <PromotionsSection limit={3} />

      {/* ============ LIFESTYLE ============ */}
      <section className="lifestyle" aria-labelledby="lifestyle-title">
        <div className="container lifestyle-inner">
          <div className="lifestyle-copy">
            <span className="eyebrow eyebrow-light">Una sola tienda, todo tu día</span>
            <h2 id="lifestyle-title" className="lifestyle-title">
              <span>Entrena.</span>
              <span>Viste.</span>
              <span className="accent">Vive.</span>
            </h2>
          </div>
          <div className="lifestyle-cards">
            <Link href={pillarLink('ropa')} className="lifestyle-card">
              <CategoryArt kind="ropa" />
              <strong>Estilo</strong>
              <p>Prendas cómodas que funcionan dentro y fuera del gym.</p>
            </Link>
            <Link href={pillarLink('accesorios')} className="lifestyle-card">
              <CategoryArt kind="accesorios" />
              <strong>Entrenamiento</strong>
              <p>Calzado, accesorios e hidratación para cada sesión.</p>
            </Link>
            <Link href={pillarLink('suplementos')} className="lifestyle-card">
              <CategoryArt kind="suplementos" />
              <strong>Bienestar</strong>
              <p>Suplementos seleccionados para acompañar tu rutina.</p>
            </Link>
          </div>
        </div>
      </section>

      <Rail id="picks" eyebrow="Selección GutiStore" title="Recomendados" href="/tienda" products={picks} loading={loading} />

      {/* ============ BENEFICIOS ============ */}
      <section className="section benefits-section" aria-labelledby="benefits-title">
        <div className="container">
          <div className="section-heading center">
            <div>
              <span className="eyebrow">Compra con tranquilidad</span>
              <h2 id="benefits-title">Por qué comprar en GutiStore</h2>
            </div>
          </div>
          <div className="benefits-grid">
            {BENEFITS.map((benefit) => (
              <article className="benefit-card" key={benefit.title}>
                <span className="benefit-icon">
                  <Icon name={benefit.icon} size={22} />
                </span>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CÓMO COMPRAR ============ */}
      <section className="section steps-section" id="como-comprar" aria-labelledby="steps-title">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Así de simple</span>
              <h2 id="steps-title">Cómo comprar</h2>
            </div>
          </div>
          <ol className="steps-grid">
            {STEPS.map((step, index) => (
              <li className="step-card" key={step.title}>
                <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="cta-band" aria-labelledby="cta-title">
        <div className="container cta-inner">
          <div>
            <h2 id="cta-title">Arma tu pedido hoy</h2>
            <p>Elige lo que necesitas y nosotros coordinamos el resto contigo.</p>
          </div>
          <div className="cta-actions">
            <Link href="/tienda" className="btn btn-light btn-lg">
              Ir a la tienda <Icon name="arrowRight" size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="section faq-section" id="preguntas" aria-labelledby="faq-title">
        <div className="container faq-grid">
          <div className="faq-intro">
            <span className="eyebrow">Preguntas frecuentes</span>
            <h2 id="faq-title">Resolvemos tus dudas</h2>
            <p>Lo esencial sobre pedidos, pagos y entregas en GutiStore.</p>
          </div>
          <div className="faq-list">
            {FAQ.map((item, index) => (
              <details className="faq-item" key={item.q} open={index === 0}>
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
