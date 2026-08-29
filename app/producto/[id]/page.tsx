import type { Metadata } from 'next';
import ProductDetailView from '@/components/ProductDetailView';
import { supabaseRest } from '@/lib/supabase-rest';

type ProductPageProps = {
  params: Promise<{ id: string }> | { id: string };
};

function safeDecode(value: string) {
  try { return decodeURIComponent(value); } catch { return value; }
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const value = safeDecode(String(resolved?.id ?? '')).trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  try {
    const rows = await supabaseRest<Array<{ nombre: string; descripcion_corta?: string | null; descripcion?: string | null; imagen?: string | null }>>('productos', {
      query: isUuid
        ? { select: 'nombre,descripcion_corta,descripcion,imagen', id: `eq.${value}`, limit: '1' }
        : { select: 'nombre,descripcion_corta,descripcion,imagen', slug: `eq.${value}`, limit: '1' },
    });
    const product = rows[0];
    if (product) {
      const description = (product.descripcion_corta || product.descripcion || 'Compra este producto en GutiStore.').slice(0, 160);
      return {
        title: product.nombre,
        description,
        openGraph: { title: `${product.nombre} | GutiStore`, description, images: product.imagen ? [product.imagen] : ['/guti-store-logo.jpg'], type: 'website' },
      };
    }
  } catch {
    // La página sigue funcionando aunque metadata no pueda consultar Supabase durante un build sin variables.
  }
  return { title: 'Producto', description: 'Explora este producto en GutiStore.' };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const productId = safeDecode(String(resolvedParams?.id ?? '')).trim();
  return <ProductDetailView productId={productId} />;
}
