const SELLER_REFERRAL_KEY = 'guti-supplements-seller-referral';
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

  try {
    const raw = window.localStorage.getItem(SELLER_REFERRAL_KEY);
    if (!raw) return '';

    const parsed = JSON.parse(raw) as Partial<StoredSellerReferral>;
    const code = normalizeSellerCode(parsed.code);
    const expiresAt = Number(parsed.expiresAt) || 0;

    if (!code || expiresAt <= Date.now()) {
      window.localStorage.removeItem(SELLER_REFERRAL_KEY);
      return '';
    }

    return code;
  } catch {
    return '';
  }
}
