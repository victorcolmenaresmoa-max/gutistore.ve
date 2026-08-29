'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Icon from '@/components/Icons';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/lib/api';
import { formatUSD } from '@/lib/currency';
import { getStoredSellerReferral } from '@/lib/referral';

const INITIAL = { cliente: '', telefono: '', email: '', ubicacion: '', direccion: '', metodoEntrega: 'Envío a domicilio', metodoPago: 'Por definir con el asesor', notas: '' };

export default function CheckoutPage() {
  const { items, subtotal, clearCart, hydrated } = useCart();
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState('');
  const needsAddress = form.metodoEntrega !== 'Retiro coordinado';
  const orderItems = useMemo(() => items.map((item) => ({ id: item.productId, productId: item.promotionId ? undefined : item.productId, promotionId: item.promotionId, variantId: item.variantId, nombre: item.nombre, sku: item.sku, imagen: item.imagen, atributos: item.atributosSeleccionados, variante: item.atributosSeleccionados ? Object.entries(item.atributosSeleccionados).map(([k,v]) => `${k}: ${v}`).join(' · ') : undefined, precio: item.precio, cantidad: item.cantidad, subtotal: Number((item.precio * item.cantidad).toFixed(2)) })), [items]);

  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!items.length) { setError('Tu carrito está vacío.'); return; }
    if (!form.cliente.trim() || !form.telefono.trim() || !form.ubicacion.trim()) { setError('Completa tu nombre, WhatsApp y ciudad o estado.'); return; }
    if (form.telefono.replace(/\D/g, '').length < 8) { setError('Ingresa un número de WhatsApp válido.'); return; }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) { setError('El correo electrónico no parece válido.'); return; }
    if (needsAddress && !form.direccion.trim()) { setError('Indica la dirección o agencia de entrega.'); return; }

    setLoading(true);
    const response = await createOrder({ ...form, direccion: needsAddress ? form.direccion : '', items: orderItems, total: subtotal, vendedorCodigo: getStoredSellerReferral() || undefined });
    setLoading(false);
    if (response.ok && response.data?.id) { setSuccessId(response.data.id); clearCart(); }
    else setError(response.message || 'No fue posible registrar el pedido. Revisa el stock e inténtalo nuevamente.');
  };

  if (successId) return <><Navbar /><main className="simple-page"><div className="container checkout-success"><span className="success-icon"><Icon name="check" size={36} /></span><span className="eyebrow">Pedido registrado</span><h1>¡Gracias por comprar en GutiStore!</h1><p>Tu pedido <strong>#{successId.slice(0,8).toUpperCase()}</strong> quedó guardado correctamente. Te contactaremos para confirmar pago y entrega.</p><Link href="/productos" className="btn btn-primary">Seguir explorando</Link></div></main><Footer /></>;

  return <><Navbar /><main className="simple-page"><div className="container"><div className="page-heading"><span className="eyebrow">Checkout</span><h1>Finaliza tu pedido</h1><p>Confirma exactamente qué estás comprando y déjanos tus datos de contacto y entrega.</p></div>
    {!hydrated ? <div className="state-card">Cargando checkout...</div> : !items.length ? <div className="state-card"><Icon name="bag" size={34} /><h2>No hay productos para comprar</h2><Link href="/productos" className="btn btn-primary">Ir al catálogo</Link></div> : <div className="checkout-grid"><form className="checkout-form-card" onSubmit={submit}>{error && <div className="alert alert-error">{error}</div>}<h2>Información del cliente</h2><div className="form-grid"><div className="field field-span-2"><label>Nombre y apellido *</label><input name="cliente" value={form.cliente} onChange={change} autoComplete="name" /></div><div className="field"><label>WhatsApp *</label><input name="telefono" value={form.telefono} onChange={change} inputMode="tel" placeholder="+58..." /></div><div className="field"><label>Email</label><input type="email" name="email" value={form.email} onChange={change} /></div><div className="field field-span-2"><label>Ciudad / Estado *</label><input name="ubicacion" value={form.ubicacion} onChange={change} /></div></div><h2>Entrega y pago</h2><div className="form-grid"><div className="field"><label>Método de entrega</label><select name="metodoEntrega" value={form.metodoEntrega} onChange={change}><option>Envío a domicilio</option><option>Retiro coordinado</option><option>Agencia de encomiendas</option></select></div><div className="field"><label>Método de pago</label><select name="metodoPago" value={form.metodoPago} onChange={change}><option>Por definir con el asesor</option><option>Transferencia bancaria</option><option>Zelle</option><option>Pago móvil</option><option>Efectivo en USD</option><option>Efectivo en Bs</option></select></div>{needsAddress && <div className="field field-span-2"><label>Dirección / agencia *</label><textarea name="direccion" value={form.direccion} onChange={change} /></div>}<div className="field field-span-2"><label>Notas</label><textarea name="notas" value={form.notas} onChange={change} placeholder="Indicaciones adicionales (opcional)" /></div></div><button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>{loading ? <><span className="spinner" /> Registrando...</> : <>Registrar pedido <Icon name="arrowRight" size={17} /></>}</button><p className="checkout-note"><Icon name="shield" size={16} /> No se realiza un cobro automático. El pedido queda registrado y luego se confirma contigo.</p></form><aside className="checkout-summary"><h2>Tu pedido</h2>{items.map((item) => <article key={item.key}><div className="checkout-item-image">{item.imagen ? <Image src={item.imagen} alt={item.nombre} fill sizes="70px" /> : <Icon name="package" size={26} />}</div><div><strong>{item.nombre}</strong>{item.atributosSeleccionados && <small>{Object.entries(item.atributosSeleccionados).map(([k,v]) => `${k}: ${v}`).join(' · ')}</small>}<span>{item.cantidad} × {formatUSD(item.precio)}</span></div><b>{formatUSD(item.precio * item.cantidad)}</b></article>)}<div className="checkout-total"><span>Total estimado</span><strong>{formatUSD(subtotal)} USD</strong></div></aside></div>}
  </div></main><Footer /></>;
}
