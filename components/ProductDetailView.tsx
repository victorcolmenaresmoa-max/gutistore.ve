'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FALLBACK_PRODUCTS } from '@/lib/fallbackProducts';
import { getProduct, getProducts } from '@/lib/api';
import { Product } from '@/types';
import { formatUSD } from '@/lib/currency';
import Navbar from './Navbar';
import CheckoutForm from './CheckoutForm';
import Loader from './Loader';
import Icon from './Icons';

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeProductId(value: unknown) {
  return safeDecode(String(value ?? '')).trim().toLowerCase();
}

type ProductInfoTab = 'beneficios' | 'ingredientes' | 'modoUso';

export default function ProductDetailView({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const [activeInfoTab, setActiveInfoTab] = useState<ProductInfoTab>('beneficios');
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  const gallery = product
    ? Array.from(
        new Set(
          [product.imagen, ...(product.imagenes || [])]
            .map((url) => (url || '').trim())
            .filter((url) => url !== '')
        )
      )
    : [];

  const benefits = (product?.beneficios || '')
    .split(/[\r\n]+/)
    .map((item) => item.trim())
    .filter((item) => item !== '');

  const availableInfoTabs: ProductInfoTab[] = product
    ? [
        ...(benefits.length > 0 ? (['beneficios'] as ProductInfoTab[]) : []),
        ...(product.ingredientes?.trim() ? (['ingredientes'] as ProductInfoTab[]) : []),
        ...(product.modoUso?.trim() ? (['modoUso'] as ProductInfoTab[]) : []),
      ]
    : [];

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setProduct(null);

      const requestedId = normalizeProductId(productId);
      if (!requestedId) {
        if (active) setLoading(false);
        return;
      }

      const fallback = FALLBACK_PRODUCTS.find(
        (item) => normalizeProductId(item.id) === requestedId
      );

      if (fallback) {
        if (active) {
          setProduct(fallback);
          setQuantity(1);
          setLoading(false);
        }
        return;
      }

      const directResponse = await getProduct(productId);
      let foundProduct =
        directResponse.ok && directResponse.data ? directResponse.data : null;

      if (!foundProduct) {
        const catalogResponse = await getProducts();
        if (catalogResponse.ok && catalogResponse.data) {
          foundProduct =
            catalogResponse.data.find(
              (item) => normalizeProductId(item.id) === requestedId
            ) || null;
        }
      }

      if (active) {
        setProduct(foundProduct);
        setQuantity(1);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    const first = product
      ? [product.imagen, ...(product.imagenes || [])]
          .map((url) => (url || '').trim())
          .find((url) => url !== '')
      : '';
    setActiveImage(first || '');
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const hasBenefits = (product.beneficios || '')
      .split(/[\r\n]+/)
      .some((item) => item.trim() !== '');
    if (hasBenefits) setActiveInfoTab('beneficios');
    else if (product.ingredientes?.trim()) setActiveInfoTab('ingredientes');
    else if (product.modoUso?.trim()) setActiveInfoTab('modoUso');
  }, [product]);


  useEffect(() => {
    if (!zoomOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setZoomOpen(false);
      }
      if (event.key === '+' || event.key === '=') {
        setZoomScale((value) => Math.min(3, Number((value + 0.5).toFixed(1))));
      }
      if (event.key === '-') {
        setZoomScale((value) => Math.max(1, Number((value - 0.5).toFixed(1))));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomOpen]);

  const openImageZoom = () => {
    if (!activeImage && !product?.imagen) return;
    setZoomScale(1);
    setZoomOpen(true);
  };

  const closeImageZoom = () => {
    setZoomOpen(false);
    setZoomScale(1);
  };

  const changeZoomImage = (url: string) => {
    setActiveImage(url);
    setZoomScale(1);
  };

  const openCheckout = () => {
    if (!product || product.stock <= 0) return;
    setShowCheckout(true);
  };

  const infoTabLabels: Record<ProductInfoTab, string> = {
    beneficios: 'Beneficios',
    ingredientes: 'Ingredientes',
    modoUso: 'Modo de uso',
  };

  return (
    <>
      <Navbar />

      <main className="product-detail-page product-detail-page-compact">
        <div className="container product-detail-container">
          <Link href="/#catalogo" className="back-link">
            <Icon name="chevronLeft" size={17} /> Volver al catálogo
          </Link>

          {loading ? (
            <Loader label="Cargando producto..." />
          ) : !product ? (
            <div className="not-found-card">
              <span className="empty-icon"><Icon name="package" size={34} /></span>
              <h1>Producto no encontrado</h1>
              <p>Este producto ya no está disponible o el enlace cambió.</p>
              <Link href="/#catalogo" className="btn btn-primary">Explorar catálogo</Link>
            </div>
          ) : (
            <div className="product-detail-grid product-detail-grid-compact">
              <section className="product-gallery-card">
                <div className="product-detail-image">
                  <img
                    src={activeImage || product.imagen || 'https://placehold.co/1000x1000/5d0a2a/ffffff?text=GutiSupplements'}
                    alt={product.nombre}
                  />
                  <button
                    type="button"
                    className="product-image-zoom-button"
                    onClick={openImageZoom}
                    aria-label="Ampliar foto del producto"
                    title="Ampliar imagen"
                  >
                    <Icon name="search" size={19} />
                    <span>Ampliar</span>
                  </button>
                  {product.destacado && (
                    <span className="product-featured product-featured-detail">
                      <Icon name="sparkles" size={14} /> Selección destacada
                    </span>
                  )}
                </div>
                {gallery.length > 1 && (
                  <div className="product-thumb-strip" role="list" aria-label="Fotos del producto">
                    {gallery.map((url, index) => (
                      <button
                        type="button"
                        key={`${url}-${index}`}
                        role="listitem"
                        className={`product-thumb ${activeImage === url ? 'active' : ''}`}
                        onClick={() => setActiveImage(url)}
                        aria-label={`Ver foto ${index + 1} del producto`}
                      >
                        <img src={url} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="product-assurance-row">
                  <span><Icon name="shield" size={18} /> Solicitud segura</span>
                  <span><Icon name="message" size={18} /> Contacto directo</span>
                  <span><Icon name="truck" size={18} /> Entrega coordinada</span>
                </div>
              </section>

              <section className="product-info-panel product-info-panel-compact">
                <span className="product-detail-category">{product.categoria || 'Suplementos'}</span>
                <h1>{product.nombre}</h1>
                {product.presentacion && <p className="product-presentation">{product.presentacion}</p>}

                <div className="product-detail-price">
                  {formatUSD(product.precio)} <small>USD</small>
                </div>

                <p className="product-long-description">{product.descripcion}</p>

                <div className="stock-line">
                  <span className={product.stock > 0 ? 'status-dot available' : 'status-dot'} />
                  {product.stock > 0
                    ? `Disponible · ${product.stock} unidades`
                    : 'Actualmente agotado'}
                </div>

                <div className="direct-order-block">
                  <div className="direct-order-labels">
                    <div>
                      <span>Cantidad</span>
                      <small>Selecciona cuántas unidades deseas</small>
                    </div>
                    <strong>{formatUSD(product.precio * quantity)} USD</strong>
                  </div>

                  <div className="direct-order-controls">
                    <div className="quantity-picker" aria-label="Cantidad del producto">
                      <button
                        type="button"
                        onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                        aria-label="Reducir cantidad"
                      >
                        −
                      </button>
                      <span>{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
                        disabled={quantity >= product.stock}
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="btn btn-primary btn-lg direct-order-button"
                      onClick={openCheckout}
                      disabled={product.stock <= 0}
                    >
                      {product.stock <= 0 ? 'Producto agotado' : 'Solicitar este producto'}
                      {product.stock > 0 && <Icon name="arrowRight" size={18} />}
                    </button>
                  </div>
                </div>

                <div className="purchase-helper-card">
                  <Icon name="shield" size={18} />
                  <p>
                    No se realizará ningún cobro automático. Un asesor confirmará
                    disponibilidad, entrega y pago directamente contigo.
                  </p>
                </div>

                {availableInfoTabs.length > 0 && (
                  <div className="product-info-tabs">
                    <div className="product-info-tab-list" role="tablist" aria-label="Información del producto">
                      {availableInfoTabs.map((tab) => (
                        <button
                          type="button"
                          role="tab"
                          aria-selected={activeInfoTab === tab}
                          className={activeInfoTab === tab ? 'active' : ''}
                          key={tab}
                          onClick={() => setActiveInfoTab(tab)}
                        >
                          {infoTabLabels[tab]}
                        </button>
                      ))}
                    </div>

                    <div className="product-info-tab-panel" role="tabpanel">
                      {activeInfoTab === 'beneficios' && benefits.length > 0 ? (
                        <ul className="product-benefits-list">
                          {benefits.map((benefit, index) => (
                            <li key={`${benefit}-${index}`}>
                              <Icon name="check" size={15} />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      ) : activeInfoTab === 'ingredientes' ? (
                        <p>{product.ingredientes}</p>
                      ) : (
                        <p>{product.modoUso}</p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>

      {zoomOpen && product && (
        <div
          className="product-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Vista ampliada de ${product.nombre}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeImageZoom();
          }}
        >
          <div className="product-image-lightbox-shell">
            <div className="product-image-lightbox-header">
              <div>
                <span>Vista ampliada</span>
                <strong>{product.nombre}</strong>
              </div>
              <div className="product-image-lightbox-actions">
                <button
                  type="button"
                  onClick={() => setZoomScale((value) => Math.max(1, Number((value - 0.5).toFixed(1))))}
                  disabled={zoomScale <= 1}
                  aria-label="Alejar imagen"
                  title="Alejar"
                >
                  −
                </button>
                <span aria-live="polite">{Math.round(zoomScale * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoomScale((value) => Math.min(3, Number((value + 0.5).toFixed(1))))}
                  disabled={zoomScale >= 3}
                  aria-label="Acercar imagen"
                  title="Acercar"
                >
                  +
                </button>
                <button
                  type="button"
                  className="product-image-lightbox-close"
                  onClick={closeImageZoom}
                  aria-label="Cerrar vista ampliada"
                  title="Cerrar"
                >
                  <Icon name="close" size={21} />
                </button>
              </div>
            </div>

            <div
              className={`product-image-lightbox-stage ${zoomScale > 1 ? 'is-zoomed' : ''}`}
              onDoubleClick={() => setZoomScale((value) => (value > 1 ? 1 : 2))}
            >
              <img
                src={activeImage || product.imagen}
                alt={product.nombre}
                style={{ transform: `scale(${zoomScale})` }}
                draggable={false}
              />
            </div>

            {gallery.length > 1 && (
              <div className="product-image-lightbox-thumbs" aria-label="Seleccionar imagen ampliada">
                {gallery.map((url, index) => (
                  <button
                    type="button"
                    key={`zoom-${url}-${index}`}
                    className={activeImage === url ? 'active' : ''}
                    onClick={() => changeZoomImage(url)}
                    aria-label={`Ampliar foto ${index + 1}`}
                  >
                    <img src={url} alt="" />
                  </button>
                ))}
              </div>
            )}
            <p className="product-image-lightbox-hint">
              Usa los controles o haz doble clic sobre la imagen para acercar y alejar.
            </p>
          </div>
        </div>
      )}

      {showCheckout && product && (
        <CheckoutForm
          product={product}
          quantity={quantity}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </>
  );
}
