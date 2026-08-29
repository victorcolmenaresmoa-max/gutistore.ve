'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProduct } from '@/lib/api';
import type { Product, ProductVariant } from '@/types';
import { formatBs, formatUSD, hasRate } from '@/lib/currency';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import Navbar from './Navbar';
import Footer from './Footer';
import Loader from './Loader';
import Icon from './Icons';

export default function ProductDetailView({ productId }: { productId: string }) {
  const router = useRouter();
  const { rate } = useCurrency();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true); setError('');
      const response = await getProduct(productId);
      if (!active) return;
      if (response.ok && response.data) setProduct(response.data);
      else setError(response.message || 'Producto no encontrado.');
      setLoading(false);
    })();
    return () => { active = false; };
  }, [productId]);

  const variants = useMemo(() => (product?.variantes || []).filter((variant) => variant.active !== false), [product]);
  const optionNames = useMemo(() => Array.from(new Set(variants.flatMap((variant) => Object.keys(variant.attributes)))), [variants]);
  const optionValues = useMemo(() => Object.fromEntries(optionNames.map((name) => [name, Array.from(new Set(variants.map((variant) => variant.attributes[name]).filter(Boolean)))])), [variants, optionNames]);

  useEffect(() => {
    if (!variants.length) { setSelected({}); return; }
    const defaults: Record<string, string> = {};
    optionNames.forEach((name) => {
      const values = optionValues[name] || [];
      if (values.length === 1) defaults[name] = values[0];
    });
    setSelected(defaults);
  }, [product?.id, variants, optionNames, optionValues]);

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!variants.length || optionNames.some((name) => !selected[name])) return null;
    return variants.find((variant) => optionNames.every((name) => variant.attributes[name] === selected[name])) || null;
  }, [variants, optionNames, selected]);

  const isValuePossible = (name: string, value: string) => variants.some((variant) => {
    if (variant.attributes[name] !== value) return false;
    return optionNames.every((otherName) => otherName === name || !selected[otherName] || variant.attributes[otherName] === selected[otherName]);
  });

  const effectiveStock = variants.length ? selectedVariant?.stock || 0 : product?.stock || 0;
  const effectivePrice = selectedVariant?.price ?? product?.precio ?? 0;
  const comparePrice = selectedVariant?.compareAtPrice ?? product?.precioAnterior ?? null;
  const needsVariant = variants.length > 0 && !selectedVariant;

  const gallery = useMemo(() => {
    if (!product) return [];
    return Array.from(new Set([selectedVariant?.image, product.imagen, ...(product.imagenes || [])].map((url) => String(url || '').trim()).filter(Boolean)));
  }, [product, selectedVariant]);

  useEffect(() => {
    const preferred = selectedVariant?.image || product?.imagen || product?.imagenes?.[0] || '';
    if (preferred) setActiveImage(preferred);
  }, [product?.id, selectedVariant?.id]);

  useEffect(() => setQuantity(1), [selectedVariant?.id, product?.id]);

  const selectValue = (name: string, value: string) => {
    setSelected((current) => {
      const next = { ...current, [name]: value };
      // Si una elección vuelve imposible otra opción, la limpiamos para evitar combinaciones inválidas.
      optionNames.forEach((otherName) => {
        if (otherName === name || !next[otherName]) return;
        const possible = variants.some((variant) => variant.attributes[name] === value && variant.attributes[otherName] === next[otherName]);
        if (!possible) delete next[otherName];
      });
      return next;
    });
  };

  const handleAdd = (goCheckout = false) => {
    if (!product || needsVariant || effectiveStock <= 0) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      nombre: product.nombre,
      slug: product.slug,
      imagen: selectedVariant?.image || product.imagen,
      sku: selectedVariant?.sku || product.sku,
      precio: effectivePrice,
      cantidad: quantity,
      stockDisponible: effectiveStock,
      atributosSeleccionados: selectedVariant?.attributes,
    });
    if (goCheckout) router.push('/checkout');
    else {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
    }
  };

  return (
    <>
      <Navbar />
      <main className="product-detail-page">
        <div className="container product-detail-container">
          <Link href={product?.categoriaSlug ? `/categoria/${product.categoriaSlug}` : '/productos'} className="back-link"><Icon name="chevronLeft" size={16} /> Volver al catálogo</Link>

          {loading ? <Loader label="Cargando producto..." /> : error || !product ? (
            <div className="state-card"><Icon name="package" size={32} /><h1>Producto no encontrado</h1><p>{error || 'Este producto ya no está disponible.'}</p><Link href="/productos" className="btn btn-primary">Explorar catálogo</Link></div>
          ) : (
            <div className="product-detail-grid">
              <section className="product-gallery-card">
                <div className="product-detail-image">
                  {activeImage ? <Image src={activeImage} alt={product.nombre} fill priority sizes="(max-width: 900px) 100vw, 52vw" /> : <div className="product-placeholder"><Icon name="package" size={60} /></div>}
                  {activeImage && <button className="product-image-zoom-button" onClick={() => setZoomOpen(true)}><Icon name="search" size={17} /> Ampliar</button>}
                  {product.destacado && <span className="product-featured product-featured-detail"><Icon name="sparkles" size={13} /> Destacado</span>}
                </div>
                {gallery.length > 1 && <div className="product-thumb-strip">{gallery.map((url, index) => <button key={url} className={activeImage === url ? 'active' : ''} onClick={() => setActiveImage(url)} aria-label={`Ver imagen ${index + 1}`}><Image src={url} alt="" fill sizes="76px" /></button>)}</div>}
                <div className="product-assurance-row"><span><Icon name="shield" size={17} /> Compra clara</span><span><Icon name="message" size={17} /> Atención directa</span><span><Icon name="truck" size={17} /> Entrega coordinada</span></div>
              </section>

              <section className="product-info-panel">
                <div className="product-top-meta"><Link href={product.categoriaSlug ? `/categoria/${product.categoriaSlug}` : '/productos'}>{product.categoria}</Link>{product.marca && <span>{product.marca}</span>}{product.sku && <span>SKU {product.sku}</span>}</div>
                <h1>{product.nombre}</h1>
                {product.descripcionCorta && <p className="product-short-description">{product.descripcionCorta}</p>}
                <div className="product-detail-price"><strong>{formatUSD(effectivePrice)}</strong>{comparePrice && comparePrice > effectivePrice ? <del>{formatUSD(comparePrice)}</del> : null}{hasRate(rate) && <small>{formatBs(effectivePrice, rate)}</small>}</div>

                {variants.length > 0 && (
                  <div className="variant-selector">
                    {optionNames.map((name) => (
                      <div className="variant-option-group" key={name}>
                        <div><strong>{name}</strong><span>{selected[name] || 'Selecciona una opción'}</span></div>
                        <div className="variant-pills">
                          {(optionValues[name] || []).map((value) => {
                            const possible = isValuePossible(name, value);
                            const variantForValue = variants.find((variant) => variant.attributes[name] === value && optionNames.every((other) => other === name || !selected[other] || variant.attributes[other] === selected[other]));
                            const noStock = Boolean(variantForValue && variantForValue.stock <= 0 && optionNames.filter((n) => n !== name).every((n) => selected[n]));
                            return <button key={value} type="button" disabled={!possible} className={`${selected[name] === value ? 'active' : ''} ${noStock ? 'no-stock' : ''}`} onClick={() => selectValue(name, value)}>{value}{noStock && <small>Agotado</small>}</button>;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={`stock-line ${effectiveStock > 0 && !needsVariant ? 'available' : ''}`}><span className="status-dot" />{needsVariant ? 'Selecciona las opciones para ver disponibilidad' : effectiveStock > 0 ? `${effectiveStock} unidad${effectiveStock === 1 ? '' : 'es'} disponible${effectiveStock === 1 ? '' : 's'}` : 'Agotado'}</div>

                <div className="purchase-block">
                  <div className="purchase-quantity"><span>Cantidad</span><div className="quantity-picker"><button onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><span>{quantity}</span><button onClick={() => setQuantity((value) => Math.min(effectiveStock, value + 1))} disabled={needsVariant || quantity >= effectiveStock}>+</button></div></div>
                  <button className="btn btn-primary btn-lg btn-block" disabled={needsVariant || effectiveStock <= 0} onClick={() => handleAdd(false)}>{added ? <><Icon name="check" size={18} /> Añadido al carrito</> : <><Icon name="bag" size={18} /> {effectiveStock <= 0 && !needsVariant ? 'Producto agotado' : needsVariant ? 'Selecciona una variante' : 'Añadir al carrito'}</>}</button>
                  <button className="btn btn-outline btn-lg btn-block" disabled={needsVariant || effectiveStock <= 0} onClick={() => handleAdd(true)}>Comprar ahora</button>
                </div>

                <p className="product-long-description">{product.descripcion}</p>

                {(product.atributos || []).length > 0 && <div className="attributes-table"><h3>Características</h3>{product.atributos!.map((attribute) => <div key={`${attribute.name}-${attribute.value}`}><span>{attribute.name}</span><strong>{attribute.value}</strong></div>)}</div>}

                {(product.presentacion || product.beneficios || product.ingredientes || product.modoUso) && (
                  <details className="legacy-info" open><summary>Información adicional</summary><div className="legacy-info-body">{product.presentacion && <p><strong>Presentación:</strong> {product.presentacion}</p>}{product.beneficios && <p><strong>Beneficios:</strong><br />{product.beneficios}</p>}{product.ingredientes && <p><strong>Ingredientes:</strong><br />{product.ingredientes}</p>}{product.modoUso && <p><strong>Modo de uso:</strong><br />{product.modoUso}</p>}</div></details>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {zoomOpen && product && activeImage && <div className="product-image-lightbox" onMouseDown={(event) => event.target === event.currentTarget && setZoomOpen(false)} role="dialog" aria-modal="true"><div className="lightbox-image-wrap"><button className="lightbox-close" onClick={() => setZoomOpen(false)} aria-label="Cerrar"><Icon name="close" size={22} /></button><Image src={activeImage} alt={product.nombre} fill sizes="95vw" /></div></div>}
    </>
  );
}
