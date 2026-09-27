import type { Metadata } from 'next';
import { Suspense } from 'react';
import CatalogView from '@/components/catalog/CatalogView';
import PromotionsSection from '@/components/promotions/PromotionsSection';
import { ProductGrid } from '@/components/product/ProductCard';

export const metadata: Metadata = {
  title: 'Ofertas',
  description: 'Promociones, combos y productos con precio especial en GutiStore.',
  alternates: { canonical: '/ofertas' },
};

const FORCED = { oferta: true };

export default function OffersPage() {
  return (
    <>
      <Suspense
        fallback={
          <div className="container catalog-fallback">
            <ProductGrid products={[]} loading skeletons={4} />
          </div>
        }
      >
        <CatalogView title="Ofertas" eyebrow="Precios especiales" basePath="/ofertas" forced={FORCED} />
      </Suspense>
      <PromotionsSection title="Combos y campañas" showLink={false} />
    </>
  );
}
