import { format, parseISO, isValid, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const d = typeof value === 'string' ? parseISO(value) : value;
  return isValid(d) ? d : null;
}

export function fmtDate(value?: string | Date | null, pattern = 'dd MMM yyyy'): string {
  const d = toDate(value);
  return d ? format(d, pattern, { locale: es }) : '—';
}

export function fmtDateTime(value?: string | Date | null): string {
  const d = toDate(value);
  return d ? format(d, "dd MMM yyyy · hh:mm a", { locale: es }) : '—';
}

export function fmtTime(value?: string | Date | null): string {
  const d = toDate(value);
  return d ? format(d, 'hh:mm a', { locale: es }) : '—';
}

/** Formato monetario en soles peruanos (S/). */
export function fmtMoney(n?: number | string | null): string {
  const value = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function edadDesde(fechaNacimiento?: string | null): number | null {
  const d = toDate(fechaNacimiento);
  return d ? differenceInYears(new Date(), d) : null;
}

/** Iniciales para avatares: "Ana García" → "AG". */
export function iniciales(nombre?: string | null): string {
  if (!nombre) return '?';
  const parts = nombre.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}
