const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function assertSupabaseConfig() {
  if (!SUPABASE_URL) {
    throw new Error('Falta configurar SUPABASE_URL en Vercel.');
  }

  if (!SUPABASE_SECRET_KEY) {
    throw new Error(
      'Falta configurar SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY en Vercel.'
    );
  }
}

export type SupabaseRestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  prefer?: string;
};

export async function supabaseRest<T>(
  resource: string,
  options: SupabaseRestOptions = {}
): Promise<T> {
  assertSupabaseConfig();

  const url = new URL(`${SUPABASE_URL}/rest/v1/${resource.replace(/^\//, '')}`);
  Object.entries(options.query || {}).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  const headers: Record<string, string> = {
    apikey: SUPABASE_SECRET_KEY,
    Accept: 'application/json',
  };

  // Las claves nuevas sb_secret_ no son JWT y deben enviarse solamente como
  // apikey. La clave legacy service_role sí utiliza Authorization: Bearer.
  if (!SUPABASE_SECRET_KEY.startsWith('sb_secret_')) {
    headers.Authorization = `Bearer ${SUPABASE_SECRET_KEY}`;
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.prefer) {
    headers.Prefer = options.prefer;
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
  });

  const raw = await response.text();
  let payload: unknown = null;

  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    const details =
      payload && typeof payload === 'object'
        ? [
            'message' in payload ? String(payload.message || '') : '',
            'details' in payload ? String(payload.details || '') : '',
            'hint' in payload ? String(payload.hint || '') : '',
          ]
            .filter(Boolean)
            .join(' ')
        : String(payload || '');

    throw new Error(details || `Supabase respondió con HTTP ${response.status}.`);
  }

  return payload as T;
}

export function getSupabaseProjectUrl() {
  assertSupabaseConfig();
  return SUPABASE_URL;
}
