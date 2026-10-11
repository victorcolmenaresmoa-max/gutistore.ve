const SELLER_REFERRAL_KEY = 'gutistore-seller-referral';
/** Clave usada por la versión anterior de la tienda (se sigue leyendo para no perder referidos vigentes). */
const LEGACY_REFERRAL_KEY = 'guti-supplements-seller-referral';
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredSellerReferral {
  code: string;
  capturedAt: number;
  expiresAt: number;
}

export function normalizeSellerCode(value: unknown): string {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 40);
}

export function captureSellerReferralFromUrl(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const code = normalizeSellerCode(params.get('ref') || params.get('vendedor'));
  if (!code) return;

  const now = Date.now();
  const payload: StoredSellerReferral = {
    code,
    capturedAt: now,
    expiresAt: now + ATTRIBUTION_WINDOW_MS,
  };

  try {
    window.localStorage.setItem(SELLER_REFERRAL_KEY, JSON.stringify(payload));
  } catch {
    // Si el navegador bloquea localStorage, el pedido sigue funcionando sin referencia.
  }
}

export function getStoredSellerReferral(): string {
  if (typeof window === 'undefined') return '';

  // Se revisa cada clave por separado: un referido vencido en la clave nueva
  // no debe borrar uno todavía vigente guardado por la versión anterior.
  for (const key of [SELLER_REFERRAL_KEY, LEGACY_REFERRAL_KEY]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw) as Partial<StoredSellerReferral>;
      const code = normalizeSellerCode(parsed.code);
      const expiresAt = Number(parsed.expiresAt) || 0;

      if (code && expiresAt > Date.now()) return code;
      window.localStorage.removeItem(key);
    } catch {
      // Dato dañado o localStorage bloqueado: se ignora esta clave.
    }
  }
  return '';
}
