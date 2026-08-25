'use client';

import Link from 'next/link';
import { useState } from 'react';
import BrandLogo from './BrandLogo';
import Icon from './Icons';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link href="/" className="navbar-brand" onClick={closeMenu}>
          <BrandLogo compact />
        </Link>

        <button
          className="mobile-menu-btn"
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={21} />
        </button>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link href="/#catalogo" onClick={closeMenu}>Catálogo</Link>
          <Link href="/#experiencia" onClick={closeMenu}>Experiencia</Link>
          <Link href="/#asesoria" onClick={closeMenu}>Asesoría</Link>
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
