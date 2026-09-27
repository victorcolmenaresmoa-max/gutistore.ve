'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import BrandLogo from '@/components/BrandLogo';
import Icon from '@/components/Icons';
import { useCategories, useProducts } from '@/hooks/useStoreData';
import { buildStoreCategories } from '@/lib/categories';
import { categoryHref } from '@/lib/catalog';

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
            <BrandLogo variant="full" className="footer-logo" />
          </Link>
          <p>
            Ropa, calzado, accesorios, hidratación y suplementos seleccionados para entrenar, moverte y
            verte bien. Todo en un solo lugar.
          </p>
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
          <span className="footer-note">
            <Icon name="shield" size={15} /> Pago coordinado con un asesor
          </span>
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
