import * as Crypto from 'expo-crypto';

export function generateId(prefix?: string): string {
  const uuid = Crypto.randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

export function formatCurrency(amount: number, currencyCode = 'IDR', language: 'id' | 'en' = 'id'): string {
  const isZeroDecimal = currencyCode === 'IDR' || currencyCode === 'JPY';
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(amount || 0);
  } catch {
    const prefix = currencyCode === 'IDR' ? 'Rp' : `${currencyCode} `;
    return `${prefix}${(amount || 0).toLocaleString(locale)}`;
  }
}

export function formatDateShort(isoDate: string, language: 'id' | 'en' = 'id'): string {
  if (!isoDate) return '-';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowIsoTimestamp(): string {
  return new Date().toISOString();
}
