import { normalizeText } from './text';

/**
 * Colores comunes en español. Se usan solo cuando el administrador no indicó
 * un código hexadecimal, para que el swatch siga siendo visual.
 */
const KNOWN_COLORS: Record<string, string> = {
  negro: '#111111',
  blanco: '#FFFFFF',
  rojo: '#E0202E',
  azul: '#1F4FD1',
  'azul marino': '#14213D',
  marino: '#14213D',
  celeste: '#7FB8E6',
  gris: '#8A8A8A',
  'gris oscuro': '#3A3A3A',
  'gris claro': '#CFCFCF',
  beige: '#D9C7A7',
  crema: '#EFE6D2',
  verde: '#2E8B57',
  'verde oliva': '#6B7B3A',
  oliva: '#6B7B3A',
  rosa: '#F29CB7',
  fucsia: '#D1247A',
  morado: '#6A3FA0',
  lila: '#B79CE0',
  amarillo: '#F4C430',
  naranja: '#F07D1A',
  marron: '#6F4A2F',
  cafe: '#6F4A2F',
  vino: '#6D1A2B',
  dorado: '#C9A227',
  plateado: '#C0C0C0',
  transparente: '',
};

/** Devuelve un hexadecimal válido o una cadena vacía. */
export function sanitizeHex(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(withHash)) return withHash.toUpperCase();
  return '';
}

/** Hex a mostrar para un color: el guardado o uno conocido por su nombre. */
export function resolveColorHex(nombre: string, hex?: string): string {
  const explicit = sanitizeHex(hex);
  if (explicit) return explicit;
  return KNOWN_COLORS[normalizeText(nombre)] || '';
}

/** True si el color es muy claro y necesita borde/contraste oscuro. */
export function isLightColor(hex: string): boolean {
  const clean = sanitizeHex(hex).replace('#', '');
  if (!clean) return false;
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}
