'use client';

import { useCurrency } from '@/context/CurrencyContext';
import { formatBs, formatUSD, hasRate } from '@/lib/currency';

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
}: {
  amount: number;
  compareAt?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBs?: boolean;
  prefix?: string;
  className?: string;
}) {
  const { rate } = useCurrency();
  const hasCompare = compareAt > amount;

  return (
    <span className={`price price-${size} ${hasCompare ? 'price-sale' : ''} ${className}`}>
      <span className="price-row">
        {prefix && <span className="price-prefix">{prefix}</span>}
        <span className="price-main">{formatUSD(amount)}</span>
        {hasCompare && (
          <s className="price-compare" aria-label={`Antes ${formatUSD(compareAt)}`}>
            {formatUSD(compareAt)}
          </s>
        )}
      </span>
      {showBs && hasRate(rate) && <span className="price-bs">{formatBs(amount, rate)}</span>}
    </span>
  );
}
