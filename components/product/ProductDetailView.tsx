'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Product } from '@/types';
import Icon from '@/components/Icons';
import Price from '@/components/Price';
import { EmptyState, ErrorState } from '@/components/ui/States';
import QuantityStepper from '@/components/cart/QuantityStepper';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/hooks/useStoreData';
import { getProduct } from '@/lib/api';
import { lineFromProduct } from '@/lib/cart';
import { categoryHref, relatedProducts } from '@/lib/catalog';
import { formatUSD } from '@/lib/currency';
import {
  VariantAxis,
  VariantSelection,
  activeVariants,
  applySelection,
  comparePrice,
  discountPercent,
  findSelectedVariant,
  hasVariants,
  initialSelection,
  isInStock,
  priceRange,
  productGallery,
  variantPrice,
} from '@/lib/product';
import ProductBadges from './ProductBadges';
import ProductGallery from './ProductGallery';
import ProductInfoSections from './ProductInfoSections';
import VariantSelector from './VariantSelector';
import { ProductGrid } from './ProductCard';

const LOW_STOCK = 5;

function DetailSkeleton() {
  return (
    <div className="pdp-grid" aria-hidden="true">
      <div className="gallery">
        <div className="gallery-stage skeleton" />
      </div>
      <div className="pdp-info">
        <span className="skeleton skeleton-line short" />
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-line medium" />
        <span className="skeleton skeleton-block" />
      </div>
    </div>
  );
}

