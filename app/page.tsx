'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import PromotionsSection from '@/components/PromotionsSection';
import Loader from '@/components/Loader';
import HeroProductMarquee from '@/components/HeroProductMarquee';
import Icon from '@/components/Icons';
import { getProducts } from '@/lib/api';
import { FALLBACK_PRODUCTS } from '@/lib/fallbackProducts';
import { Product } from '@/types';

const BENEFITS = [
  { icon: 'award', title: 'Selección curada', text: 'Cada producto se elige por su calidad, pureza y respaldo de fabricante.' },
  { icon: 'message', title: 'Asesoría real', text: 'Un asesor revisa tu solicitud y resuelve tus dudas antes de confirmar.' },
  { icon: 'shield', title: 'Compra segura', text: 'Sin cobros automáticos: confirmas stock y detalles antes de pagar.' },
  { icon: 'truck', title: 'Entrega coordinada', text: 'Validamos ubicación y método de envío contigo, paso a paso.' },
  { icon: 'droplet', title: 'Info transparente', text: 'Ingredientes, modo de uso y presentación siempre a la vista.' },
  { icon: 'whatsapp', title: 'Contacto directo', text: 'Recibes confirmación y seguimiento cómodamente por WhatsApp.' },
] as const;

const STATS = [
  { icon: 'users', value: '1.2K+', label: 'Clientes acompañados' },
  { icon: 'package', value: '40+', label: 'Referencias en catálogo' },
  { icon: 'star', value: '4.9', label: 'Valoración promedio' },
  { icon: 'refresh', value: '24 h', label: 'Respuesta típica' },
] as const;

const TESTIMONIALS = [
  {
    avatar: '/art/avatar-1.svg',
    name: 'María G.',
    role: 'Rutina de fuerza',
    quote: 'Me ayudaron a elegir la proteína correcta y confirmaron todo antes de pagar. La atención marcó la diferencia.',
  },
  {
    avatar: '/art/avatar-2.svg',
    name: 'Carlos M.',
    role: 'Cliente frecuente',
    quote: 'El catálogo tiene toda la información que necesito. Pedir es rápido y siempre recibo seguimiento por WhatsApp.',
  },
  {
    avatar: '/art/avatar-3.svg',
    name: 'Lucía R.',
    role: 'Primera compra',
    quote: 'Tenía dudas sobre qué me convenía y me guiaron con paciencia. Producto original y entrega coordinada sin sorpresas.',
  },
];

