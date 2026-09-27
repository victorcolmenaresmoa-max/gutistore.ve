import type { Metadata } from 'next';
import { Suspense } from 'react';
import CatalogView from '@/components/catalog/CatalogView';
import { ProductGrid } from '@/components/product/ProductCard';

export const metadata: Metadata = {
  title: 'Tienda',
  description:
    'Explora ropa deportiva, calzado, lentes, accesorios, hidratación y suplementos. Filtra por categoría, talla, color, marca y precio.',
  alternates: { canonical: '/tienda' },
};

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="container catalog-fallback">
          <ProductGrid products={[]} loading skeletons={8} />
        </div>
      }
    >
      <CatalogView />
    </Suspense>
  );
}