export default function ProductDetailView({
  productKey,
  initialProduct,
}: {
  productKey: string;
  initialProduct: Product | null;
}) {
  const router = useRouter();
  const { addItem, quantityOf, openDrawer } = useCart();
  const catalog = useProducts();

  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [status, setStatus] = useState<'ready' | 'loading' | 'missing' | 'error'>(initialProduct ? 'ready' : 'loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [selection, setSelection] = useState<VariantSelection>(() => (initialProduct ? initialSelection(initialProduct) : {}));
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(initialProduct?.imagen || '');
  const [showErrors, setShowErrors] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  // Si el servidor no pudo leer el producto, se intenta desde el navegador.
  useEffect(() => {
    if (initialProduct) return;
    let active = true;
    setStatus('loading');
    getProduct(productKey).then((response) => {
      if (!active) return;
      if (response.ok && response.data) {
        setProduct(response.data);
        setSelection(initialSelection(response.data));
        setActiveImage(response.data.imagen);
        setStatus('ready');
      } else if (response.message === 'Producto no encontrado.') {
        setStatus('missing');
      } else {
        setErrorMessage(response.message || '');
        setStatus('error');
      }
    });
    return () => {
      active = false;
    };
  }, [initialProduct, productKey]);

  const gallery = useMemo(() => (product ? productGallery(product) : []), [product]);
  const variant = product ? findSelectedVariant(product, selection) : null;
  const withVariants = product ? hasVariants(product) : false;

  // Imagen asociada a la variante o al color elegido.
  useEffect(() => {
    if (!product) return;
    const image =
      variant?.imagen ||
      (selection.color
        ? activeVariants(product).find((item) => item.color?.nombre === selection.color && item.imagen)?.imagen
        : '');
    if (image) setActiveImage(image);
  }, [product, variant, selection.color]);

  const related = useMemo(() => (product ? relatedProducts(product, catalog.data, 4) : []), [product, catalog.data]);
  const sameCategory = useMemo(() => {
    if (!product) return [];
    const relatedIds = new Set(related.map((item) => item.id));
    return catalog.data
      .filter((item) => item.id !== product.id && item.categoria === product.categoria && !relatedIds.has(item.id))
      .slice(0, 4);
  }, [product, catalog.data, related]);

  if (status === 'loading') {
    return (
      <div className="container pdp">
        <DetailSkeleton />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container pdp">
        <ErrorState message={errorMessage} onRetry={() => router.refresh()} />
      </div>
    );
  }

  if (status === 'missing' || !product) {
    return (
      <div className="container pdp">
        <EmptyState
          icon="package"
          title="Producto no encontrado"
          description="Es posible que ya no esté disponible o que el enlace haya cambiado."
          action={{ label: 'Explorar la tienda', href: '/tienda' }}
        />
      </div>
    );
  }

  const price = variantPrice(product, variant);
  const range = priceRange(product);
  const showRange = withVariants && !variant && range.min !== range.max;
  const compare = comparePrice(product, price);
  const discount = discountPercent(product, price);
  const productInStock = isInStock(product);
  const available = withVariants ? (variant ? variant.stock : null) : product.stock;
  const cartKey = lineFromProduct(product, variant).key;
  const inCart = quantityOf(cartKey);
  const maxAddable = available === null ? 0 : Math.max(0, available - inCart);
  const safeQuantity = Math.min(Math.max(1, quantity), Math.max(1, maxAddable));

  const handleSelect = (axis: VariantAxis, value: string) => {
    setSelection((current) => applySelection(product, current, axis, value));
    setQuantity(1);
  };

  const addToCart = (goToCheckout = false) => {
    if (withVariants && !variant) {
      setShowErrors(true);
      selectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const result = addItem(lineFromProduct(product, variant), safeQuantity);
    if (result.ok) {
      setQuantity(1);
      if (goToCheckout) router.push('/checkout');
    }
  };

  let availabilityText = '';
  let availabilityTone: 'ok' | 'low' | 'out' | 'neutral' = 'neutral';
  if (!productInStock) {
    availabilityText = 'Agotado por ahora';
    availabilityTone = 'out';
  } else if (available === null) {
    availabilityText = 'Elige las opciones para ver la disponibilidad';
  } else if (available <= 0) {
    availabilityText = 'Esta combinación está agotada';
    availabilityTone = 'out';
  } else if (available <= LOW_STOCK) {
    availabilityText = `¡Solo quedan ${available} unidades!`;
    availabilityTone = 'low';
  } else {
    availabilityText = 'Disponible';
    availabilityTone = 'ok';
  }

  const blockedByStock = !productInStock || (available !== null && available <= 0);
  const allInCart = available !== null && available > 0 && maxAddable <= 0;
  const primaryLabel = !productInStock
    ? 'Agotado'
    : available !== null && available <= 0
      ? 'Opción agotada'
      : allInCart
        ? 'Ya tienes todo el stock'
        : 'Agregar al carrito';

  return (
    <div className="container pdp">
      <nav className="breadcrumbs" aria-label="Ruta de navegación">
        <ol>
          <li>
            <Link href="/">Inicio</Link>
          </li>
          <li>
            <Link href="/tienda">Tienda</Link>
          </li>
          <li>
            <Link href={categoryHref(product.categoria)}>{product.categoria}</Link>
          </li>
          {product.subcategoria && (
            <li>
              <Link href={categoryHref(product.categoria, product.subcategoria)}>{product.subcategoria}</Link>
            </li>
          )}
          <li aria-current="page">{product.nombre}</li>
        </ol>
      </nav>

      <div className="pdp-grid">
        <section className="pdp-gallery" aria-label="Galería">
          <ProductGallery images={gallery} activeImage={activeImage} onChange={setActiveImage} name={product.nombre}>
            <ProductBadges product={product} price={price} className="pdp-badges" />
          </ProductGallery>
        </section>

        <section className="pdp-info" aria-labelledby="product-title">
          <div className="pdp-eyebrow">
            {product.marca && <span className="pdp-brand">{product.marca}</span>}
            <Link href={categoryHref(product.categoria, product.subcategoria)}>
              {product.subcategoria || product.categoria}
            </Link>
          </div>
          <h1 id="product-title">{product.nombre}</h1>
          {product.descripcionCorta && <p className="pdp-lead">{product.descripcionCorta}</p>}

          <div className="pdp-price">
            <Price amount={showRange ? range.min : price} compareAt={showRange ? 0 : compare} prefix={showRange ? 'Desde' : undefined} size="xl" />
            {!showRange && compare > 0 && (
              <span className="pdp-saving">
                Ahorras {formatUSD(compare - price)} ({discount}%)
              </span>
            )}
          </div>

          <p className={`availability availability-${availabilityTone}`}>
            <span className="availability-dot" aria-hidden="true" />
            {availabilityText}
          </p>

          <div ref={selectorRef}>
            <VariantSelector product={product} selection={selection} onSelect={handleSelect} showErrors={showErrors} />
          </div>

          <div className="pdp-buy">
            <div className="pdp-qty">
              <span className="pdp-qty-label">Cantidad</span>
              <QuantityStepper
                value={safeQuantity}
                max={Math.max(1, maxAddable)}
                onChange={setQuantity}
                disabled={blockedByStock || allInCart || (withVariants && !variant)}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary btn-lg pdp-add"
              onClick={() => addToCart(false)}
              disabled={blockedByStock || allInCart}
            >
              <Icon name="cart" size={19} /> {primaryLabel}
            </button>
            {!blockedByStock && !allInCart && (
              <button type="button" className="btn btn-outline-dark btn-lg pdp-buy-now" onClick={() => addToCart(true)}>
                Comprar ahora
              </button>
            )}
          </div>

          {inCart > 0 && (
            <p className="pdp-in-cart">
              <Icon name="check" size={15} /> Tienes {inCart} en tu carrito.{' '}
              <button type="button" className="link-button" onClick={openDrawer}>
                Ver carrito
              </button>
            </p>
          )}

          <ul className="pdp-assurance">
            <li>
              <Icon name="shield" size={18} />
              <span>
                <strong>Sin pago en línea.</strong> Registras tu pedido y un asesor confirma disponibilidad, entrega y pago contigo.
              </span>
            </li>
            <li>
              <Icon name="truck" size={18} />
              <span>
                <strong>Entrega coordinada</strong> a domicilio, por agencia o retiro.
              </span>
            </li>
          </ul>

          {(variant?.sku || product.sku) && (
            <p className="pdp-sku">SKU: {variant?.sku || product.sku}</p>
          )}

          <ProductInfoSections product={product} variant={variant} />
        </section>
      </div>

      {related.length > 0 && (
        <section className="pdp-rail" aria-labelledby="related-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Te puede interesar</span>
              <h2 id="related-title">Productos relacionados</h2>
            </div>
          </div>
          <ProductGrid products={related} />
        </section>
      )}

      {sameCategory.length > 0 && (
        <section className="pdp-rail" aria-labelledby="category-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Más de {product.categoria}</span>
              <h2 id="category-title">De la misma categoría</h2>
            </div>
            <Link href={categoryHref(product.categoria)} className="btn btn-outline-dark btn-sm">
              Ver todo <Icon name="arrowRight" size={15} />
            </Link>
          </div>
          <ProductGrid products={sameCategory} />
        </section>
      )}
    </div>
  );
}
