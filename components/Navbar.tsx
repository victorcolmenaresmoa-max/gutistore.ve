'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from './BrandLogo';
import Icon from './Icons';
import CartDrawer from './CartDrawer';
import { useCart } from '@/context/CartContext';
import { getCategories } from '@/lib/api';
import type { Category } from '@/types';

export default function Navbar() {
  const router = useRouter();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    void getCategories().then((response) => response.ok && response.data && setCategories(response.data));
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const term = search.trim();
    router.push(term ? `/productos?q=${encodeURIComponent(term)}` : '/productos');
    closeMenu();
  };

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <Link href="/" className="navbar-brand" onClick={closeMenu}><BrandLogo compact /></Link>

          <form className="nav-search" onSubmit={submitSearch}>
            <Icon name="search" size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en GutiStore" aria-label="Buscar productos" />
          </form>

          <button className="mobile-menu-btn" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir menú" aria-expanded={menuOpen}>
            <Icon name={menuOpen ? 'close' : 'menu'} size={21} />
          </button>

          <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <Link href="/productos" onClick={closeMenu}>Productos</Link>
            {categories.slice(0, 4).map((category) => (
              <Link key={category.id} href={`/categoria/${category.slug}`} onClick={closeMenu}>{category.name}</Link>
            ))}
            <Link href="/admin" className="nav-admin-link" onClick={closeMenu}>Admin</Link>
          </nav>

          <button type="button" className="nav-cart-btn" onClick={() => setCartOpen(true)} aria-label={`Abrir carrito, ${count} artículos`}>
            <Icon name="bag" size={19} />
            <span>Carrito</span>
            {count > 0 && <b>{count}</b>}
          </button>
        </div>
      </header>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
