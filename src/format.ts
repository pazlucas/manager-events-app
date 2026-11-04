export function money(value: number): string {
  return '$ ' + value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Acepta "1234,56" o "1234.56" y devuelve un número, o null si no es válido. */
export function parseAmount(text: string): number | null {
  const normalized = text.trim().replace(/\./g, (m, i, s) => (s.includes(',') ? '' : m)).replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const n = Number(normalized);
  return n > 0 ? n : null;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
