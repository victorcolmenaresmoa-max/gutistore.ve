'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { getProducts, getPromotions } from '@/lib/api';
import { invalidateStoreCache } from './useStoreData';

/**
 * Al abrir el carrito o el checkout se consulta el catálogo actualizado y se
 * ajustan precios, stock y cantidades. Devuelve los avisos para mostrarlos.
 */
export function useCartSync() {
  const { ready, reconcile, lines } = useCart();
  const [notices, setNotices] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(true);
  const hasLines = lines.length > 0;

  useEffect(() => {
    if (!ready) return;
    if (!hasLines) {
      setSyncing(false);
      return;
    }
    let active = true;
    setSyncing(true);
    invalidateStoreCache();
    Promise.all([getProducts(), getPromotions()]).then(([products, promotions]) => {
      if (!active) return;
      if (products.ok && products.data) {
        setNotices(reconcile(products.data, promotions.ok && promotions.data ? promotions.data : null));
      }
      setSyncing(false);
    });
    return () => {
      active = false;
    };
    // Solo al cargar la página (y cuando el carrito termina de leerse).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return { notices, syncing, dismiss: () => setNotices([]) };
}
