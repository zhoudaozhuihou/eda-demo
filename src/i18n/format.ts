import i18n from './index';
import { normalizeLanguage, type SupportedLanguage } from './routing';

function getLanguage(lng?: string): SupportedLanguage {
  return normalizeLanguage(lng ?? i18n.language);
}

export function formatDateTime(value: string | number | Date, opts?: Intl.DateTimeFormatOptions, lng?: string) {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(getLanguage(lng), opts ?? { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export function formatDate(value: string | number | Date, opts?: Intl.DateTimeFormatOptions, lng?: string) {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(getLanguage(lng), opts ?? { dateStyle: 'medium' }).format(d);
}

export function formatNumber(value: number, opts?: Intl.NumberFormatOptions, lng?: string) {
  return new Intl.NumberFormat(getLanguage(lng), opts ?? { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatCurrency(value: number, currency: string, opts?: Intl.NumberFormatOptions, lng?: string) {
  return new Intl.NumberFormat(getLanguage(lng), opts ?? { style: 'currency', currency }).format(value);
}

