/**
 * Utilidades de formato de moneda.
 * Los precios se guardan siempre en USD. Los bolívares (Bs) se calculan
 * multiplicando por la tasa de cambio configurada en el panel de administración.
 */

const usdFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const bsFormatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Devuelve por ejemplo "$32.00". */
export function formatUSD(amount: number): string {
  return `$${usdFormatter.format(Number.isFinite(amount) ? amount : 0)}`;
}

/** Convierte un monto en USD a bolívares usando la tasa indicada. */
export function toBs(amountUsd: number, rate: number): number {
  return (Number.isFinite(amountUsd) ? amountUsd : 0) * (Number.isFinite(rate) ? rate : 0);
}

/** Devuelve por ejemplo "Bs 1.280,00". */
export function formatBs(amountUsd: number, rate: number): string {
  return `Bs ${bsFormatter.format(toBs(amountUsd, rate))}`;
}

/** True cuando hay una tasa válida configurada y tiene sentido mostrar Bs. */
export function hasRate(rate: number | null | undefined): boolean {
  return typeof rate === 'number' && Number.isFinite(rate) && rate > 0;
}
