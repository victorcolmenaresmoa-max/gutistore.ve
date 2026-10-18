'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import BrandLogo from '@/components/BrandLogo';
import Icon from '@/components/Icons';
import CategoryArt from '@/components/CategoryArt';
import { useCart } from '@/context/CartContext';
import { CART_HIT_EVENT } from '@/lib/motion';
import { useCategories, useProducts } from '@/hooks/useStoreData';
import { useDialog } from '@/hooks/useDialog';
import { buildStoreCategories, categoryArtKind } from '@/lib/categories';
import { categoryHref } from '@/lib/catalog';

function SearchForm({
  id,
  autoFocus = false,
  onDone,
  className = '',
}: {
  id: string;
  autoFocus?: boolean;
  onDone?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState('');

  // Refleja la búsqueda actual al estar en la tienda (sin useSearchParams para
  // no forzar renderizado dinámico en todas las páginas).
  useEffect(() => {
    setValue(pathname === '/tienda' ? new URLSearchParams(window.location.search).get('q') || '' : '');
  }, [pathname]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const query = value.trim();
    router.push(query ? `/tienda?q=${encodeURIComponent(query)}` : '/tienda');
    onDone?.();
  };

  return (
    <form className={`nav-search ${className}`} role="search" onSubmit={submit}>
      <label htmlFor={id} className="sr-only">
        Buscar productos
      </label>
      <Icon name="search" size={18} />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar ropa, calzado, suplementos…"
        autoComplete="off"
        autoFocus={autoFocus}
        enterKeyHint="search"
      />
    </form>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { itemCount, ready, openDrawer } = useCart();
  const products = useProducts();
  const categories = useCategories();
  const storeCategories = useMemo(
    () => buildStoreCategories(products.data, categories.data),
    [products.data, categories.data]
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const previousCount = useRef(itemCount);

  useDialog(menuOpen, menuRef, () => setMenuOpen(false));

  // Cierra menús al navegar.
  useEffect(() => {
    setMenuOpen(false);
    setMegaOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // El carrito se sacude y el contador rebota cuando "recibe" un producto
  // (al terminar la animación de vuelo, o al instante si no hay animación).
  const [cartHit, setCartHit] = useState(0);
  useEffect(() => {
    const onHit = () => setCartHit((value) => value + 1);
    window.addEventListener(CART_HIT_EVENT, onHit);
    return () => window.removeEventListener(CART_HIT_EVENT, onHit);
  }, []);
  useEffect(() => {
    if (!cartHit) return;
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 650);
    return () => window.clearTimeout(timer);
  }, [cartHit]);
  useEffect(() => {
    previousCount.current = itemCount;
  }, [itemCount]);

  useEffect(() => {
    if (!megaOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!megaRef.current?.contains(event.target as Node)) setMegaOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMegaOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [megaOpen]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const cartLabel = ready && itemCount > 0 ? `Carrito, ${itemCount} artículo${itemCount === 1 ? '' : 's'}` : 'Carrito';

  return (
    <header className="site-header">
      <div className="navbar">
        <div className="container navbar-inner">
          <button
            type="button"
            className="nav-icon-btn nav-menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <Icon name="menu" size={22} />
          </button>

          <Link href="/" className="navbar-brand" aria-label="GutiStore, ir al inicio">
            <BrandLogo variant="horizontal" priority />
          </Link>

          <nav className="nav-links" aria-label="Principal">
            <Link href="/" className={isActive('/') ? 'active' : ''}>
              Inicio
            </Link>
            <Link href="/tienda" className={isActive('/tienda') ? 'active' : ''}>
              Tienda
            </Link>
            <div className="nav-mega" ref={megaRef}>
              <button
                type="button"
                className={`nav-mega-trigger ${megaOpen ? 'open' : ''}`}
                aria-expanded={megaOpen}
                aria-controls="mega-menu"
                onClick={() => setMegaOpen((value) => !value)}
              >
                Categorías <Icon name="chevronDown" size={16} />
              </button>
              {megaOpen && (
                <div className="mega-menu" id="mega-menu">
                  {storeCategories.length === 0 ? (
                    <p className="mega-empty">
                      {products.loading ? 'Cargando categorías…' : 'Pronto verás aquí nuestras categorías.'}
                    </p>
                  ) : (
                    <div className="mega-grid">
                      {storeCategories.map((category) => (
                        <div className="mega-col" key={category.nombre}>
                          <Link href={categoryHref(category.nombre)} className="mega-title" onClick={() => setMegaOpen(false)}>
                            <CategoryArt kind={categoryArtKind(category.nombre)} />
                            <span>{category.nombre}</span>
                          </Link>
                          {category.subcategorias.slice(0, 6).map((sub) => (
                            <Link
                              key={sub.nombre}
                              href={categoryHref(category.nombre, sub.nombre)}
                              onClick={() => setMegaOpen(false)}
                            >
                              {sub.nombre}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  <Link href="/tienda" className="mega-all" onClick={() => setMegaOpen(false)}>
                    Ver toda la tienda <Icon name="arrowRight" size={16} />
                  </Link>
                </div>
              )}
            </div>
            <Link href="/ofertas" className={`nav-offers ${isActive('/ofertas') ? 'active' : ''}`}>
              Ofertas
            </Link>
          </nav>

          <div className="nav-actions">
            <SearchForm id="desktop-search" className="nav-search-desktop" />
            <button
              type="button"
              className="nav-icon-btn nav-search-toggle"
              onClick={() => setSearchOpen((value) => !value)}
              aria-label={searchOpen ? 'Cerrar búsqueda' : 'Buscar'}
              aria-expanded={searchOpen}
              aria-controls="mobile-search"
            >
              <Icon name={searchOpen ? 'close' : 'search'} size={21} />
            </button>
            <button
              type="button"
              className={`nav-icon-btn nav-cart-btn ${bump ? 'is-hit' : ''}`}
              onClick={openDrawer}
              aria-label={cartLabel}
              data-cart-target
            >
              <Icon name="cart" size={22} />
              {ready && itemCount > 0 && (
                <span className={`cart-badge ${bump ? 'bump' : ''}`} aria-hidden="true">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="mobile-search" id="mobile-search">
            <div className="container">
              <SearchForm id="mobile-search-input" autoFocus onDone={() => setSearchOpen(false)} />
            </div>
          </div>
        )}
      </div>

      {menuOpen && (
        <div className="drawer-root" role="presentation">
          <button type="button" className="drawer-backdrop" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />
          <div
            className="drawer drawer-left mobile-menu"
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            ref={menuRef}
            tabIndex={-1}
          >
            <div className="drawer-header">
              <BrandLogo variant="horizontal" className="mobile-menu-logo" />
              <button type="button" className="nav-icon-btn" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
                <Icon name="close" size={22} />
              </button>
            </div>
            <div className="drawer-body">
              <SearchForm id="menu-search" onDone={() => setMenuOpen(false)} className="mobile-menu-search" />
              <nav className="mobile-menu-links" aria-label="Menú móvil">
                <Link href="/" className={isActive('/') ? 'active' : ''}>
                  <Icon name="home" size={19} /> Inicio
                </Link>
                <Link href="/tienda" className={isActive('/tienda') ? 'active' : ''}>
                  <Icon name="grid" size={19} /> Toda la tienda
                </Link>
                <Link href="/ofertas" className={isActive('/ofertas') ? 'active' : ''}>
                  <Icon name="tag" size={19} /> Ofertas
                </Link>
                <Link href="/carrito" className={isActive('/carrito') ? 'active' : ''}>
                  <Icon name="cart" size={19} /> Mi carrito {ready && itemCount > 0 && <b>{itemCount}</b>}
                </Link>
              </nav>

              {storeCategories.length > 0 && (
                <div className="mobile-menu-section">
                  <span className="mobile-menu-label">Categorías</span>
                  <div className="mobile-menu-categories">
                    {storeCategories.map((category) => (
                      <Link key={category.nombre} href={categoryHref(category.nombre)}>
                        <CategoryArt kind={categoryArtKind(category.nombre)} />
                        <span>{category.nombre}</span>
                        <Icon name="chevronRight" size={16} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
