import ProductDetailView from "@/components/ProductDetailView";

type ProductPageProps = {
  params: Promise<{ id: string }> | { id: string };
};

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  // En Next.js moderno `params` puede llegar como una Promise. Esperarlo también
  // es compatible con versiones donde se entrega como un objeto normal.
  const resolvedParams = await Promise.resolve(params);
  const productId = safeDecode(String(resolvedParams?.id ?? "")).trim();

  return <ProductDetailView productId={productId} />;
}
