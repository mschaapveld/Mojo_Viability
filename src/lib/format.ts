/**
 * Shared formatting utilities for currency, percentages, and parsing.
 *
 * Currency contract: functions suffixed "Cents" accept cents (integer);
 * functions without suffix accept dollars (number).
 */

// ── Currency (dollars input) ────────────────────────────────────────

/** Format a dollar amount as AUD with no decimals. e.g. $12,500 */
export function formatCurrency(dollars: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars);
}

// ── Currency (cents input) ──────────────────────────────────────────

/** Coerce unknown value to a finite number (0 if NaN/Infinity). */
export function safeCents(v: unknown): number {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

/** Format cents as AUD with no decimals. e.g. $125 */
export function formatCents(cents: number): string {
  const safe = safeCents(cents);
  return (safe / 100).toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Format cents as AUD with 2 decimals. e.g. $1.50 */
export function formatCentsDecimal(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Format cents as AUD with 2 decimals, using Intl for locale. */
export function formatAud(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Format cents as smart denomination: ¢ if < $1, otherwise dollars. */
export function formatCentsSmart(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1) return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
  return `${cents}¢`;
}

// ── Nullable variants (for dashboard data that may be null) ─────────

/** Format nullable cents as AUD, no decimals. Returns '–' for null. */
export function formatCentsNullable(cents: number | null): string {
  if (cents == null) return '–';
  const dollars = cents / 100;
  const abs = Math.abs(dollars);
  const formatted = '$' + abs.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return dollars < 0 ? '–' + formatted : formatted;
}

/** Format nullable cents as AUD, 2 decimals. Returns '–' for null. */
export function formatCentsDecimalNullable(cents: number | null): string {
  if (cents == null) return '–';
  const dollars = cents / 100;
  const abs = Math.abs(dollars);
  const formatted = '$' + abs.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return dollars < 0 ? '–' + formatted : formatted;
}

// ── Variance formatters ─────────────────────────────────────────────

/** Format cents with +/- prefix (for budget variance display). */
export function formatVarianceCents(cents: number): string {
  const safe = safeCents(cents);
  const abs = Math.abs(safe);
  const formatted = (abs / 100).toLocaleString('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return safe >= 0 ? `+${formatted}` : `-${formatted}`;
}

/** Format a percentage variance with +/- prefix, 1 decimal. Returns '—' for non-finite. */
export function formatVariancePct(value: number): string {
  if (!isFinite(value)) return '—';
  return (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
}

// ── Percentage formatters ───────────────────────────────────────────

/** Format a percentage value (already 0-100 scale) with 1 decimal. */
export function formatPct(value: number): string {
  return value.toFixed(1) + '%';
}

/** Alias for formatPct. */
export const formatPercentage = formatPct;

/** Format a nullable ratio (0-1 scale) as percentage with 2 decimals. Returns '–' for null. */
export function formatRatioPct(value: number | null): string {
  if (value == null) return '–';
  return (value * 100).toFixed(2) + '%';
}

// ── Parsing helpers ─────────────────────────────────────────────────

/** Parse a user-entered dollar string (e.g. "$1,234.56") into cents. */
export function parseCurrencyInput(val: string): number {
  const stripped = val.replace(/[^0-9.]/g, '');
  return Math.round(parseFloat(stripped || '0') * 100);
}

/** Format cents as a plain number string for input fields (no $ symbol). */
export function formatCurrencyInput(cents: number): string {
  if (!cents || cents === 0) return '';
  return (cents / 100).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Constants ───────────────────────────────────────────────────────

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

export const DAY_NAMES_SHORT = [
  'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
] as const;
