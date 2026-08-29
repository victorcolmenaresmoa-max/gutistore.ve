'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CategoryCard from '@/components/CategoryCard';
import ProductCard from '@/components/ProductCard';
import PromotionCard from '@/components/PromotionCard';
import Loader from '@/components/Loader';
import Icon from '@/components/Icons';
import { getCategories, getProducts, getPromotions } from '@/lib/api';
import type { Category, Product, Promotion } from '@/types';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const [categoryResponse, productResponse, promotionResponse] = await Promise.all([
        getCategories(), getProducts(), getPromotions(),
      ]);
      if (!active) return;
      if (categoryResponse.ok && categoryResponse.data) setCategories(categoryResponse.data);
      if (productResponse.ok && productResponse.data) setProducts(productResponse.data);
      else setError(productResponse.message || 'No pudimos cargar la tienda.');
      if (promotionResponse.ok && promotionResponse.data) setPromotions(promotionResponse.data);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const featuredCategories = useMemo(() => {
    const featured = categories.filter((category) => category.isFeatured);
    return (featured.length ? featured : categories).slice(0, 6);
  }, [categories]);

  const featuredProducts = useMemo(() => products.filter((product) => product.destacado).slice(0, 8), [products]);

  const newestProducts = useMemo(() => products.filter((product) => !featuredProducts.some((featured) => featured.id === product.id)).slice(0, 4), [products, featuredProducts]);
  const heroImages = products.filter((product) => product.imagen).slice(0, 4);

  return (
    <>
      <Navbar />
      <main>
        <section className="store-hero">
          <div className="container store-hero-grid">
            <div className="store-hero-copy">
              <span className="hero-kicker"><Icon name="sparkles" size={14} /> Una tienda. Muchas posibilidades.</span>
              <h1>Encuentra lo que buscas en <span>GutiStore.</span></h1>
              <p>Suplementos, moda, accesorios y nuevas categorías en una experiencia de compra simple, moderna y pensada para móvil.</p>
              <div className="hero-actions">
                <Link href="/productos" className="btn btn-primary btn-lg">Explorar productos <Icon name="arrowRight" size={18} /></Link>
                <a href="#categorias" className="btn btn-outline btn-lg">Ver categorías</a>
              </div>
              <div className="hero-benefits-inline">
                <span><Icon name="shield" size={17} /> Compra clara</span>
                <span><Icon name="message" size={17} /> Atención personalizada</span>
                <span><Icon name="truck" size={17} /> Entrega coordinada</span>
              </div>
            </div>

            <div className="store-hero-visual">
              <div className="hero-logo-panel">
                <div className="hero-brand-composition">
                  <Image src="/guti-store-mark.jpg" alt="" width={360} height={330} priority className="hero-brand-mark" />
                  <Image src="/guti-store-wordmark-compact.jpg" alt="GutiStore" width={800} height={150} priority className="hero-brand-wordmark" />
                  <span>Suplementos · Moda · Accesorios · Más</span>
                </div>
              </div>
              {heroImages.length > 0 && (
                <div className="hero-product-stack" aria-label="Productos disponibles">
                  {heroImages.map((product, index) => (
                    <Link href={`/producto/${product.slug || product.id}`} key={product.id} className={`hero-mini-product hero-mini-${index + 1}`}>
                      <Image src={product.imagen} alt={product.nombre} fill sizes="150px" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="benefit-strip">
          <div className="container benefit-strip-grid">
            <article><Icon name="products" size={22} /><div><strong>Catálogo multirubro</strong><span>Categorías que crecen con la tienda.</span></div></article>
            <article><Icon name="bag" size={22} /><div><strong>Compra sencilla</strong><span>Variantes y detalles claros antes de pedir.</span></div></article>
            <article><Icon name="shield" size={22} /><div><strong>Datos consistentes</strong><span>Tu pedido conserva exactamente lo seleccionado.</span></div></article>
          </div>
        </section>

        <section className="section" id="categorias">
          <div className="container">
            <div className="section-heading split-heading">
              <div><span className="eyebrow">Explora por categoría</span><h2>Todo organizado para encontrarlo rápido.</h2><p>Las categorías se actualizan automáticamente desde el panel administrativo.</p></div>
              <Link href="/productos" className="text-link">Ver catálogo completo <Icon name="arrowRight" size={16} /></Link>
            </div>
            {loading ? <Loader label="Cargando categorías..." /> : featuredCategories.length ? (
              <div className="category-grid">{featuredCategories.map((category) => <CategoryCard category={category} key={category.id} />)}</div>
            ) : (
              <div className="state-card compact-state"><Icon name="layers" size={28} /><h3>Aún no hay categorías publicadas</h3><p>Cuando el administrador active categorías, aparecerán aquí automáticamente.</p></div>
            )}
          </div>
        </section>

        <section className="section section-soft" id="destacados">
          <div className="container">
            <div className="section-heading split-heading">
              <div><span className="eyebrow">Selección GutiStore</span><h2>Productos destacados</h2><p>Una selección administrable de productos que quieres poner en primer plano.</p></div>
              <Link href="/productos" className="text-link">Todos los productos <Icon name="arrowRight" size={16} /></Link>
            </div>
            {loading ? <Loader label="Cargando productos..." /> : error ? (
              <div className="state-card error-state"><h3>No pudimos cargar los productos</h3><p>{error}</p></div>
            ) : featuredProducts.length ? (
              <div className="grid-products">{featuredProducts.map((product) => <ProductCard product={product} key={product.id} />)}</div>
            ) : (
              <div className="state-card compact-state"><Icon name="package" size={28} /><h3>Aún no hay productos destacados</h3><p>Marca productos como destacados desde el panel administrativo para mostrarlos aquí.</p></div>
            )}
          </div>
        </section>

        {promotions.length > 0 && (
          <section className="section promotions-home">
            <div className="container">
              <div className="section-heading"><span className="eyebrow">Promociones</span><h2>Oportunidades para aprovechar</h2><p>Ofertas activas configuradas desde el panel administrativo.</p></div>
              <div className="promotion-grid">{promotions.slice(0, 3).map((promotion) => <PromotionCard promotion={promotion} key={promotion.id} />)}</div>
            </div>
          </section>
        )}

        {newestProducts.length > 0 && (
          <section className="section section-compact">
            <div className="container">
              <div className="section-heading split-heading"><div><span className="eyebrow">Recién agregados</span><h2>Nuevos en GutiStore</h2></div><Link href="/productos" className="text-link">Explorar más <Icon name="arrowRight" size={16} /></Link></div>
              <div className="grid-products">{newestProducts.map((product) => <ProductCard product={product} key={product.id} />)}</div>
            </div>
          </section>
        )}

        <section className="section trust-section">
          <div className="container trust-card">
            <div><span className="eyebrow">Una experiencia simple</span><h2>Compra con claridad desde el primer clic.</h2><p>Revisa opciones, selecciona variantes, arma tu carrito y registra tu pedido sin perder de vista ningún detalle.</p><Link href="/productos" className="btn btn-primary">Empezar a explorar</Link></div>
            <div className="trust-points">
              <span><Icon name="check" size={18} /><b>Productos seleccionados</b><small>Información organizada y fácil de comparar.</small></span>
              <span><Icon name="check" size={18} /><b>Atención personalizada</b><small>Confirmación y seguimiento del pedido.</small></span>
              <span><Icon name="check" size={18} /><b>Entrega coordinada</b><small>El método se define claramente en checkout.</small></span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
