'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import BrandLogo from '@/components/BrandLogo';
import Icon from '@/components/Icons';
import { useCategories, useProducts } from '@/hooks/useStoreData';
import { buildStoreCategories } from '@/lib/categories';
import { categoryHref } from '@/lib/catalog';
import { storeWhatsappLink } from '@/lib/whatsapp';

export default function Footer() {
  const products = useProducts();
  const categories = useCategories();
  const storeCategories = useMemo(
    () => buildStoreCategories(products.data, categories.data).slice(0, 6),
    [products.data, categories.data]
  );

  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-about">
          <Link href="/" aria-label="GutiStore, ir al inicio" className="footer-logo-link">
            <BrandLogo variant="horizontal" className="footer-logo" />
          </Link>
          <p>
            Suplementos, ropa deportiva y accesorios. Haces tu pedido en línea y lo confirmamos contigo por
            WhatsApp.
          </p>
          <ul className="footer-contact" aria-label="Contacto">
            <li>
              <a href="https://www.instagram.com/gutistore.me/" target="_blank" rel="noopener noreferrer">
                <Icon name="instagram" size={18} /> Instagram
              </a>
            </li>
            <li>
              <a href={storeWhatsappLink()} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" size={18} /> WhatsApp
              </a>
            </li>
          </ul>
        </div>

        <nav className="footer-col" aria-label="Tienda">
          <h2>Tienda</h2>
          <Link href="/tienda">Todos los productos</Link>
          <Link href="/tienda?nuevo=1">Nuevos</Link>
          <Link href="/ofertas">Ofertas</Link>
          <Link href="/tienda?destacado=1">Destacados</Link>
        </nav>

        {storeCategories.length > 0 && (
          <nav className="footer-col" aria-label="Categorías">
            <h2>Categorías</h2>
            {storeCategories.map((category) => (
              <Link key={category.nombre} href={categoryHref(category.nombre)}>
                {category.nombre}
              </Link>
            ))}
          </nav>
        )}

        <nav className="footer-col" aria-label="Ayuda">
          <h2>Tu compra</h2>
          <Link href="/carrito">Mi carrito</Link>
          <Link href="/#como-comprar">Cómo comprar</Link>
          <Link href="/#preguntas">Preguntas frecuentes</Link>
        </nav>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} GutiStore. Todos los derechos reservados.</p>
        <Link href="/admin" className="footer-admin-link">
          <Icon name="lock" size={14} /> Administración
        </Link>
      </div>
    </footer>
  );
}
