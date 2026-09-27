export const ORDER_STATUSES = [
  'Pendiente',
  'Contactado',
  'Confirmado',
  'En preparación',
  'Enviado',
  'Entregado',
  'Cancelado',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CANCELLED_STATUS: OrderStatus = 'Cancelado';

export function isValidOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function statusClass(status: string) {
  return `status-${String(status || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')}`;
}

export const DELIVERY_METHODS = ['Envío a domicilio', 'Retiro coordinado', 'Agencia de encomiendas'] as const;

export const PAYMENT_METHODS = [
  'Por definir con el asesor',
  'Transferencia bancaria',
  'Zelle',
  'Pago móvil',
  'Efectivo en USD',
  'Efectivo en Bs',
] as const;

/** Máximo de unidades de una promoción por pedido (no manejan inventario propio). */
export const PROMOTION_MAX_QTY = 10;