const FAQ = [
  { q: '¿Cómo realizo un pedido?', a: 'Explora el catálogo, entra al producto que te interesa y envía una solicitud con tus datos esenciales. Nuestro equipo la recibe y te contacta para confirmar.' },
  { q: '¿Debo pagar al momento de solicitar?', a: 'No. Primero confirmamos disponibilidad y los detalles de entrega contigo. El pago se coordina una vez que todo está claro.' },
  { q: '¿En qué moneda están los precios?', a: 'Los precios se muestran en USD y también en bolívares (Bs) según la tasa vigente. Aceptamos pago en dólares y en bolívares; el método se coordina con tu asesor al confirmar.' },
  { q: '¿Cómo recibo mi confirmación?', a: 'Te contactamos por WhatsApp con la información preparada: stock, total y método de entrega acordado.' },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      const response = await getProducts();
      if (!active) return;

      setProducts(
        response.ok && response.data && response.data.length > 0
          ? response.data
          : FALLBACK_PRODUCTS
      );
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const values = new Set(products.map((product) => product.categoria).filter(Boolean));
    return ['Todos', ...Array.from(values)];
  }, [products]);

  const featured = useMemo(
    () => products.filter((product) => product.destacado).slice(0, 3),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = filter === 'Todos' || product.categoria === filter;
      const matchesSearch =
        !normalizedSearch ||
        product.nombre.toLowerCase().includes(normalizedSearch) ||
        product.descripcion.toLowerCase().includes(normalizedSearch) ||
        product.categoria.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [products, filter, search]);



  return (
    <>
      <Navbar />
      <main>
        {/* ============ HERO ============ */}
        <section className="hero" id="inicio">
          <div className="hero-orb hero-orb-one" />
          <div className="hero-orb hero-orb-two" />
          <div className="container hero-grid">
            <div className="hero-content">
              <span className="hero-badge">
                <Icon name="sparkles" size={15} /> Selección premium de suplementos
              </span>
              <h1>
                Tu progreso merece una elección <em>más inteligente.</em>
              </h1>
              <p>
                Descubre productos cuidadosamente seleccionados y recibe atención
                personalizada para construir un pedido alineado con tus objetivos.
              </p>
              <div className="hero-actions">
                <a href="#catalogo" className="btn btn-primary btn-lg">
                  Explorar catálogo <Icon name="arrowRight" size={18} />
                </a>
                <a href="#asesoria" className="btn btn-outline btn-lg">
                  Conocer la experiencia
                </a>
              </div>

              <div className="hero-rating">
                <div className="hero-stars" aria-hidden="true">
                  <Icon name="star" size={16} /><Icon name="star" size={16} />
                  <Icon name="star" size={16} /><Icon name="star" size={16} />
                  <Icon name="star" size={16} />
                </div>
                <span><strong>4.9/5</strong> · +1.200 clientes acompañados</span>
              </div>

              <div className="hero-trust-row">
                <span><Icon name="shield" size={18} /> Atención segura</span>
                <span><Icon name="message" size={18} /> Confirmación personal</span>
                <span><Icon name="dollar" size={18} /> Precios en USD y Bs</span>
              </div>
            </div>

            <div className="hero-visual" aria-label="GutiSupplements">
              <div className="hero-stage">
                <HeroProductMarquee columns={3} speedSeconds={34} />
                <img className="hero-float-seal" src="/art/seal.svg" alt="Sello de calidad" />
              </div>
              <div className="hero-floating-benefits">
                <div className="floating-card floating-card-top">
                  <span className="floating-icon"><Icon name="shield" size={19} /></span>
                  <div><strong>Compra acompañada</strong><small>Confirmamos cada detalle</small></div>
                </div>
                <div className="floating-card floating-card-bottom">
                  <span className="floating-icon"><Icon name="package" size={19} /></span>
                  <div><strong>Catálogo curado</strong><small>Información amplia y clara</small></div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-marquee" aria-hidden="true">
            <div className="hero-marquee-track">
              {[0, 1].map((dup) => (
                <div className="hero-marquee-group" key={dup}>
                  <span><Icon name="award" size={15} /> Calidad garantizada</span>
                  <span><Icon name="truck" size={15} /> Entrega coordinada</span>
                  <span><Icon name="whatsapp" size={15} /> Soporte por WhatsApp</span>
                  <span><Icon name="shield" size={15} /> Pago sólo al confirmar</span>
                  <span><Icon name="sparkles" size={15} /> Productos originales</span>
                  <span><Icon name="dollar" size={15} /> Precios en USD y Bs</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TRUST STRIP ============ */}
        <section className="trust-strip" id="experiencia">
          <div className="container trust-strip-grid">
            <article>
              <span><Icon name="shield" size={23} /></span>
              <div><strong>Selección responsable</strong><p>Información transparente para elegir con mayor confianza.</p></div>
            </article>
            <article>
              <span><Icon name="message" size={23} /></span>
              <div><strong>Atención personalizada</strong><p>Un asesor revisa tu solicitud antes de confirmar la compra.</p></div>
            </article>
            <article>
              <span><Icon name="truck" size={23} /></span>
              <div><strong>Entrega coordinada</strong><p>Disponibilidad, ubicación y método de envío se validan contigo.</p></div>
            </article>
          </div>
        </section>

        {/* ============ FEATURED PRODUCTS ============ */}
        {featured.length > 0 && (
          <section className="section featured-section">
            <div className="container">
              <div className="section-heading">
                <div>
                  <span className="eyebrow"><Icon name="flame" size={13} /> Los más buscados</span>
                  <h2>Destacados de la temporada</h2>
                  <p>Una muestra de los favoritos de nuestros clientes, listos para solicitar.</p>
                </div>
                <a href="#catalogo" className="btn btn-outline">Ver todo el catálogo <Icon name="arrowRight" size={16} /></a>
              </div>
              <div className="grid-products featured-grid">
                {featured.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============ PROMOTIONS ============ */}
        <PromotionsSection />

        {/* ============ CATALOG ============ */}
        <section className="section catalog-section" id="catalogo">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow"><Icon name="products" size={13} /> Colección GutiSupplements</span>
                <h2>Encuentra tu próximo aliado</h2>
                <p>
                  Entra en cada producto para consultar su descripción, presentación,
                  precio y disponibilidad antes de enviar una solicitud directa.
                </p>
              </div>
              <div className="catalog-search">
                <Icon name="search" size={18} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar producto o categoría"
                  aria-label="Buscar productos"
                />
              </div>
            </div>

            <div className="catalog-toolbar">
              <div className="filters" aria-label="Filtrar por categoría">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`filter-chip ${filter === category ? 'active' : ''}`}
                    onClick={() => setFilter(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <span className="results-count">
                {filteredProducts.length} producto{filteredProducts.length === 1 ? '' : 's'}
              </span>
            </div>

            {loading ? (
              <Loader label="Preparando el catálogo..." />
            ) : filteredProducts.length > 0 ? (
              <div className="grid-products">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="empty-results">
                <span className="empty-icon"><Icon name="search" size={30} /></span>
                <h3>No encontramos coincidencias</h3>
                <p>Prueba otra palabra o selecciona una categoría diferente.</p>
                <button className="btn btn-outline" onClick={() => { setSearch(''); setFilter('Todos'); }}>
                  Limpiar búsqueda
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ============ STATS BAND ============ */}
        <section className="stats-band">
          <div className="stats-band-art" aria-hidden="true">
            <img src="/art/molecule.svg" alt="" />
          </div>
          <div className="container stats-grid">
            {STATS.map((stat) => (
              <article key={stat.label}>
                <span className="stats-icon"><Icon name={stat.icon} size={22} /></span>
                <strong>{stat.value}</strong>
                <small>{stat.label}</small>
              </article>
            ))}
          </div>
        </section>

        {/* ============ BENEFITS ============ */}
        <section className="section benefits-section">
          <div className="container">
            <div className="section-heading center">
              <div>
                <span className="eyebrow"><Icon name="heart" size={13} /> Nuestra promesa</span>
                <h2>Todo lo que hace distinta tu compra</h2>
                <p>Una experiencia construida alrededor de la claridad, la calidad y el acompañamiento.</p>
              </div>
            </div>
            <div className="benefits-grid">
              {BENEFITS.map((benefit) => (
                <article className="benefit-card" key={benefit.title}>
                  <span className="benefit-icon"><Icon name={benefit.icon} size={22} /></span>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TESTIMONIALS ============ */}
        <section className="section testimonials-section">
          <div className="container">
            <div className="section-heading center">
              <div>
                <span className="eyebrow"><Icon name="quote" size={13} /> Voces reales</span>
                <h2>Lo que dicen quienes ya nos eligieron</h2>
                <p>Historias de clientes que encontraron acompañamiento además de un buen producto.</p>
              </div>
            </div>
            <div className="testimonials-grid">
              {TESTIMONIALS.map((testimonial) => (
                <article className="testimonial-card" key={testimonial.name}>
                  <span className="testimonial-quote-mark"><Icon name="quote" size={26} /></span>
                  <div className="testimonial-stars" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Icon key={star} name="star" size={15} />
                    ))}
                  </div>
                  <p>{testimonial.quote}</p>
                  <div className="testimonial-author">
                    <img src={testimonial.avatar} alt="" />
                    <div>
                      <strong>{testimonial.name}</strong>
                      <small>{testimonial.role}</small>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============ ADVISORY ============ */}
        <section className="section advisory-section" id="asesoria">
          <div className="container advisory-grid">
            <div className="advisory-visual">
              <div className="advisory-monogram">GS</div>
              <img className="advisory-scoop" src="/art/scoop.svg" alt="" aria-hidden="true" />
              <div className="advisory-card">
                <span className="eyebrow">Proceso claro</span>
                <strong>De la selección a la confirmación</strong>
                <ol>
                  <li><span>1</span> Explora la información completa.</li>
                  <li><span>2</span> Selecciona el producto que deseas solicitar.</li>
                  <li><span>3</span> Completa un formulario breve con tus datos esenciales.</li>
                  <li><span>4</span> Recibe confirmación por WhatsApp.</li>
                </ol>
              </div>
            </div>

            <div className="advisory-content">
              <span className="eyebrow"><Icon name="message" size={13} /> Una experiencia más humana</span>
              <h2>No solo compras un producto. Recibes acompañamiento.</h2>
              <p>
                Cada solicitud llega directamente al panel de GutiSupplements.
                El equipo recibe el producto solicitado y tus datos esenciales de entrega
                para contactarte con toda la información preparada.
              </p>
              <div className="advisory-points">
                <div><Icon name="check" size={17} /><span>Sin cobros automáticos inesperados.</span></div>
                <div><Icon name="check" size={17} /><span>Confirmación de stock antes del pago.</span></div>
                <div><Icon name="check" size={17} /><span>Comunicación directa y organizada.</span></div>
              </div>
              <a href="#catalogo" className="btn btn-primary">
                Explorar productos <Icon name="arrowRight" size={18} />
              </a>
            </div>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section className="section faq-section">
          <div className="container faq-grid">
            <div className="faq-intro">
              <span className="eyebrow"><Icon name="message" size={13} /> Preguntas frecuentes</span>
              <h2>Resolvemos tus dudas antes de empezar</h2>
              <p>Si algo no aparece aquí, escríbenos por WhatsApp y te ayudamos personalmente.</p>
              <a href="#catalogo" className="btn btn-outline">Ir al catálogo <Icon name="arrowRight" size={16} /></a>
            </div>
            <div className="faq-list">
              {FAQ.map((item, index) => (
                <details className="faq-item" key={item.q} open={index === 0}>
                  <summary>
                    <span>{item.q}</span>
                    <span className="faq-toggle"><Icon name="chevronDown" size={18} /></span>
                  </summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CTA BAND ============ */}
        <section className="cta-band">
          <div className="cta-band-orb cta-orb-one" />
          <div className="cta-band-orb cta-orb-two" />
          <img className="cta-band-molecule" src="/art/molecule.svg" alt="" aria-hidden="true" />
          <div className="container cta-band-inner">
            <span className="eyebrow"><Icon name="sparkles" size={13} /> Da el primer paso</span>
            <h2>¿Listo para elegir tu próximo suplemento?</h2>
            <p>Explora el catálogo, envía tu solicitud y deja que nuestro equipo se encargue del resto.</p>
            <div className="cta-band-actions">
              <a href="#catalogo" className="btn btn-primary btn-lg">Explorar catálogo <Icon name="arrowRight" size={18} /></a>
              <a href="#asesoria" className="btn btn-ghost-light btn-lg">Cómo funciona</a>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="footer">
        <div className="container footer-top">
          <div className="footer-about">
            <div className="footer-brand">
              <img src="/guti-logo.png" alt="" />
              <div><strong>GutiSupplements</strong><p>Performance · Wellness · Atención personalizada</p></div>
            </div>
            <p className="footer-about-text">
              Suplementos seleccionados con criterio y una experiencia de compra acompañada
              de principio a fin. Tu progreso, con mejor información.
            </p>
            <div className="footer-social">
              <a href="#inicio" aria-label="Instagram"><Icon name="instagram" size={18} /></a>
              <a href="#inicio" aria-label="Facebook"><Icon name="facebook" size={18} /></a>
              <a href="#inicio" aria-label="WhatsApp"><Icon name="whatsapp" size={18} /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Tienda</h4>
            <a href="#catalogo">Catálogo completo</a>
            <a href="#catalogo">Destacados</a>
            <a href="#catalogo">Categorías</a>
          </div>

          <div className="footer-col">
            <h4>Experiencia</h4>
            <a href="#experiencia">Cómo compramos</a>
            <a href="#asesoria">Asesoría</a>
            <a href="#faq">Preguntas frecuentes</a>
          </div>

          <div className="footer-col">
            <h4>Contacto</h4>
            <span className="footer-contact"><Icon name="whatsapp" size={16} /> Soporte por WhatsApp</span>
            <span className="footer-contact"><Icon name="mail" size={16} /> Atención personalizada</span>
            <a href="/admin" className="footer-admin-link"><Icon name="lock" size={15} /> Administración</a>
          </div>
        </div>
        <div className="container footer-bottom">
          <p>© {new Date().getFullYear()} GutiSupplements. Todos los derechos reservados.</p>
          <p className="footer-bottom-tag">Hecho con dedicación para tu bienestar.</p>
        </div>
      </footer>
    </>
  );
}
