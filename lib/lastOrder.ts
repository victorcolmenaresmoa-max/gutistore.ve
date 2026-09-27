import type { OrderItem } from '@/types';

const KEY = 'gutistore-last-order';

export interface LastOrder {
  id: string;
  cliente: string;
  total: number;
  items: OrderItem[];
  metodoEntrega: string;
  metodoPago: string;
  createdAt: number;
}

export function saveLastOrder(order: LastOrder) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    // La confirmación se mostrará sin detalle si no hay sessionStorage.
  }
}

export function readLastOrder(): LastOrder | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastOrder;
    return parsed && Array.isArray(parsed.items) ? parsed : null;
  } catch {
    return null;
  }
}
