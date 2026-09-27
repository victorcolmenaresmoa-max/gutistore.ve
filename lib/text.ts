/** Quita acentos y pasa a minúsculas para comparar o buscar texto. */
export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Convierte un texto en un identificador apto para URL: "Camisa Dry-Fit Negra" → "camisa-dry-fit-negra". */
export function slugify(value: unknown): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Separa un texto en líneas no vacías (listas escritas "una por línea"). */
export function splitLines(value: unknown): string[] {
  return String(value ?? '')
    .split(/[\r\n]+/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

/** Separa etiquetas escritas con comas. */
export function splitTags(value: unknown): string[] {
  return Array.from(
    new Set(
      String(value ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Id corto legible para mostrar un pedido. */
export function shortOrderId(id: string) {
  return String(id || '').replace(/-/g, '').slice(0, 8).toUpperCase();
}
