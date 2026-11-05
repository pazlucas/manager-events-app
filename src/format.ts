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

/** Monto opcional: vacío devuelve undefined; si hay texto debe ser válido (null si no lo es). */
export function parseOptionalAmount(text: string): number | null | undefined {
  return text.trim() ? parseAmount(text) : undefined;
}

export function usd(value: number): string {
  return 'u$d ' + value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Fecha local de hoy en formato AAAA-MM-DD. */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Convierte "DD/MM/AAAA" a "AAAA-MM-DD"; devuelve '' si no es una fecha válida. */
export function parseDate(text: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!m) return '';
  const [, d, mo, y] = m.map(Number);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return '';
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
