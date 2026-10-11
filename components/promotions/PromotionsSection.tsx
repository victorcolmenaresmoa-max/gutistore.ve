'use client';

import SectionHeading from '@/components/ui/SectionHeading';
import { usePromotions } from '@/hooks/useStoreData';
import PromotionCard from './PromotionCard';

/**
 * Promociones reales de Supabase (tabla `promociones`). Si no hay promociones
 * activas, la sección no se muestra: nunca se inventan ofertas.
 */
export default function PromotionsSection({
  title = 'Combos y promociones',
  description = 'Packs a precio especial. Se agregan al carrito como cualquier producto.',
  showLink = true,
  limit,
}: {
  title?: string;
  description?: string;
  showLink?: boolean;
  limit?: number;
}) {
  const { data, loading } = usePromotions();
  const promotions = data.filter((promotion) => promotion.activo !== false).slice(0, limit);

  if (loading || promotions.length === 0) return null;

  return (
    <section className="section promotions-section" id="promociones" aria-labelledby="promotions-title">
      <div className="container">
        <SectionHeading
          id="promotions-title"
          title={title}
          description={description}
          href={showLink ? '/ofertas' : undefined}
          linkLabel="Ver ofertas"
        />
        <div className="promotions-grid">
          {promotions.map((promotion) => (
            <PromotionCard key={promotion.id} promotion={promotion} />
          ))}
        </div>
      </div>
    </section>
  );
}
