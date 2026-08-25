'use client';

import { Promotion } from '@/types';
import Icon from './Icons';

interface Props {
  promotions: Promotion[];
  onEdit: (promotion: Promotion) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export default function AdminPromotionList({
  promotions,
  onEdit,
  onDelete,
  deletingId,
}: Props) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">Promociones</span>
          <h3>Ofertas publicadas</h3>
        </div>
        <span className="admin-count-pill">{promotions.length}</span>
      </div>

      {promotions.length === 0 ? (
        <div className="admin-empty-state">
          <span className="empty-icon"><Icon name="tag" size={30} /></span>
          <h4>Aún no hay ofertas</h4>
          <p>Crea tu primer combo usando el formulario.</p>
        </div>
      ) : (
        <div className="admin-product-list">
          {promotions.map((promotion) => {
            const photoCount = Array.from(
              new Set(
                [promotion.imagen, ...(promotion.imagenes || [])]
                  .map((url) => (url || '').trim())
                  .filter((url) => url !== '')
              )
            ).length;
            const items = (promotion.productos || '')
              .split(/[\r\n]+/)
              .map((item) => item.trim())
              .filter((item) => item !== '');

            return (
              <article className="admin-product-row" key={promotion.id}>
                <img
                  src={promotion.imagen || 'https://placehold.co/180x180/6d0b2f/ffffff?text=Oferta'}
                  alt={promotion.titulo}
                />
                <div className="admin-product-main">
                  <div className="admin-product-title-row">
                    <div>
                      <h4>{promotion.titulo}</h4>
                      <span>
                        {items.length > 0 ? `${items.length} producto${items.length === 1 ? '' : 's'} incluidos` : 'Oferta'}
                        {photoCount > 0 ? ` · ${photoCount} foto${photoCount === 1 ? '' : 's'}` : ''}
                      </span>
                    </div>
                    <div className="admin-promo-badges">
                      {promotion.destacado && <span className="mini-featured"><Icon name="sparkles" size={12} /> Destacada</span>}
                      <span className={`mini-status ${promotion.activo === false ? 'off' : 'on'}`}>
                        {promotion.activo === false ? 'Inactiva' : 'Activa'}
                      </span>
                    </div>
                  </div>
                  {promotion.descripcion && <p>{promotion.descripcion}</p>}
                  <div className="admin-product-metrics">
                    <span><small>Precio oferta</small><strong>${promotion.precio.toFixed(2)} USD</strong></span>
                    {promotion.precioRegular && promotion.precioRegular > promotion.precio ? (
                      <span><small>Precio regular</small><strong>${promotion.precioRegular.toFixed(2)} USD</strong></span>
                    ) : null}
                  </div>
                </div>
                <div className="admin-row-actions">
                  <button className="admin-action-btn" onClick={() => onEdit(promotion)} title="Editar oferta">
                    <Icon name="edit" size={17} />
                  </button>
                  <button className="admin-action-btn danger" onClick={() => onDelete(promotion.id)} disabled={deletingId === promotion.id} title="Eliminar oferta">
                    {deletingId === promotion.id ? <span className="spinner" /> : <Icon name="trash" size={17} />}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
