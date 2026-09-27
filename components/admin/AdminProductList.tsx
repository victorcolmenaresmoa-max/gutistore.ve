'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/types';
import Icon from '@/components/Icons';
import ProductImage from '@/components/ProductImage';
import { formatUSD } from '@/lib/currency';
import { activeVariants, hasVariants, isOnSale, priceRange, productUrl, totalStock } from '@/lib/product';
import { normalizeText } from '@/lib/text';

interface Props {
  products: Product[];
  onCreate: () => void;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleActive: (product: Product) => void;
  busyId: string | null;
}

const LOW_STOCK = 5;

export default function AdminProductList({ products, onCreate, onEdit, onDuplicate, onDelete, onToggleActive, busyId }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'todos' | 'activos' | 'inactivos' | 'bajo' | 'agotados'>('todos');

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.categoria))).sort((a, b) => a.localeCompare(b, 'es')), [products]);

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    return products.filter((product) => {
      const stock = totalStock(product);
      if (category && product.categoria !== category) return false;
      if (status === 'activos' && !product.activo) return false;
      if (status === 'inactivos' && product.activo) return false;
      if (status === 'bajo' && !(stock > 0 && stock <= LOW_STOCK)) return false;
      if (status === 'agotados' && stock > 0) return false;
      if (!term) return true;
      return normalizeText([product.nombre, product.marca, product.sku, product.categoria, product.subcategoria].join(' ')).includes(term);
    });
  }, [products, search, category, status]);

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">Inventario</span>
          <h3>Productos</h3>
          <p>
            {products.length} en total · {products.filter((p) => p.activo).length} visibles en la tienda
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onCreate}>
          <Icon name="plus" size={17} /> Nuevo producto
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-box">
          <Icon name="search" size={17} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, marca, SKU o categoría" aria-label="Buscar productos" />
        </div>
        <div className="select-wrap">
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filtrar por categoría">
            <option value="">Todas las categorías</option>
            {categories.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <Icon name="chevronDown" size={16} />
        </div>
        <div className="select-wrap">
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filtrar por estado">
            <option value="todos">Todos los estados</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
            <option value="bajo">Stock bajo</option>
            <option value="agotados">Agotados</option>
          </select>
          <Icon name="chevronDown" size={16} />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="admin-empty-state">
          <span className="empty-icon">
            <Icon name="package" size={28} />
          </span>
          <h4>Aún no hay productos</h4>
          <p>Crea el primero: ropa, calzado, accesorios, suplementos… lo que quieras vender.</p>
          <button type="button" className="btn btn-primary" onClick={onCreate}>
            <Icon name="plus" size={16} /> Crear producto
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty-state">
          <h4>Sin resultados</h4>
          <p>Ningún producto coincide con los filtros.</p>
        </div>
      ) : (
        <div className="admin-product-list">
          {filtered.map((product) => {
            const stock = totalStock(product);
            const range = priceRange(product);
            const variants = activeVariants(product).length;
            const busy = busyId === product.id;
            return (
              <article className={`admin-product-row ${product.activo ? '' : 'is-inactive'}`} key={product.id}>
                <div className="admin-product-thumb">
                  <ProductImage src={product.imagen} alt="" />
                </div>
                <div className="admin-product-main">
                  <div className="admin-product-title-row">
                    <h4>{product.nombre}</h4>
                    <div className="admin-badges">
                      {!product.activo && <span className="mini-badge off">Inactivo</span>}
                      {product.destacado && <span className="mini-badge">Destacado</span>}
                      {product.nuevo && <span className="mini-badge">Nuevo</span>}
                      {isOnSale(product) && <span className="mini-badge red">Oferta</span>}
                    </div>
                  </div>
                  <span className="admin-product-meta">
                    {[product.categoria, product.subcategoria, product.marca].filter(Boolean).join(' · ')}
                    {product.sku ? ` · SKU ${product.sku}` : ''}
                  </span>
                  <div className="admin-product-metrics">
                    <span>
                      <small>Precio</small>
                      <strong>
                        {range.min !== range.max ? `${formatUSD(range.min)} – ${formatUSD(range.max)}` : formatUSD(range.min)}
                      </strong>
                    </span>
                    <span>
                      <small>Stock</small>
                      <strong className={stock === 0 ? 'stock-out' : stock <= LOW_STOCK ? 'stock-low' : ''}>
                        {stock} {hasVariants(product) ? `en ${variants} variante${variants === 1 ? '' : 's'}` : 'unidades'}
                      </strong>
                    </span>
                  </div>
                </div>
                <div className="admin-row-actions">
                  <a href={productUrl(product)} target="_blank" rel="noreferrer" className="admin-icon-btn" title="Ver en la tienda" aria-label={`Ver ${product.nombre} en la tienda`}>
                    <Icon name="externalLink" size={16} />
                  </a>
                  <button type="button" className="admin-icon-btn" onClick={() => onToggleActive(product)} disabled={busy} title={product.activo ? 'Ocultar de la tienda' : 'Publicar'} aria-label={product.activo ? `Ocultar ${product.nombre}` : `Publicar ${product.nombre}`}>
                    <Icon name={product.activo ? 'eye' : 'eyeOff'} size={16} />
                  </button>
                  <button type="button" className="admin-icon-btn" onClick={() => onDuplicate(product)} disabled={busy} title="Duplicar" aria-label={`Duplicar ${product.nombre}`}>
                    <Icon name="copy" size={16} />
                  </button>
                  <button type="button" className="admin-icon-btn" onClick={() => onEdit(product)} disabled={busy} title="Editar" aria-label={`Editar ${product.nombre}`}>
                    <Icon name="edit" size={16} />
                  </button>
                  <button type="button" className="admin-icon-btn danger" onClick={() => onDelete(product)} disabled={busy} title="Eliminar" aria-label={`Eliminar ${product.nombre}`}>
                    {busy ? <span className="spinner" /> : <Icon name="trash" size={16} />}
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
