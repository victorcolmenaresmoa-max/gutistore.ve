'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import Icon from '@/components/Icons';
import Price from '@/components/Price';
import { useCart } from '@/context/CartContext';
import { useDialog } from '@/hooks/useDialog';
import CartLineItem from './CartLineItem';

export default function CartDrawer() {
  const { lines, drawerOpen, closeDrawer, itemCount, subtotal } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useDialog(drawerOpen, panelRef, closeDrawer);

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="drawer-root" role="presentation">
      <button type="button" className="drawer-backdrop" aria-label="Cerrar carrito" onClick={closeDrawer} />
      <aside
        className="drawer drawer-right cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="drawer-header">
          <div>
            <h2 id="cart-drawer-title">Tu carrito</h2>
            <span className="drawer-subtitle">
              {itemCount} artículo{itemCount === 1 ? '' : 's'}
            </span>
          </div>
          <button type="button" className="nav-icon-btn" onClick={closeDrawer} aria-label="Cerrar carrito">
            <Icon name="close" size={22} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="drawer-body cart-empty">
            <span className="empty-icon">
              <Icon name="cart" size={30} />
            </span>
            <h3>Tu carrito está vacío</h3>
            <p>Explora la tienda y agrega lo que quieras llevarte.</p>
            <Link href="/tienda" className="btn btn-primary" onClick={closeDrawer}>
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <>
            <div className="drawer-body cart-drawer-lines">
              {lines.map((line) => (
                <CartLineItem key={line.key} line={line} compact />
              ))}
            </div>
            <div className="drawer-footer">
              <div className="cart-summary-row cart-summary-total">
                <span>Subtotal</span>
                <Price amount={subtotal} size="md" />
              </div>
              <p className="drawer-note">
                <Icon name="shield" size={15} /> No se cobra nada en línea. Confirmamos disponibilidad, entrega y pago contigo.
              </p>
              <div className="drawer-actions">
                <Link href="/carrito" className="btn btn-outline-dark" onClick={closeDrawer}>
                  Ver carrito
                </Link>
                <Link href="/checkout" className="btn btn-primary" onClick={closeDrawer}>
                  Finalizar pedido
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
