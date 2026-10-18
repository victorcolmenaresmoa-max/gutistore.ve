/**
 * Se vuelve a montar en cada navegación: cada página entra con una
 * transición suave (definida en .page-enter, en globals.css).
 */
export default function StoreTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
