'use client';

import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Icon from '@/components/Icons';
import { useCart } from '@/context/CartContext';
import { formatUSD } from '@/lib/currency';

export default function CartPage() {
  const { items, subtotal, removeItem, setQuantity, hydrated } = useCart();
  return (
    <><Navbar /><main className="simple-page"><div className="container narrow-store-page"><div className="page-heading"><span className="eyebrow">GutiStore</span><h1>Tu carrito</h1><p>Revisa productos, variantes y cantidades antes de continuar.</p></div>
      {!hydrated ? <div className="state-card">Cargando carrito...</div> : !items.length ? <div className="state-card"><Icon name="bag" size={34} /><h2>Tu carrito está vacío</h2><p>Agrega productos desde el catálogo para comenzar.</p><Link href="/productos" className="btn btn-primary">Explorar productos</Link></div> : <div className="cart-page-grid"><section className="cart-page-list">{items.map((item) => <article className="cart-page-item" key={item.key}><div className="cart-page-image">{item.imagen ? <Image src={item.imagen} alt={item.nombre} fill sizes="110px" /> : <Icon name="package" size={32} />}</div><div className="cart-page-copy"><Link href={item.promotionId ? '/productos' : `/producto/${item.slug || item.productId}`}>{item.nombre}</Link>{item.atributosSeleccionados && <span>{Object.entries(item.atributosSeleccionados).map(([k,v]) => `${k}: ${v}`).join(' · ')}</span>}{item.sku && <small>SKU: {item.sku}</small>}<div className="cart-page-actions"><div className="quantity-picker quantity-picker-small"><button onClick={() => setQuantity(item.key, item.cantidad - 1)}>−</button><span>{item.cantidad}</span><button onClick={() => setQuantity(item.key, item.cantidad + 1)} disabled={item.stockDisponible !== undefined && item.cantidad >= item.stockDisponible}>+</button></div><button className="text-danger" onClick={() => removeItem(item.key)}>Eliminar</button></div></div><strong>{formatUSD(item.precio * item.cantidad)}</strong></article>)}</section><aside className="cart-summary"><h2>Resumen</h2><div><span>Subtotal</span><strong>{formatUSD(subtotal)} USD</strong></div><p>El precio y stock se validan nuevamente al registrar el pedido.</p><Link href="/checkout" className="btn btn-primary btn-lg btn-block">Continuar al checkout <Icon name="arrowRight" size={17} /></Link><Link href="/productos" className="btn btn-ghost btn-block">Seguir comprando</Link></aside></div>}
    </div></main><Footer /></>
  );
}
