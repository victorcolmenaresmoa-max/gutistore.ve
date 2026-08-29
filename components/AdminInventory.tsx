'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/types';
import { updateProduct } from '@/lib/api';
import Icon from './Icons';

export default function AdminInventory({ products, onProductUpdated }: { products: Product[]; onProductUpdated: (product: Product) => void }) {
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const low = useMemo(() => products.filter((product) => product.stock <= 5), [products]);

  const saveBase = async (product: Product) => {
    const stock = drafts[`p:${product.id}`] ?? product.stock;
    setSaving(product.id); setError('');
    const response = await updateProduct({ ...product, stock });
    setSaving(null);
    if (response.ok && response.data) onProductUpdated(response.data);
    else setError(response.message || 'No se pudo actualizar el stock.');
  };

  const saveVariant = async (product: Product, variantId: string) => {
    const variants = (product.variantes || []).map((variant) => variant.id === variantId ? { ...variant, stock: drafts[`v:${variantId}`] ?? variant.stock } : variant);
    setSaving(variantId); setError('');
    const response = await updateProduct({ ...product, variantes: variants, stock: variants.reduce((sum, variant) => sum + variant.stock, 0) });
    setSaving(null);
    if (response.ok && response.data) onProductUpdated(response.data);
    else setError(response.message || 'No se pudo actualizar la variante.');
  };

  return <section className="admin-panel admin-inventory-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Inventario</span><h3>Stock por producto y variante</h3><p>Los cambios se reflejan en la tienda inmediatamente después de guardar.</p></div><span className="admin-count-pill">{low.length} bajo stock</span></div>{error && <div className="alert alert-error">{error}</div>}{products.length ? <div className="inventory-list">{products.map((product) => <article className="inventory-card" key={product.id}><div className="inventory-product-head"><div><strong>{product.nombre}</strong><span>{product.categoria} · {product.marca || 'Sin marca'}</span></div><b className={product.stock <= 5 ? 'low-stock' : ''}>{product.stock} total</b></div>{product.variantes?.length ? <div className="inventory-variants">{product.variantes.map((variant) => <div className="inventory-row" key={variant.id}><div><strong>{Object.entries(variant.attributes).map(([k,v]) => `${k}: ${v}`).join(' · ')}</strong><small>{variant.sku || 'Sin SKU'}</small></div><input type="number" min="0" value={drafts[`v:${variant.id}`] ?? variant.stock} onChange={(event) => setDrafts((current) => ({ ...current, [`v:${variant.id}`]: Math.max(0, Number(event.target.value) || 0) }))} /><button className="btn btn-outline btn-sm" onClick={() => variant.id && void saveVariant(product, variant.id)} disabled={saving === variant.id}>{saving === variant.id ? <span className="spinner" /> : <><Icon name="check" size={14} /> Guardar</>}</button></div>)}</div> : <div className="inventory-row"><div><strong>Producto sin variantes</strong><small>Stock general</small></div><input type="number" min="0" value={drafts[`p:${product.id}`] ?? product.stock} onChange={(event) => setDrafts((current) => ({ ...current, [`p:${product.id}`]: Math.max(0, Number(event.target.value) || 0) }))} /><button className="btn btn-outline btn-sm" onClick={() => void saveBase(product)} disabled={saving === product.id}>{saving === product.id ? <span className="spinner" /> : <><Icon name="check" size={14} /> Guardar</>}</button></div>}</article>)}</div> : <div className="admin-empty-state"><Icon name="package" size={28} /><h4>No hay productos</h4></div>}</section>;
}
