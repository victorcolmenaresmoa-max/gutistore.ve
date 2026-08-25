'use client';

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import { OrderRecord, Seller } from '@/types';
import { normalizeSellerCode } from '@/lib/referral';
import Icon from './Icons';
import { ORDER_STATUSES } from './AdminOrderList';

export interface SellerSaveInput {
  id?: string;
  nombre: string;
  codigo: string;
  activo: boolean;
  fechaCreacion?: string;
}

interface Props {
  sellers: Seller[];
  orders: OrderRecord[];
  savingSellerId: string | null;
  onSave: (seller: SellerSaveInput) => Promise<boolean>;
  onToggle: (seller: Seller) => Promise<void>;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'Sin fecha';
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function createCodePreview(name: string) {
  return normalizeSellerCode(
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
  );
}

function getProductSummary(order: OrderRecord) {
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) return 'Producto por confirmar';
  return items.map((item) => `${item.cantidad} × ${item.nombre}`).join(', ');
}

export default function AdminSellerDashboard({
  sellers,
  orders,
  savingSellerId,
  onSave,
  onToggle,
}: Props) {
  const [origin, setOrigin] = useState('');
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sellerFilter, setSellerFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const referredOrders = useMemo(
    () => orders.filter((order) => Boolean(order.vendedorCodigo)),
    [orders]
  );

  const sellerMetrics = useMemo(() => {
    const metrics = new Map<string, { orders: number; activeOrders: number; total: number }>();

    sellers.forEach((seller) => {
      metrics.set(seller.id, { orders: 0, activeOrders: 0, total: 0 });
    });

    const sellerIdsByCode = new Map(sellers.map((seller) => [seller.codigo, seller.id]));

    referredOrders.forEach((order) => {
      const key = order.vendedorId || sellerIdsByCode.get(order.vendedorCodigo || '') || order.vendedorCodigo || '';
      const current = metrics.get(key) || { orders: 0, activeOrders: 0, total: 0 };
      current.orders += 1;
      if (order.estado !== 'Cancelado') {
        current.activeOrders += 1;
        current.total += order.total;
      }
      metrics.set(key, current);
    });

    return metrics;
  }, [referredOrders, sellers]);

  const overallStats = useMemo(() => {
    const activeSellers = sellers.filter((seller) => seller.activo).length;
    const validOrders = referredOrders.filter((order) => order.estado !== 'Cancelado');
    const total = validOrders.reduce((sum, order) => sum + order.total, 0);
    const delivered = referredOrders.filter((order) => order.estado === 'Entregado').length;
    return { activeSellers, orders: referredOrders.length, total, delivered };
  }, [referredOrders, sellers]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return referredOrders.filter((order) => {
      const selectedSeller = sellers.find((seller) => seller.id === sellerFilter);
      const matchesSeller = sellerFilter === 'Todos' || order.vendedorId === sellerFilter || order.vendedorCodigo === selectedSeller?.codigo;
      const matchesStatus = statusFilter === 'Todos' || order.estado === statusFilter;
      const searchable = [
        order.vendedorNombre,
        order.vendedorCodigo,
        order.cliente,
        order.telefono,
        order.id,
        getProductSummary(order),
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');

      return matchesSeller && matchesStatus && (!term || searchable.includes(term));
    });
  }, [referredOrders, search, sellerFilter, sellers, statusFilter]);

  const formCode = normalizeSellerCode(code) || createCodePreview(name) || 'VENDEDOR';
  const previewUrl = `${origin || 'https://tu-dominio.com'}/?ref=${formCode}`;

  const resetForm = () => {
    setEditingSeller(null);
    setName('');
    setCode('');
    setFormError('');
  };

  const startEditing = (seller: Seller) => {
    setEditingSeller(seller);
    setName(seller.nombre);
    setCode(seller.codigo);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitSeller = async (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setFormError('Escribe el nombre del vendedor.');
      return;
    }

    setFormError('');
    const saved = await onSave({
      id: editingSeller?.id,
      nombre: cleanName,
      codigo: normalizeSellerCode(code),
      activo: editingSeller?.activo ?? true,
      fechaCreacion: editingSeller?.fechaCreacion,
    });

    if (saved) resetForm();
  };

  const copyLink = async (seller: Seller) => {
    const url = `${origin || window.location.origin}/?ref=${seller.codigo}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(seller.codigo);
      window.setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      setCopiedCode(null);
    }
  };

  return (
    <div className="seller-dashboard">
      <section className="seller-overview-grid" aria-label="Resumen de vendedores">
        <article>
          <span><Icon name="users" size={19} /></span>
          <div><small>Vendedores activos</small><strong>{overallStats.activeSellers}</strong></div>
        </article>
        <article>
          <span><Icon name="orders" size={19} /></span>
          <div><small>Pedidos referidos</small><strong>{overallStats.orders}</strong></div>
        </article>
        <article>
          <span><Icon name="dollar" size={19} /></span>
          <div><small>Valor referido</small><strong>${overallStats.total.toFixed(2)}</strong></div>
        </article>
        <article>
          <span><Icon name="check" size={19} /></span>
          <div><small>Pedidos entregados</small><strong>{overallStats.delivered}</strong></div>
        </article>
      </section>

      <div className="seller-management-grid">
        <section className="admin-panel seller-form-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">Enlace individual</span>
              <h3>{editingSeller ? 'Editar vendedor' : 'Crear vendedor'}</h3>
              <p>El código quedará guardado durante 30 días en el dispositivo del cliente.</p>
            </div>
            <span className="admin-count-pill"><Icon name="users" size={15} /></span>
          </div>

          <form className="seller-form" onSubmit={submitSeller}>
            {formError && <div className="alert alert-error">{formError}</div>}

            <div className="field">
              <label htmlFor="seller-name">Nombre del vendedor *</label>
              <input
                id="seller-name"
                value={name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
                placeholder="Ej.: María González"
                autoComplete="off"
              />
            </div>

            <div className="field">
              <label htmlFor="seller-code">Código del enlace <span className="optional-label">Opcional</span></label>
              <input
                id="seller-code"
                value={code}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setCode(normalizeSellerCode(event.target.value))}
                placeholder="Se genera desde el nombre"
                autoComplete="off"
              />
              <small className="seller-field-help">Solo letras, números, guiones y guiones bajos.</small>
            </div>

            <div className="seller-link-preview">
              <span><Icon name="copy" size={16} /></span>
              <div>
                <small>Vista previa del enlace</small>
                <strong>{previewUrl}</strong>
              </div>
            </div>

            <div className="admin-form-actions seller-form-actions">
              {editingSeller && (
                <button type="button" className="btn btn-outline" onClick={resetForm} disabled={savingSellerId !== null}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={savingSellerId !== null}>
                {savingSellerId === (editingSeller?.id || 'new') ? (
                  <><span className="spinner" /> Guardando...</>
                ) : (
                  <><Icon name={editingSeller ? 'check' : 'plus'} size={16} /> {editingSeller ? 'Guardar cambios' : 'Crear vendedor'}</>
                )}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-panel seller-directory-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">Equipo comercial</span>
              <h3>Links de vendedores</h3>
              <p>Copia cada enlace y compártelo directamente con el vendedor correspondiente.</p>
            </div>
            <span className="admin-count-pill">{sellers.length}</span>
          </div>

          {sellers.length === 0 ? (
            <div className="admin-empty-state seller-empty-state">
              <span className="empty-icon"><Icon name="users" size={30} /></span>
              <h4>Aún no hay vendedores</h4>
              <p>Crea el primero para generar su enlace personalizado.</p>
            </div>
          ) : (
            <div className="seller-list">
              {sellers.map((seller) => {
                const metrics = sellerMetrics.get(seller.id) || { orders: 0, activeOrders: 0, total: 0 };
                const url = `${origin || 'https://tu-dominio.com'}/?ref=${seller.codigo}`;
                const isSaving = savingSellerId === seller.id;

                return (
                  <article className={`seller-card ${seller.activo ? '' : 'inactive'}`} key={seller.id}>
                    <div className="seller-card-header">
                      <span className="seller-avatar">{seller.nombre.slice(0, 1).toUpperCase()}</span>
                      <div>
                        <h4>{seller.nombre}</h4>
                        <span className={`seller-status ${seller.activo ? 'active' : 'inactive'}`}>
                          {seller.activo ? 'Link activo' : 'Link desactivado'}
                        </span>
                      </div>
                    </div>

                    <button className="seller-url-box" onClick={() => copyLink(seller)} title="Copiar enlace">
                      <span>{url}</span>
                      <Icon name={copiedCode === seller.codigo ? 'check' : 'copy'} size={15} />
                    </button>

                    <div className="seller-card-metrics">
                      <div><small>Pedidos</small><strong>{metrics.orders}</strong></div>
                      <div><small>Vigentes</small><strong>{metrics.activeOrders}</strong></div>
                      <div><small>Total</small><strong>${metrics.total.toFixed(2)}</strong></div>
                    </div>

                    <div className="seller-card-actions">
                      <button className="admin-action-btn" onClick={() => startEditing(seller)} disabled={isSaving}>
                        <Icon name="edit" size={15} /> Editar
                      </button>
                      <button className="admin-action-btn" onClick={() => copyLink(seller)} disabled={isSaving}>
                        <Icon name={copiedCode === seller.codigo ? 'check' : 'copy'} size={15} />
                        {copiedCode === seller.codigo ? 'Copiado' : 'Copiar link'}
                      </button>
                      <button
                        className={`admin-action-btn ${seller.activo ? 'danger' : ''}`}
                        onClick={() => onToggle(seller)}
                        disabled={isSaving}
                      >
                        {isSaving ? <span className="spinner" /> : <Icon name={seller.activo ? 'close' : 'check'} size={15} />}
                        {seller.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="admin-panel seller-sales-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="eyebrow">Rendimiento comercial</span>
            <h3>Pedidos por vendedor</h3>
            <p>Solo aparecen pedidos realizados después de entrar mediante un enlace de vendedor válido.</p>
          </div>
          <span className="admin-count-pill">{referredOrders.length}</span>
        </div>

        <div className="seller-sales-toolbar">
          <div className="admin-search-box">
            <Icon name="search" size={17} />
            <input
              value={search}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
              placeholder="Buscar vendedor, cliente, producto o pedido"
            />
          </div>
          <select value={sellerFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setSellerFilter(event.target.value)}>
            <option value="Todos">Todos los vendedores</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>{seller.nombre}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatusFilter(event.target.value)}>
            <option value="Todos">Todos los estados</option>
            {ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="admin-empty-state seller-empty-state">
            <span className="empty-icon"><Icon name="barChart" size={30} /></span>
            <h4>No hay pedidos referidos para mostrar</h4>
            <p>Cuando un cliente compre usando un link de vendedor, el pedido aparecerá aquí.</p>
          </div>
        ) : (
          <div className="seller-sales-list">
            <div className="seller-sales-header" aria-hidden="true">
              <span>Vendedor</span><span>Pedido y cliente</span><span>Producto</span><span>Estado</span><span>Total</span>
            </div>
            {filteredOrders.map((order) => (
              <article className="seller-sale-row" key={order.id}>
                <div className="seller-sale-person">
                  <span className="seller-avatar small">{(order.vendedorNombre || 'V').slice(0, 1).toUpperCase()}</span>
                  <div><strong>{order.vendedorNombre || order.vendedorCodigo}</strong><small>{order.vendedorCodigo}</small></div>
                </div>
                <div className="seller-sale-order">
                  <strong>{order.cliente}</strong>
                  <small>#{order.id.slice(0, 8).toUpperCase()} · {formatDate(order.fecha)}</small>
                </div>
                <p className="seller-sale-products">{getProductSummary(order)}</p>
                <span className={`order-status status-${order.estado.toLowerCase().replace(/\s+/g, '-')}`}>{order.estado}</span>
                <strong className="seller-sale-total">${order.total.toFixed(2)}</strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
