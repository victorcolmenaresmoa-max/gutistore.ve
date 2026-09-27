'use client';

import Link from 'next/link';
import Icon from '@/components/Icons';
import { usePromotions } from '@/hooks/useStoreData';
import PromotionCard from './PromotionCard';

/**
 * Promociones reales de Supabase (tabla `promociones`). Si no hay promociones
 * activas, la sección no se muestra: nunca se inventan ofertas.
 */
export default function PromotionsSection({
  title = 'Promociones y combos',
  description = 'Combos, packs y campañas por tiempo limitado. Se agregan al carrito como cualquier producto.',
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
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              <Icon name="tag" size={13} /> Promociones
            </span>
            <h2 id="promotions-title">{title}</h2>
            <p>{description}</p>
          </div>
          {showLink && (
            <Link href="/ofertas" className="btn btn-outline-dark btn-sm">
              Ver todas las ofertas <Icon name="arrowRight" size={15} />
            </Link>
          )}
        </div>
        <div className="promotions-grid">
          {promotions.map((promotion) => (
            <PromotionCard key={promotion.id} promotion={promotion} />
          ))}
        </div>
      </div>
    </section>
  );
}
