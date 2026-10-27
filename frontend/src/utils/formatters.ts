import { CurrencyCode } from '../types.js';

export const formatCurrency = (amount: number, currency: CurrencyCode = 'INR'): string => {
  const symbol = currency === 'INR' ? '₹' : '$';
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  
  const formattedNumber = Math.abs(amount).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formattedNumber}`;
};

export const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
};

export const maskAccountId = (id: string): string => {
  if (!id) return '•••• •••• •••• ••••';
  const clean = id.replace(/-/g, '').toUpperCase();
  return `•••• •••• •••• ${clean.slice(-4)}`;
};
