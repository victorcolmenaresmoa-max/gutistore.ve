'use client';

import { useEffect, useMemo, useState } from 'react';
import { getPromotions } from '@/lib/api';
import { Product, Promotion } from '@/types';
import Icon from './Icons';
import PromotionCard from './PromotionCard';
import CheckoutForm from './CheckoutForm';

function promotionToProduct(promotion: Promotion): Product {
  const items = promotion.productos
    .split(/[\r\n]+/)
    .map((item) => item.trim())
    .filter((item) => item !== '');

  return {
    id: promotion.id,
    nombre: `Oferta: ${promotion.titulo}`,
    descripcion:
      promotion.descripcion ||
      (items.length > 0 ? `Incluye: ${items.join(', ')}` : promotion.titulo),
    precio: promotion.precio,
    categoria: 'Oferta',
    imagen: promotion.imagen,
    imagenes: promotion.imagenes || [],
    stock: 999,
    presentacion: items.length > 0 ? `Incluye: ${items.join(' + ')}` : 'Oferta en combo',
  };
}

export default function PromotionsSection() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selected, setSelected] = useState<Promotion | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const response = await getPromotions();
      if (!active) return;
      if (response.ok && response.data) {
        setPromotions(response.data);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const activePromotions = useMemo(
    () => promotions.filter((promotion) => promotion.activo !== false),
    [promotions]
  );

  if (activePromotions.length === 0) return null;

  return (
    <>
      <section className="section promotions-section" id="ofertas">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow"><Icon name="tag" size={13} /> Ofertas en combo</span>
              <h2>Promociones especiales</h2>
              <p>
                Combos y paquetes seleccionados a un precio más bajo. Disponibles por
                tiempo limitado: solicítalos igual que cualquier producto.
              </p>
            </div>
            <a href="#catalogo" className="btn btn-outline">
              Ver todo el catálogo <Icon name="arrowRight" size={16} />
            </a>
          </div>

          <div className="promotions-grid">
            {activePromotions.map((promotion) => (
              <PromotionCard
                key={promotion.id}
                promotion={promotion}
                onRequest={setSelected}
              />
            ))}
          </div>
        </div>
      </section>

      {selected && (
        <CheckoutForm
          product={promotionToProduct(selected)}
          quantity={1}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
