'use client';

import { useEffect, useMemo, useState } from 'react';
import { createOrder } from '@/lib/api';
import { Product } from '@/types';
import { formatUSD } from '@/lib/currency';
import { getStoredSellerReferral } from '@/lib/referral';
import Icon from './Icons';

const INITIAL_FORM = {
  cliente: '',
  telefono: '',
  email: '',
  ubicacion: '',
  metodoEntrega: 'Envío a domicilio',
  direccion: '',
  metodoPago: 'Por definir con el asesor',
  notas: '',
};

interface CheckoutFormProps {
  product: Product;
  quantity: number;
  onClose: () => void;
}

export default function CheckoutForm({ product, quantity, onClose }: CheckoutFormProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState('');

  const total = useMemo(() => product.precio * quantity, [product.precio, quantity]);
  const needsAddress = form.metodoEntrega !== 'Retiro coordinado';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, onClose]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.cliente.trim() || !form.telefono.trim() || !form.ubicacion.trim()) {
      setError('Completa tu nombre, WhatsApp y ciudad o estado.');
      return;
    }

    if (needsAddress && !form.direccion.trim()) {
      setError('Indica la dirección o agencia donde deseas recibir el producto.');
      return;
    }

    if (form.telefono.replace(/\D/g, '').length < 8) {
      setError('Ingresa un número de WhatsApp válido, incluyendo el código de país.');
      return;
    }

    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('El correo electrónico no parece válido. Puedes dejarlo vacío.');
      return;
    }

    const vendedorCodigo = getStoredSellerReferral();

    setLoading(true);
    const response = await createOrder({
      ...form,
      direccion: needsAddress ? form.direccion : '',
      items: [
        {
          id: product.id,
          nombre: product.nombre,
          precio: product.precio,
          cantidad: quantity,
        },
      ],
      total,
      vendedorCodigo: vendedorCodigo || undefined,
    });
    setLoading(false);

    if (response.ok && response.data) {
      setSuccessId(response.data.id);
    } else {
      setError(response.message || 'No fue posible registrar el pedido. Inténtalo nuevamente.');
    }
  };

  if (successId) {
    return (
      <div className="modal-panel modal-backdrop" role="dialog" aria-modal="true">
        <div className="modal-card success-card direct-success-card">
          <span className="success-icon"><Icon name="check" size={34} /></span>
          <span className="eyebrow">Solicitud registrada</span>
          <h3>¡Pedido recibido!</h3>
          <p>
            Gracias, {form.cliente.split(' ')[0]}. Tu solicitud
            <strong> #{successId.slice(0, 8).toUpperCase()}</strong> quedó registrada.
            GutiSupplements te contactará por WhatsApp para confirmar los detalles.
          </p>
          <div className="success-product-summary">
            <img
              src={product.imagen || 'https://placehold.co/120x120/5d0a2a/fff?text=GS'}
              alt=""
            />
            <div>
              <strong>{product.nombre}</strong>
              <span>{quantity} × ${product.precio.toFixed(2)}</span>
            </div>
            <b>
              {formatUSD(total)} USD
            </b>
          </div>
          <button className="btn btn-primary btn-block" onClick={onClose}>
            Volver al producto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal-panel modal-backdrop direct-order-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="direct-order-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
    >
      <div className="direct-order-card">
        <div className="direct-order-header">
          <div>
            <span className="eyebrow">Solicitud directa</span>
            <h3 id="direct-order-title">Finaliza tu pedido</h3>
            <p>Solo necesitamos los datos esenciales para poder contactarte.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar formulario" disabled={loading}>
            <Icon name="close" size={19} />
          </button>
        </div>

        <div className="direct-order-body">
          <aside className="direct-product-summary">
            <span className="eyebrow">Producto seleccionado</span>
            <div className="direct-product-summary-main">
              <img
                src={product.imagen || 'https://placehold.co/180x180/5d0a2a/fff?text=GS'}
                alt={product.nombre}
              />
              <div>
                <h4>{product.nombre}</h4>
                {product.presentacion && <p>{product.presentacion}</p>}
                <span>{quantity} unidad{quantity === 1 ? '' : 'es'} × ${product.precio.toFixed(2)}</span>
              </div>
            </div>
            <div className="direct-product-total">
              <span>Total estimado</span>
              <strong>${total.toFixed(2)} <small>USD</small></strong>
            </div>
            <div className="direct-product-note">
              <Icon name="shield" size={18} />
              <p>No se genera ningún cobro automático al enviar esta solicitud.</p>
            </div>
          </aside>

          <form className="direct-order-form" onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="compact-form-grid">
              <div className="field field-span-2">
                <label htmlFor="cliente">Nombre y apellido *</label>
                <input
                  id="cliente"
                  name="cliente"
                  value={form.cliente}
                  onChange={handleChange}
                  placeholder="Tu nombre completo"
                  autoComplete="name"
                  autoFocus
                />
              </div>

              <div className="field">
                <label htmlFor="telefono">WhatsApp con código de país *</label>
                <input
                  id="telefono"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="+58 000 000 0000"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>

              <div className="field">
                <label htmlFor="email">Correo electrónico <span className="optional-label">Opcional</span></label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                />
              </div>

              <div className="field field-span-2">
                <label htmlFor="ubicacion">Ciudad y estado/provincia *</label>
                <input
                  id="ubicacion"
                  name="ubicacion"
                  value={form.ubicacion}
                  onChange={handleChange}
                  placeholder="Ej.: Acarigua, Portuguesa"
                  autoComplete="address-level2"
                />
              </div>

              <div className="field">
                <label htmlFor="metodoEntrega">Método de entrega *</label>
                <select id="metodoEntrega" name="metodoEntrega" value={form.metodoEntrega} onChange={handleChange}>
                  <option>Envío a domicilio</option>
                  <option>Retiro coordinado</option>
                  <option>Agencia de encomiendas</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="metodoPago">Método de pago preferido *</label>
                <select id="metodoPago" name="metodoPago" value={form.metodoPago} onChange={handleChange}>
                  <option>Por definir con el asesor</option>
                  <option>Transferencia bancaria</option>
                  <option>Zelle</option>
                  <option>Pago móvil</option>
                  <option>Efectivo en USD</option>
                  <option>Efectivo en Bs</option>
                </select>
              </div>

              {needsAddress && (
                <div className="field field-span-2">
                  <label htmlFor="direccion">
                    {form.metodoEntrega === 'Agencia de encomiendas'
                      ? 'Agencia o dirección de entrega *'
                      : 'Dirección de entrega *'}
                  </label>
                  <textarea
                    id="direccion"
                    name="direccion"
                    value={form.direccion}
                    onChange={handleChange}
                    placeholder={
                      form.metodoEntrega === 'Agencia de encomiendas'
                        ? 'Nombre de la agencia, sede o dirección'
                        : 'Calle, avenida, edificio, casa o apartamento'
                    }
                    autoComplete="street-address"
                  />
                </div>
              )}

              <div className="field field-span-2">
                <label htmlFor="notas">Nota adicional <span className="optional-label">Opcional</span></label>
                <textarea
                  id="notas"
                  name="notas"
                  value={form.notas}
                  onChange={handleChange}
                  placeholder="Dudas, sabor preferido o alguna indicación importante"
                />
              </div>
            </div>

            <p className="direct-privacy-note">
              Al enviar el pedido autorizas a GutiSupplements a contactarte para confirmar disponibilidad, entrega y pago.
            </p>

            <div className="direct-order-actions">
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? (
                  <><span className="spinner" /> Guardando pedido...</>
                ) : (
                  <><Icon name="check" size={17} /> Enviar pedido</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
