import type { CategoryArtKind } from '@/lib/categories';

/**
 * Ilustraciones lineales propias para categorías sin fotografía.
 * Blanco/gris con acentos en rojo GutiStore; escalan sin perder nitidez.
 */
const ART: Record<CategoryArtKind, React.ReactNode> = {
  ropa: (
    <>
      <path d="M44 22 30 28 16 44l12 12 8-6v48h48V50l8 6 12-12-14-16-14-6c-2 7-8 12-16 12s-14-5-16-12Z" />
      <path className="accent" d="M44 22c2 7 8 12 16 12s14-5 16-12" />
      <path className="soft" d="M50 64h20M50 74h14" />
    </>
  ),
  calzado: (
    <>
      <path d="M14 78c0-10 4-20 10-28l10 4c6 2 12 0 16-6l6-8 6 4c4 10 14 18 28 22l12 4c6 2 8 6 8 10v6H14Z" />
      <path className="accent" d="M14 86h96" />
      <path className="soft" d="M50 50l6 4M44 56l6 4M38 62l6 4M74 64l20 6" />
    </>
  ),
  lentes: (
    <>
      <path d="M18 54h30l-2 16c-1 8-7 12-14 12s-13-5-14-12Z" />
      <path d="M72 54h30l-2 16c-1 8-7 12-14 12s-13-5-14-12Z" />
      <path className="accent" d="M48 58c4-4 20-4 24 0" />
      <path className="soft" d="M18 54 10 44M102 54l8-10M26 62l8 8M80 62l8 8" />
    </>
  ),
  hidratacion: (
    <>
      <path d="M50 18h20v10l6 8v66a6 6 0 0 1-6 6H50a6 6 0 0 1-6-6V36l6-8Z" />
      <path className="accent" d="M44 52h32M44 84h32" />
      <path className="soft" d="M54 62v14M54 18h12" />
    </>
  ),
  suplementos: (
    <>
      <path d="M36 34h48v8H36z" />
      <path d="M34 42h52v58a6 6 0 0 1-6 6H40a6 6 0 0 1-6-6Z" />
      <path className="accent" d="M34 58h52v28H34z" />
      <path className="soft" d="M46 68h28M46 76h18M40 22h40v12H40z" />
    </>
  ),
  accesorios: (
    <>
      <path d="M22 50v20M98 50v20M32 42v36M88 42v36M32 60h56" />
      <path className="accent" d="M42 38h8v44h-8zM70 38h8v44h-8z" />
      <path className="soft" d="M14 60h8M98 60h8" />
    </>
  ),
  gorras: (
    <>
      <path d="M24 70c0-22 16-38 36-38s36 16 36 38Z" />
      <path className="accent" d="M24 70h60c10 0 18 4 22 10H36" />
      <path className="soft" d="M60 32v38M46 36c-4 10-6 22-6 34M74 36c4 10 6 22 6 34" />
    </>
  ),
  bolsos: (
    <>
      <path d="M26 46h68l-6 56H32Z" />
      <path className="accent" d="M44 46v-8a16 16 0 0 1 32 0v8" />
      <path className="soft" d="M40 64h40M40 74h24" />
    </>
  ),
  general: (
    <>
      <path d="M28 44h64l-6 56H34Z" />
      <path className="accent" d="M46 44v-6a14 14 0 0 1 28 0v6" />
      <path className="soft" d="M48 70l8 8 18-18" />
    </>
  ),
};

export default function CategoryArt({ kind, className = '' }: { kind: CategoryArtKind; className?: string }) {
  return (
    <svg
      className={`category-art ${className}`}
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ART[kind]}
    </svg>
  );
}
