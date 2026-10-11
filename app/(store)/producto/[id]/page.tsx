import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import ProductDetailView from '@/components/product/ProductDetailView';
import { findProduct } from '@/lib/server/catalog';
import { productSummary } from '@/lib/product';

export const dynamic = 'force-dynamic';

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Una sola consulta por petición aunque la usen metadata y página. */
const loadProduct = cache(async (key: string) => {
  try {
    return { product: await findProduct(key), failed: false };
  } catch {
    // Sin conexión con Supabase: el navegador lo reintentará.
    return { product: null, failed: true };
  }
});

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const key = safeDecode(String(id ?? '')).trim();
  const { product } = await loadProduct(key);
  if (!product) return { title: 'Producto' };

  const description = productSummary(product, 155) || `${product.nombre} en GutiStore.`;
  return {
    title: product.nombre,
    description,
    alternates: { canonical: `/producto/${product.slug || product.id}` },
    openGraph: {
      title: `${product.nombre} | GutiStore`,
      description,
      images: product.imagen ? [{ url: product.imagen }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const key = safeDecode(String(id ?? '')).trim();
  const { product } = await loadProduct(key);
  // Las URLs antiguas usaban el id: se redirigen a la URL amigable.
  if (product?.slug && key !== product.slug) permanentRedirect(`/producto/${encodeURIComponent(product.slug)}`);
  return <ProductDetailView key={product?.id || key} productKey={key} initialProduct={product} />;
}
