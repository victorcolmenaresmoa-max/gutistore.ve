import { isLightColor, resolveColorHex } from '@/lib/colors';

/**
 * Muestra de color. Si el color no tiene hex ni es un color conocido,
 * se muestra la inicial del nombre como alternativa legible.
 */
export default function ColorSwatch({ nombre, hex, size = 'md' }: { nombre: string; hex?: string; size?: 'xs' | 'sm' | 'md' }) {
  const resolved = resolveColorHex(nombre, hex);
  if (!resolved) {
    return (
      <span className={`swatch swatch-${size} swatch-text`} aria-hidden="true">
        {nombre.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <span
      className={`swatch swatch-${size} ${isLightColor(resolved) ? 'swatch-light' : ''}`}
      style={{ background: resolved }}
      aria-hidden="true"
    />
  );
}
