'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import Icon from '@/components/Icons';
import Price from '@/components/Price';
import ProductImage from '@/components/ProductImage';
import { CartNotices } from '@/components/cart/CartPageView';
import { EmptyState, Spinner } from '@/components/ui/States';
import { useCart } from '@/context/CartContext';
import { useCartSync } from '@/hooks/useCartSync';
import { invalidateStoreCache } from '@/hooks/useStoreData';
import { createOrder } from '@/lib/api';
import { lineToOrderItem } from '@/lib/cart';
import { formatUSD } from '@/lib/currency';
import { saveLastOrder } from '@/lib/lastOrder';
import { DELIVERY_METHODS, PAYMENT_METHODS } from '@/lib/orders';
import { getStoredSellerReferral } from '@/lib/referral';

const INITIAL_FORM = {
  cliente: '',
  telefono: '',
  email: '',
  ubicacion: '',
  metodoEntrega: DELIVERY_METHODS[0] as string,
  direccion: '',
  metodoPago: PAYMENT_METHODS[0] as string,
  notas: '',
};

type FormState = typeof INITIAL_FORM;
type FieldErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState, needsAddress: boolean): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.cliente.trim()) errors.cliente = 'Escribe tu nombre y apellido.';
  const phone = form.telefono.trim();
  if (phone.replace(/\D/g, '').length < 8 || !/^[\d\s+()-]+$/.test(phone)) {
    errors.telefono = 'Ingresa un WhatsApp válido: solo números, espacios, + o guiones.';
  }
  if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'El correo no parece válido (puedes dejarlo vacío).';
  if (!form.ubicacion.trim()) errors.ubicacion = 'Indica tu ciudad y estado.';
  if (needsAddress && !form.direccion.trim()) errors.direccion = 'Indica la dirección o agencia de entrega.';
  return errors;
}

