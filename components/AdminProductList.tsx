'use client';

import { Product } from '@/types';
import Icon from './Icons';

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export default function AdminProductList({
  products,
  onEdit,
  onDelete,
  deletingId,
}: Props) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">Inventario</span>
          <h3>Productos publicados</h3>
        </div>
        <span className="admin-count-pill">{products.length}</span>
      </div>

      {products.length === 0 ? (
        <div className="admin-empty-state">
          <span className="empty-icon"><Icon name="package" size={30} /></span>
          <h4>Aún no hay productos</h4>
          <p>Crea el primero usando el formulario.</p>
        </div>
      ) : (
        <div className="admin-product-list">
          {products.map((product) => (
            <article className="admin-product-row" key={product.id}>
              <img
                src={product.imagen || 'https://placehold.co/180x180/5d0a2a/ffffff?text=GS'}
                alt={product.nombre}
              />
              <div className="admin-product-main">
                <div className="admin-product-title-row">
                  <div>
                    <h4>{product.nombre}</h4>
                    <span>{product.categoria || 'General'}{product.presentacion ? ` · ${product.presentacion}` : ''}</span>
                  </div>
                  {product.destacado && <span className="mini-featured"><Icon name="sparkles" size={12} /> Destacado</span>}
                </div>
                <p>{product.descripcion}</p>
                <div className="admin-product-metrics">
                  <span><small>Precio</small><strong>${product.precio.toFixed(2)} USD</strong></span>
                  <span><small>Stock</small><strong className={product.stock <= 5 ? 'low-stock' : ''}>{product.stock} unidades</strong></span>
                </div>
              </div>
              <div className="admin-row-actions">
                <button className="admin-action-btn" onClick={() => onEdit(product)} title="Editar producto">
                  <Icon name="edit" size={17} />
                </button>
                <button className="admin-action-btn danger" onClick={() => onDelete(product.id)} disabled={deletingId === product.id} title="Eliminar producto">
                  {deletingId === product.id ? <span className="spinner" /> : <Icon name="trash" size={17} />}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
