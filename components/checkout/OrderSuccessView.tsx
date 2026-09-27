'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icons';
import Price from '@/components/Price';
import { Spinner } from '@/components/ui/States';
import { formatUSD } from '@/lib/currency';
import { LastOrder, readLastOrder } from '@/lib/lastOrder';
import { shortOrderId } from '@/lib/text';

export default function OrderSuccessView() {
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOrder(readLastOrder());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="container page-narrow">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container page-narrow success-page">
      <div className="success-card">
        <span className="success-icon" aria-hidden="true">
          <Icon name="check" size={34} />
        </span>
        <span className="eyebrow">Pedido registrado</span>
        <h1>{order?.cliente ? `¡Gracias, ${order.cliente.split(' ')[0]}!` : '¡Gracias por tu pedido!'}</h1>
        {order?.id ? (
          <p className="success-id">
            Número de pedido <strong>#{shortOrderId(order.id)}</strong>
          </p>
        ) : null}
        <p className="success-lead">
          Recibimos tu pedido correctamente. <strong>Todavía no se ha realizado ningún cobro.</strong>
        </p>

        {order && order.items.length > 0 && (
          <div className="success-summary">
            <ul>
              {order.items.map((item, index) => (
                <li key={`${item.id}-${item.varianteId || ''}-${index}`}>
                  <span>
                    <strong>
                      {item.cantidad} × {item.nombre}
                    </strong>
                    {item.varianteNombre && <small>{item.varianteNombre}</small>}
                  </span>
                  <span>{formatUSD(item.subtotal ?? item.precio * item.cantidad)}</span>
                </li>
              ))}
            </ul>
            <div className="cart-summary-row cart-summary-total">
              <span>Total estimado</span>
              <Price amount={order.total} size="lg" />
            </div>
            <p className="success-meta">
              {order.metodoEntrega} · Pago: {order.metodoPago}
            </p>
          </div>
        )}

        <ol className="success-steps">
          <li>
            <span>1</span>
            <p>
              <strong>Te contactamos por WhatsApp</strong> para confirmar disponibilidad y el total final.
            </p>
          </li>
          <li>
            <span>2</span>
            <p>
              <strong>Coordinamos el pago</strong> con el método que prefieras.
            </p>
          </li>
          <li>
            <span>3</span>
            <p>
              <strong>Preparamos y enviamos</strong> tu pedido según la entrega acordada.
            </p>
          </li>
        </ol>

        <div className="success-actions">
          <Link href="/tienda" className="btn btn-primary btn-lg">
            Seguir comprando <Icon name="arrowRight" size={18} />
          </Link>
          <Link href="/" className="btn btn-ghost">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
