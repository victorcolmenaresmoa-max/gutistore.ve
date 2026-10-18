'use client';

import { useMemo, useState } from 'react';
import type { OrderItem, OrderRecord } from '@/types';
import Icon from '@/components/Icons';
import { formatUSD } from '@/lib/currency';
import { ORDER_STATUSES, statusClass } from '@/lib/orders';
import { shortOrderId } from '@/lib/text';
import { orderWhatsappMessage, whatsappLink } from '@/lib/whatsapp';

function itemDetail(item: OrderItem) {
  const parts = [
    item.color && `Color: ${item.color}`,
    item.talla && `Talla: ${item.talla}`,
    item.opcion && `${item.opcionNombre || 'Opción'}: ${item.opcion}`,
    item.sku && `SKU: ${item.sku}`,
  ].filter(Boolean);
  if (!parts.length && item.varianteNombre) parts.push(item.varianteNombre);
  if (item.tipo === 'promocion') parts.unshift('Promoción');
  return parts.join(' · ');
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'Sin fecha';
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getOrderItems(order: OrderRecord) {
  return Array.isArray(order.items) ? order.items : [];
}

interface Props {
  orders: OrderRecord[];
  changingStatusId: string | null;
  onStatusChange: (id: string, status: string) => Promise<void>;
}

export default function AdminOrderList({
  orders,
  changingStatusId,
  onStatusChange,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter = filter === 'Todos' || order.estado === filter;
      const searchable = [
        order.cliente,
        order.telefono,
        order.email,
        order.ubicacion,
        order.vendedorNombre,
        order.vendedorCodigo,
        order.id,
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');
      return matchesFilter && (!term || searchable.includes(term));
    });
  }, [orders, filter, search]);

  const copyOrderSummary = async (order: OrderRecord) => {
    try {
      await navigator.clipboard.writeText(orderWhatsappMessage(order));
      setCopiedId(order.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <section className="admin-panel admin-orders-panel">
      <div className="admin-panel-heading admin-orders-heading">
        <div>
          <span className="eyebrow">Centro de pedidos</span>
          <h3>Solicitudes recibidas</h3>
          <p>Revisa cada pedido, cambia su estado y contacta al cliente con un mensaje listo.</p>
        </div>
        <span className="admin-count-pill">{orders.length}</span>
      </div>

      <div className="orders-toolbar">
        <div className="admin-search-box">
          <Icon name="search" size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por cliente, vendedor, WhatsApp, ubicación o ID"
          />
        </div>
        <div className="orders-filter-row">
          {['Todos', ...ORDER_STATUSES].map((status) => (
            <button
              key={status}
              className={`order-filter-chip ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty-state">
          <span className="empty-icon"><Icon name="orders" size={30} /></span>
          <h4>No hay pedidos para mostrar</h4>
          <p>Los pedidos que registren tus clientes desde el carrito aparecerán aquí.</p>
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map((order) => {
            const items = getOrderItems(order);
            const whatsappUrl = whatsappLink(order.telefono, orderWhatsappMessage(order));
            const expanded = expandedId === order.id;

            return (
              <article className={`order-card ${expanded ? 'expanded' : ''}`} key={order.id}>
                <div className="order-card-top">
                  <div className="order-avatar">{order.cliente.slice(0, 1).toUpperCase()}</div>
                  <div className="order-primary">
                    <div className="order-title-row">
                      <div>
                        <h4>{order.cliente}</h4>
                        <span>Pedido #{shortOrderId(order.id)} · {formatDate(order.fecha)}</span>
                        {order.vendedorNombre && (
                          <span className="order-seller-chip"><Icon name="users" size={13} /> {order.vendedorNombre} · {order.vendedorCodigo}</span>
                        )}
                      </div>
                      <span className={`order-status ${statusClass(order.estado)}`}>
                        {order.estado}
                      </span>
                    </div>
                    <div className="order-contact-row">
                      <span><Icon name="phone" size={15} /> {order.telefono || 'Sin teléfono'}</span>
                      <span><Icon name="location" size={15} /> {order.ubicacion || 'Ubicación no indicada'}</span>
                      {order.email && <span><Icon name="mail" size={15} /> {order.email}</span>}
                    </div>
                  </div>
                  <div className="order-total-block">
                    <small>Total</small>
                    <strong>{formatUSD(order.total)}</strong>
                    <span>USD</span>
                  </div>
                </div>

                <div className="order-products-preview">
                  {items.slice(0, 3).map((item, index) => (
                    <span key={`${order.id}-${item.id}-${item.varianteId || ''}-${index}`}>
                      {item.cantidad} × {item.nombre}
                      {item.varianteNombre ? ` · ${item.varianteNombre}` : ''}
                    </span>
                  ))}
                  {items.length > 3 && <span>+{items.length - 3} más</span>}
                  {items.length === 0 && <span>Producto por confirmar</span>}
                </div>

                <div className="order-actions-row">
                  <select
                    value={order.estado}
                    onChange={(event) => onStatusChange(order.id, event.target.value)}
                    disabled={changingStatusId === order.id}
                    aria-label="Cambiar estado del pedido"
                  >
                    {ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>

                  <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(expanded ? null : order.id)}>
                    {expanded ? 'Ocultar detalles' : 'Ver detalles'}
                  </button>

                  <button className="btn btn-ghost btn-sm" onClick={() => copyOrderSummary(order)}>
                    <Icon name={copiedId === order.id ? 'check' : 'copy'} size={16} />
                    {copiedId === order.id ? 'Copiado' : 'Copiar mensaje'}
                  </button>

                  <a
                    href={whatsappUrl || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className={`btn btn-whatsapp btn-sm ${!whatsappUrl ? 'disabled' : ''}`}
                    aria-disabled={!whatsappUrl}
                    onClick={(event) => {
                      if (!whatsappUrl) event.preventDefault();
                    }}
                  >
                    <Icon name="whatsapp" size={17} /> Contactar por WhatsApp
                  </a>
                  <small className="order-wa-hint">Mensaje según el estado: {order.estado}</small>
                </div>

                {expanded && (
                  <div className="order-details-grid order-details-grid-simplified">
                    <section>
                      <h5>Cliente y contacto</h5>
                      <dl>
                        <div><dt>Nombre</dt><dd>{order.cliente}</dd></div>
                        <div><dt>WhatsApp</dt><dd>{order.telefono || 'No indicado'}</dd></div>
                        <div><dt>Correo</dt><dd>{order.email || 'No indicado'}</dd></div>
                        <div><dt>Ubicación</dt><dd>{order.ubicacion || 'No indicada'}</dd></div>
                        <div><dt>Vendedor</dt><dd>{order.vendedorNombre ? `${order.vendedorNombre} (${order.vendedorCodigo})` : 'Pedido directo'}</dd></div>
                      </dl>
                    </section>

                    <section>
                      <h5>Entrega y pago</h5>
                      <dl>
                        <div><dt>Entrega</dt><dd>{order.metodoEntrega || 'Por confirmar'}</dd></div>
                        <div><dt>Dirección</dt><dd>{order.direccion || 'No aplica / no indicada'}</dd></div>
                        <div><dt>Pago</dt><dd>{order.metodoPago || 'Por confirmar'}</dd></div>
                        <div><dt>Notas</dt><dd>{order.notas || 'Sin notas adicionales'}</dd></div>
                      </dl>
                    </section>

                    <section className="order-detail-products">
                      <h5>Productos ({items.reduce((sum, item) => sum + item.cantidad, 0)})</h5>
                      <div>
                        {items.map((item, index) => (
                          <article key={`${order.id}-detail-${item.id}-${item.varianteId || ''}-${index}`}>
                            <span>
                              {item.cantidad} × {item.nombre}
                              {itemDetail(item) && <small>{itemDetail(item)}</small>}
                              <small>{formatUSD(item.precio)} c/u</small>
                            </span>
                            <strong>{formatUSD(item.subtotal ?? item.cantidad * item.precio)}</strong>
                          </article>
                        ))}
                        <article className="order-detail-total">
                          <span>Total estimado</span>
                          <strong>{formatUSD(order.total)} USD</strong>
                        </article>
                        {order.controlStock && (
                          <p className="order-stock-note">
                            <Icon name="info" size={13} /> El inventario se descontó al registrar el pedido. Si lo cancelas, se devuelve automáticamente.
                          </p>
                        )}
                      </div>
                    </section>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
