'use client';

import Link from 'next/link';
import { useState } from 'react';
import Icon from '@/components/Icons';
import { EmptyState, Spinner } from '@/components/ui/States';
import { useCart } from '@/context/CartContext';
import { useCartSync } from '@/hooks/useCartSync';
import CartLineItem from './CartLineItem';
import CartSummary from './CartSummary';

export function CartNotices({ notices, onDismiss }: { notices: string[]; onDismiss: () => void }) {
  if (!notices.length) return null;
  return (
    <div className="notice notice-info" role="status">
      <Icon name="info" size={18} />
      <div>
        <strong>Actualizamos tu carrito</strong>
        <ul>
          {notices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Cerrar aviso">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export default function CartPageView() {
  const { lines, ready, itemCount, clear } = useCart();
  const { notices, syncing, dismiss } = useCartSync();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="container page-narrow cart-page">
      <div className="page-heading">
        <nav className="breadcrumbs" aria-label="Ruta de navegación">
          <ol>
            <li>
              <Link href="/">Inicio</Link>
            </li>
            <li aria-current="page">Carrito</li>
          </ol>
        </nav>
        <h1>Tu carrito</h1>
        {ready && itemCount > 0 && (
          <p>
            {itemCount} artículo{itemCount === 1 ? '' : 's'} listos para tu pedido
          </p>
        )}
      </div>

      {!ready ? (
        <Spinner label="Cargando tu carrito…" />
      ) : lines.length === 0 ? (
        <EmptyState
          icon="cart"
          title="Tu carrito está vacío"
          description="Descubre ropa, calzado, accesorios y suplementos seleccionados para ti."
          action={{ label: 'Explorar la tienda', href: '/tienda' }}
        />
      ) : (
        <div className="cart-layout">
          <section aria-label="Productos del carrito">
            <CartNotices notices={notices} onDismiss={dismiss} />
            <div className="cart-lines">
              {lines.map((line) => (
                <CartLineItem key={line.key} line={line} />
              ))}
            </div>
            <div className="cart-page-actions">
              <Link href="/tienda" className="btn btn-ghost">
                <Icon name="arrowLeft" size={16} /> Seguir comprando
              </Link>
              {confirmClear ? (
                <span className="confirm-inline">
                  ¿Vaciar el carrito?
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => { clear(); setConfirmClear(false); }}>
                    Sí, vaciar
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmClear(false)}>
                    Cancelar
                  </button>
                </span>
              ) : (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmClear(true)}>
                  <Icon name="trash" size={15} /> Vaciar carrito
                </button>
              )}
            </div>
          </section>
          <CartSummary>
            <Link href="/checkout" className={`btn btn-primary btn-lg btn-block ${syncing ? 'is-busy' : ''}`}>
              Continuar con el pedido
            </Link>
          </CartSummary>
        </div>
      )}
    </div>
  );
}
