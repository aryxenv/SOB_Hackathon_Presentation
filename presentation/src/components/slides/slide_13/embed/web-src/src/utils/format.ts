import type { Locale } from '../types';

const localeMap: Record<Locale, string> = {
  en: 'en-BE',
  fr: 'fr-BE',
  nl: 'nl-BE',
};

export function formatDateRange(start: string, end: string, locale: Locale): string {
  const loc = localeMap[locale];
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const s = new Date(start);
  const e = new Date(end);
  if (start === end) return s.toLocaleDateString(loc, opts);
  return `${s.toLocaleDateString(loc, opts)} – ${e.toLocaleDateString(loc, opts)}`;
}

export function localizedField<T extends Record<Locale, string>>(
  field: T,
  locale: Locale,
): string {
  return field[locale] || field.en;
}
