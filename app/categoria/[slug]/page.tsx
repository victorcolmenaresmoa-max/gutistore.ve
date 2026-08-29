import type { Metadata } from 'next';
import CatalogView from '@/components/CatalogView';
import { supabaseRest } from '@/lib/supabase-rest';

export const dynamic = 'force-dynamic';

type CategoryPageProps = { params: Promise<{ slug: string }> | { slug: string } };

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const slug = decodeURIComponent(resolved.slug);
  try {
    const rows = await supabaseRest<Array<{ name: string; description: string | null; image: string | null }>>('categorias', {
      query: { select: 'name,description,image', slug: `eq.${slug}`, is_active: 'eq.true', limit: '1' },
    });
    const category = rows[0];
    if (category) {
      const description = (category.description || `Explora ${category.name} en GutiStore.`).slice(0, 160);
      return { title: category.name, description, openGraph: { title: `${category.name} | GutiStore`, description, images: category.image ? [category.image] : ['/guti-store-logo.jpg'] } };
    }
  } catch {
    // Fallback seguro si aún no hay variables durante el build.
  }
  const fallback = slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  return { title: fallback, description: `Explora ${fallback} en GutiStore.` };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolved = await Promise.resolve(params);
  return <CatalogView initialCategorySlug={decodeURIComponent(resolved.slug)} />;
}
