'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Product, Promotion } from '@/types';
import { CartLine, CartLineInput, reconcileLines, sanitizeStoredLine } from '@/lib/cart';
import { useToast } from './ToastContext';

const STORAGE_KEY = 'gutistore-cart-v1';

export interface AddResult {
  ok: boolean;
  message?: string;
}

interface CartContextValue {
  lines: CartLine[];
  /** false hasta leer localStorage (evita diferencias entre servidor y navegador). */
  ready: boolean;
  itemCount: number;
  subtotal: number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (line: CartLineInput, quantity?: number) => AddResult;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  quantityOf: (key: string) => number;
  reconcile: (products: Product[], promotions: Promotion[] | null) => string[];
}

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const map = new Map<string, CartLine>();
    parsed.forEach((entry) => {
      const line = sanitizeStoredLine(entry);
      if (line) map.set(line.key, line);
    });
    return Array.from(map.values());
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { notify } = useToast();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const linesRef = useRef<CartLine[]>([]);
  linesRef.current = lines;

  useEffect(() => {
    setLines(readStorage());
    setReady(true);

    // Mantiene el carrito sincronizado entre pestañas.
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setLines(readStorage());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Sin localStorage el carrito funciona igual durante la visita.
    }
  }, [lines, ready]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const addItem = useCallback<CartContextValue['addItem']>(
    (input, quantity = 1) => {
      const qty = Math.max(1, Math.trunc(quantity));
      if (input.maxStock <= 0) {
        const message = 'Este producto está agotado.';
        notify({ title: 'Sin disponibilidad', description: message, tone: 'error' });
        return { ok: false, message };
      }

      const existing = linesRef.current.find((line) => line.key === input.key);
      const current = existing?.cantidad || 0;
      const allowed = Math.min(current + qty, input.maxStock);

      if (allowed <= current) {
        const message = `Ya tienes en tu carrito las ${input.maxStock} unidades disponibles.`;
        notify({ title: 'Límite de stock', description: message, tone: 'info' });
        return { ok: false, message };
      }

      const next = existing
        ? linesRef.current.map((line) =>
            line.key === input.key ? { ...line, ...input, cantidad: allowed } : line
          )
        : [...linesRef.current, { ...input, cantidad: allowed }];
      linesRef.current = next;
      setLines(next);

      const added = allowed - current;
      const partial = added < qty;
      notify({
        title: partial ? 'Agregado parcialmente' : 'Agregado al carrito',
        description: `${added} × ${input.nombre}${input.varianteNombre ? ` · ${input.varianteNombre}` : ''}${
          partial ? ` (máximo disponible: ${input.maxStock})` : ''
        }`,
        tone: partial ? 'info' : 'success',
        action: { label: 'Ver carrito', onClick: () => setDrawerOpen(true) },
      });
      return { ok: true };
    },
    [notify]
  );

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((current) =>
      current
        .map((line) =>
          line.key === key
            ? { ...line, cantidad: Math.min(Math.max(0, Math.trunc(quantity)), Math.max(line.maxStock, 0)) }
            : line
        )
        .filter((line) => line.cantidad > 0)
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setLines((current) => current.filter((line) => line.key !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const quantityOf = useCallback(
    (key: string) => lines.find((line) => line.key === key)?.cantidad || 0,
    [lines]
  );

  const reconcile = useCallback((products: Product[], promotions: Promotion[] | null) => {
    const result = reconcileLines(linesRef.current, products, promotions);
    const changed = JSON.stringify(result.lines) !== JSON.stringify(linesRef.current);
    if (changed) {
      linesRef.current = result.lines;
      setLines(result.lines);
    }
    return result.changes;
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, line) => sum + line.cantidad, 0);
    const subtotal = Math.round(lines.reduce((sum, line) => sum + line.precio * line.cantidad, 0) * 100) / 100;
    return {
      lines,
      ready,
      itemCount,
      subtotal,
      drawerOpen,
      openDrawer,
      closeDrawer,
      addItem,
      setQuantity,
      removeItem,
      clear,
      quantityOf,
      reconcile,
    };
  }, [lines, ready, drawerOpen, openDrawer, closeDrawer, addItem, setQuantity, removeItem, clear, quantityOf, reconcile]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider.');
  return context;
}
