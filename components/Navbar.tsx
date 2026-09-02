'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo';
import Icon from './Icons';

const LINKS = [
  { href: '/#catalogo', label: 'Catálogo' },
  { href: '/#ofertas', label: 'Ofertas' },
  { href: '/#experiencia', label: 'Experiencia' },
  { href: '/#asesoria', label: 'Asesoría' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className={`navbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Link href="/" className="navbar-brand" onClick={closeMenu}>
          <BrandLogo compact />
        </Link>

        <button
          className="mobile-menu-btn"
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={21} />
        </button>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </Link>
          ))}
          <Link href="/admin" className="nav-admin-link" onClick={closeMenu}>
            Acceso admin
          </Link>
        </nav>

        <Link href="/#catalogo" className="nav-shop-cta" onClick={closeMenu}>
          <Icon name="products" size={18} />
          <span>Ver productos</span>
        </Link>
      </div>
    </header>
  );
}
