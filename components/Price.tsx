'use client';

import { useCurrency } from '@/context/CurrencyContext';
import { formatBs, formatUSD, hasRate } from '@/lib/currency';
import { useCountUp } from '@/hooks/useCountUp';

/**
 * Precio unificado de la tienda: USD como moneda principal y, si hay una tasa
 * válida configurada, su equivalente en bolívares en una línea secundaria.
 */
export default function Price({
  amount,
  compareAt = 0,
  size = 'md',
  showBs = true,
  prefix,
  className = '',
  animate = false,
}: {
  amount: number;
  compareAt?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBs?: boolean;
  prefix?: string;
  className?: string;
  /** Cuenta hasta el nuevo valor cuando cambia (totales del carrito). */
  animate?: boolean | 'from-zero';
}) {
  const { rate } = useCurrency();
  const shown = useCountUp(amount, Boolean(animate), animate === 'from-zero' ? 1200 : 600, animate === 'from-zero');
  const counting = Boolean(animate) && Math.abs(shown - amount) > 0.004;
  const hasCompare = compareAt > amount;

  return (
    <span className={`price price-${size} ${hasCompare ? 'price-sale' : ''} ${counting ? 'is-counting' : ''} ${className}`}>
      <span className="price-row">
        {prefix && <span className="price-prefix">{prefix}</span>}
        <span className="price-main">{formatUSD(shown)}</span>
        {hasCompare && (
          <s className="price-compare" aria-label={`Antes ${formatUSD(compareAt)}`}>
            {formatUSD(compareAt)}
          </s>
        )}
      </span>
      {showBs && hasRate(rate) && <span className="price-bs">{formatBs(shown, rate)}</span>}
    </span>
  );
}