export default function CheckoutView() {
  const router = useRouter();
  const { lines, ready, subtotal, itemCount, clear } = useCart();
  const { notices, syncing, dismiss } = useCartSync();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [completed, setCompleted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // Anti-bots: hora de apertura del formulario y un campo trampa invisible.
  const startedAtRef = useRef(Date.now());
  const [website, setWebsite] = useState('');
  const needsAddress = form.metodoEntrega !== 'Retiro coordinado';

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    if (errors[name as keyof FormState]) setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    const found = validate(form, needsAddress);
    setErrors(found);
    const firstError = Object.keys(found)[0];
    if (firstError) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstError}"]`)?.focus();
      return;
    }
    if (!lines.length) return;

    setSubmitting(true);
    const items = lines.map(lineToOrderItem);
    const response = await createOrder({
      ...form,
      direccion: needsAddress ? form.direccion.trim() : '',
      items,
      total: subtotal,
      vendedorCodigo: getStoredSellerReferral() || undefined,
      website,
      startedAt: startedAtRef.current,
    });
    setSubmitting(false);

    if (response.ok && response.data?.saved !== false) {
      const data = response.data;
      saveLastOrder({
        id: data?.id || '',
        cliente: form.cliente.trim(),
        total: data?.total || subtotal,
        items: data?.items && data.items.length ? data.items : items,
        metodoEntrega: form.metodoEntrega,
        metodoPago: form.metodoPago,
        createdAt: Date.now(),
      });
      // El carrito solo se vacía cuando el pedido quedó registrado.
      setCompleted(true);
      clear();
      invalidateStoreCache();
      router.push('/pedido/confirmado');
    } else {
      setSubmitError(response.message || 'No fue posible registrar el pedido. Inténtalo nuevamente.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!ready || completed) {
    return (
      <div className="container page-narrow">
        <Spinner label={completed ? 'Pedido registrado. Abriendo tu confirmación…' : 'Preparando tu pedido…'} />
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="container page-narrow">
        <EmptyState
          icon="cart"
          title="No hay productos para finalizar"
          description="Agrega productos a tu carrito para registrar un pedido."
          action={{ label: 'Ir a la tienda', href: '/tienda' }}
        />
      </div>
    );
  }

  const field = (name: keyof FormState) => ({
    id: `checkout-${name}`,
    name,
    value: form[name],
    onChange: handleChange,
    'aria-invalid': Boolean(errors[name]) || undefined,
    'aria-describedby': errors[name] ? `checkout-${name}-error` : undefined,
  });

  const errorText = (name: keyof FormState) =>
    errors[name] ? (
      <p className="field-error" id={`checkout-${name}-error`}>
        {errors[name]}
      </p>
    ) : null;

  return (
    <div className="container checkout-page">
      <div className="page-heading">
        <nav className="breadcrumbs" aria-label="Ruta de navegación">
          <ol>
            <li>
              <Link href="/carrito">Carrito</Link>
            </li>
            <li aria-current="page">Datos del pedido</li>
          </ol>
        </nav>
        <h1>Finaliza tu pedido</h1>
        <p>Solo necesitamos tus datos de contacto y entrega. No pedimos tarjeta ni se realiza ningún cobro.</p>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit} ref={formRef} noValidate>
          <CartNotices notices={notices} onDismiss={dismiss} />
          {submitError && (
            <div className="notice notice-error" role="alert">
              <Icon name="alert" size={18} />
              <div>
                <strong>No pudimos registrar tu pedido</strong>
                <p>{submitError}</p>
              </div>
            </div>
          )}

          <fieldset className="form-card">
            <legend>
              <span className="form-step">1</span> Contacto
            </legend>
            <div className="form-grid">
              <div className="field field-span-2">
                <label htmlFor="checkout-cliente">Nombre y apellido *</label>
                <input {...field('cliente')} autoComplete="name" placeholder="Tu nombre completo" />
                {errorText('cliente')}
              </div>
              <div className="field">
                <label htmlFor="checkout-telefono">WhatsApp *</label>
                <input {...field('telefono')} autoComplete="tel" inputMode="tel" placeholder="+58 412 000 0000" />
                {errorText('telefono')}
              </div>
              <div className="field">
                <label htmlFor="checkout-email">
                  Correo <span className="optional">(opcional)</span>
                </label>
                <input {...field('email')} type="email" autoComplete="email" placeholder="correo@ejemplo.com" />
                {errorText('email')}
              </div>
            </div>
          </fieldset>

          <fieldset className="form-card">
            <legend>
              <span className="form-step">2</span> Entrega
            </legend>
            <div className="form-grid">
              <div className="field field-span-2">
                <label htmlFor="checkout-ubicacion">Ciudad y estado *</label>
                <input {...field('ubicacion')} autoComplete="address-level2" placeholder="Ej.: Acarigua, Portuguesa" />
                {errorText('ubicacion')}
              </div>
              <div className="field field-span-2">
                <span className="field-label" id="delivery-label">
                  Método de entrega *
                </span>
                <div className="option-cards" role="radiogroup" aria-labelledby="delivery-label">
                  {DELIVERY_METHODS.map((method) => (
                    <label key={method} className={`option-card ${form.metodoEntrega === method ? 'selected' : ''}`}>
                      <input type="radio" name="metodoEntrega" value={method} checked={form.metodoEntrega === method} onChange={handleChange} />
                      <Icon name={method === 'Retiro coordinado' ? 'store' : method === 'Envío a domicilio' ? 'home' : 'truck'} size={19} />
                      <span>{method}</span>
                    </label>
                  ))}
                </div>
              </div>
              {needsAddress && (
                <div className="field field-span-2">
                  <label htmlFor="checkout-direccion">
                    {form.metodoEntrega === 'Agencia de encomiendas' ? 'Agencia o dirección *' : 'Dirección de entrega *'}
                  </label>
                  <textarea
                    {...field('direccion')}
                    rows={3}
                    autoComplete="street-address"
                    placeholder={
                      form.metodoEntrega === 'Agencia de encomiendas'
                        ? 'Nombre de la agencia, sede o dirección'
                        : 'Calle, avenida, edificio, casa o apartamento'
                    }
                  />
                  {errorText('direccion')}
                </div>
              )}
            </div>
          </fieldset>

          <fieldset className="form-card">
            <legend>
              <span className="form-step">3</span> Pago y notas
            </legend>
            <div className="form-grid">
              <div className="field field-span-2">
                <label htmlFor="checkout-metodoPago">Método de pago preferido</label>
                <div className="select-wrap">
                  <select {...field('metodoPago')}>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method}>{method}</option>
                    ))}
                  </select>
                  <Icon name="chevronDown" size={16} />
                </div>
                <small className="field-hint">No se cobra ahora: el pago se coordina con tu asesor al confirmar el pedido.</small>
              </div>
              <div className="field field-span-2">
                <label htmlFor="checkout-notas">
                  Notas <span className="optional">(opcional)</span>
                </label>
                <textarea {...field('notas')} rows={3} placeholder="Preferencias, horario de contacto o cualquier indicación" />
              </div>
            </div>
          </fieldset>

          <div className="hp-field" aria-hidden="true">
            <label htmlFor="checkout-website">No llenes este campo</label>
            <input id="checkout-website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>

          <div className="checkout-submit">
            <p className="privacy-note">
              Al registrar el pedido autorizas a GutiStore a contactarte por WhatsApp para confirmar disponibilidad, entrega y pago.
            </p>
            <button
              type="submit"
              className={`btn btn-primary btn-lg btn-block checkout-submit-btn ${submitting ? 'is-sending' : ''}`}
              disabled={submitting || syncing}
            >
              {submitting ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Registrando pedido…
                </>
              ) : (
                <>
                  <Icon name="check" size={18} /> Registrar pedido · {formatUSD(subtotal)}
                </>
              )}
            </button>
          </div>
        </form>

        <aside className="summary-card checkout-summary" aria-labelledby="checkout-summary-title">
          <div className="summary-head">
            <h2 id="checkout-summary-title">Tu pedido</h2>
            <Link href="/carrito" className="link-button">
              Editar
            </Link>
          </div>
          <ul className="summary-lines">
            {lines.map((line) => (
              <li key={line.key}>
                <span className="summary-thumb">
                  <ProductImage src={line.imagen} alt="" />
                  <b>{line.cantidad}</b>
                </span>
                <span className="summary-line-info">
                  <strong>{line.nombre}</strong>
                  {line.varianteNombre && <small>{line.varianteNombre}</small>}
                  {line.tipo === 'promocion' && <small>Promoción</small>}
                </span>
                <span className="summary-line-price">{formatUSD(line.precio * line.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="cart-summary-row">
            <span>Productos ({itemCount})</span>
            <span>{formatUSD(subtotal)}</span>
          </div>
          <div className="cart-summary-row">
            <span>Envío</span>
            <span className="muted">Se coordina con tu asesor</span>
          </div>
          <div className="cart-summary-row cart-summary-total">
            <span>Total estimado</span>
            <Price amount={subtotal} size="lg" animate />
          </div>
          <p className="summary-note">
            <Icon name="message" size={16} />
            <span>Después de registrar tu pedido, un asesor te escribirá por WhatsApp para confirmarlo.</span>
          </p>
        </aside>
      </div>
    </div>
  );
}
