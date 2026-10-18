'use client';

import Icon from '@/components/Icons';
import Price from '@/components/Price';
import { useCart } from '@/context/CartContext';

export default function CartSummary({ children }: { children?: React.ReactNode }) {
  const { itemCount, subtotal } = useCart();
  return (
    <aside className="summary-card" aria-labelledby="summary-title">
      <h2 id="summary-title">Resumen</h2>
      <div className="cart-summary-row">
        <span>
          Productos ({itemCount})
        </span>
        <Price amount={subtotal} size="sm" showBs={false} animate />
      </div>
      <div className="cart-summary-row">
        <span>Envío</span>
        <span className="muted">Se coordina con tu asesor</span>
      </div>
      <div className="cart-summary-row cart-summary-total">
        <span>Total estimado</span>
        <Price amount={subtotal} size="lg" animate />
      </div>
      {children}
      <p className="summary-note">
        <Icon name="shield" size={16} />
        <span>Al registrar tu pedido no se realiza ningún cobro. Un asesor confirmará disponibilidad, entrega y pago.</span>
      </p>
    </aside>
  );
}
