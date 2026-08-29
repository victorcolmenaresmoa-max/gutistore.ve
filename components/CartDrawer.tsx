'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { formatUSD } from '@/lib/currency';
import Icon from './Icons';

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal, count, removeItem, setQuantity } = useCart();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="cart-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Carrito de compras">
        <header className="cart-drawer-header">
          <div><span>Tu carrito</span><strong>{count} artículo{count === 1 ? '' : 's'}</strong></div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar carrito"><Icon name="close" size={20} /></button>
        </header>

        {items.length === 0 ? (
          <div className="cart-empty">
            <span className="empty-icon"><Icon name="bag" size={30} /></span>
            <h3>Tu carrito está vacío</h3>
            <p>Explora el catálogo y agrega los productos que quieras solicitar.</p>
            <Link href="/productos" className="btn btn-primary" onClick={onClose}>Explorar productos</Link>
          </div>
        ) : (
          <>
            <div className="cart-drawer-items">
              {items.map((item) => (
                <article className="cart-line" key={item.key}>
                  <div className="cart-line-image">
                    {item.imagen ? <Image src={item.imagen} alt={item.nombre} fill sizes="80px" /> : <Icon name="package" size={28} />}
                  </div>
                  <div className="cart-line-main">
                    <strong>{item.nombre}</strong>
                    {item.atributosSeleccionados && Object.keys(item.atributosSeleccionados).length > 0 && (
                      <small>{Object.entries(item.atributosSeleccionados).map(([k, v]) => `${k}: ${v}`).join(' · ')}</small>
                    )}
                    {item.sku && <small>SKU: {item.sku}</small>}
                    <div className="cart-line-bottom">
                      <div className="quantity-picker quantity-picker-small">
                        <button onClick={() => setQuantity(item.key, item.cantidad - 1)} aria-label="Reducir cantidad">−</button>
                        <span>{item.cantidad}</span>
                        <button onClick={() => setQuantity(item.key, item.cantidad + 1)} disabled={item.stockDisponible !== undefined && item.cantidad >= item.stockDisponible} aria-label="Aumentar cantidad">+</button>
                      </div>
                      <strong>{formatUSD(item.precio * item.cantidad)}</strong>
                    </div>
                  </div>
                  <button className="cart-remove" onClick={() => removeItem(item.key)} aria-label={`Quitar ${item.nombre}`}><Icon name="trash" size={16} /></button>
                </article>
              ))}
            </div>
            <footer className="cart-drawer-footer">
              <div><span>Subtotal</span><strong>{formatUSD(subtotal)} USD</strong></div>
              <p>El total final se confirma al registrar el pedido.</p>
              <Link href="/checkout" className="btn btn-primary btn-block btn-lg" onClick={onClose}>Continuar al checkout <Icon name="arrowRight" size={17} /></Link>
              <Link href="/carrito" className="btn btn-ghost btn-block" onClick={onClose}>Ver carrito completo</Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
