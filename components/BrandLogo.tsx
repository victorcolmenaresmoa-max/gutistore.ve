/**
 * Logo oficial de GutiStore.
 * Las imágenes provienen del archivo original del logo (recortado y con fondo
 * transparente), nunca se redibujan. Se declaran con su tamaño intrínseco y
 * en CSS solo se fija la altura (ancho automático + object-fit: contain), por
 * lo que la proporción original se respeta siempre.
 *
 *  - horizontal: isotipo + "GutiStore" en una línea (header).
 *  - full: versión completa con "Suplementos & Accesorios" (footer, login).
 *  - mark: solo el isotipo "G" (espacios muy pequeños).
 *
 * Las tres versiones están pensadas para fondos oscuros.
 */
const LOGOS = {
  horizontal: { src: '/brand/gutistore-horizontal.png', width: 809, height: 150 },
  full: { src: '/brand/gutistore-logo.png', width: 786, height: 589 },
  mark: { src: '/brand/gutistore-mark.png', width: 351, height: 357 },
} as const;

type LogoVariant = keyof typeof LOGOS;

export default function BrandLogo({
  variant = 'horizontal',
  className = '',
  priority = false,
}: {
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
}) {
  const logo = LOGOS[variant];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.src}
      width={logo.width}
      height={logo.height}
      alt="GutiStore"
      className={`brand-logo brand-logo-${variant} ${className}`}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
    />
  );
}
