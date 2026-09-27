'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ApiResponse, Category, Product, Promotion } from '@/types';
import { getCategories, getProducts, getPromotions } from '@/lib/api';

/**
 * Caché en memoria por visita: varias secciones piden el catálogo al mismo
 * tiempo (navbar, home, relacionados) y solo se hace una petición.
 */
type Entry<T> = { promise: Promise<ApiResponse<T>> | null; at: number };

const TTL_MS = 60_000;
const cache: Record<'products' | 'categories' | 'promotions', Entry<unknown>> = {
  products: { promise: null, at: 0 },
  categories: { promise: null, at: 0 },
  promotions: { promise: null, at: 0 },
};

function cached<T>(key: keyof typeof cache, loader: () => Promise<ApiResponse<T>>, force = false) {
  const entry = cache[key] as Entry<T>;
  if (force || !entry.promise || Date.now() - entry.at > TTL_MS) {
    entry.at = Date.now();
    entry.promise = loader().then((response) => {
      if (!response.ok) entry.at = 0; // Reintenta en la próxima llamada.
      return response;
    });
  }
  return entry.promise;
}

export function invalidateStoreCache() {
  cache.products.at = 0;
  cache.categories.at = 0;
  cache.promotions.at = 0;
}

interface ResourceState<T> {
  data: T;
  loading: boolean;
  error: string;
  reload: () => void;
}

function useResource<T>(
  key: keyof typeof cache,
  loader: () => Promise<ApiResponse<T>>,
  fallback: T
): ResourceState<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    cached<T>(key, loader, version > 0).then((response) => {
      if (!active) return;
      if (response.ok && response.data !== undefined) {
        setData(response.data);
        setError('');
      } else {
        setError(response.message || 'No se pudo cargar la información.');
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { data, loading, error, reload };
}

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_CATEGORIES: Category[] = [];
const EMPTY_PROMOTIONS: Promotion[] = [];

export function useProducts() {
  return useResource<Product[]>('products', () => getProducts(), EMPTY_PRODUCTS);
}

export function useCategories() {
  return useResource<Category[]>('categories', () => getCategories(), EMPTY_CATEGORIES);
}

export function usePromotions() {
  return useResource<Promotion[]>('promotions', () => getPromotions(), EMPTY_PROMOTIONS);
}
