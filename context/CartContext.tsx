'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem } from '@/types';

const STORAGE_KEY = 'gutistore-cart-v1';

type AddInput = Omit<CartItem, 'key' | 'cantidad'> & { cantidad?: number };

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  addItem: (item: AddInput) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function itemKey(productId: string, variantId?: string, promotionId?: string) {
  return promotionId ? `promotion::${promotionId}` : `${productId}::${variantId || 'base'}`;
}

function quantityCap(stockDisponible?: number) {
  return Number.isFinite(stockDisponible) ? Math.max(0, Math.trunc(Number(stockDisponible))) : Number.MAX_SAFE_INTEGER;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed.filter((item) => item?.productId && item?.key));
      }
    } catch {
      // Un carrito corrupto no debe bloquear la tienda.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((input: AddInput) => {
    const key = itemKey(input.productId, input.variantId, input.promotionId);
    const requested = Math.max(1, Math.trunc(input.cantidad || 1));
    const cap = quantityCap(input.stockDisponible);
    setItems((current) => {
      const found = current.find((item) => item.key === key);
      if (!found) return [...current, { ...input, key, cantidad: Math.min(requested, cap) }];
      return current.map((item) => item.key === key
        ? { ...item, ...input, cantidad: Math.min(item.cantidad + requested, cap) }
        : item);
    });
  }, []);

  const removeItem = useCallback((key: string) => setItems((current) => current.filter((item) => item.key !== key)), []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) => current.map((item) => item.key === key
      ? { ...item, cantidad: Math.max(1, Math.min(Math.trunc(quantity || 1), Math.max(1, quantityCap(item.stockDisponible)))) }
      : item));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.cantidad, 0),
    subtotal: items.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
    hydrated,
    addItem,
    removeItem,
    setQuantity,
    clearCart,
  }), [items, hydrated, addItem, removeItem, setQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider.');
  return context;
}
