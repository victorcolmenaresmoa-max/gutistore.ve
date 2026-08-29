import type { Metadata } from 'next';
import CatalogView from '@/components/CatalogView';

export const metadata: Metadata = { title: 'Productos', description: 'Explora todos los productos disponibles en GutiStore.' };

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<{ q?: string }> | { q?: string } }) {
  const params = await Promise.resolve(searchParams || {});
  return <CatalogView initialQuery={String(params.q || '')} />;
}
