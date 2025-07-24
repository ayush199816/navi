// Currency configuration map
export const CURRENCY_CONFIG = {
  'INR': { symbol: '₹', locale: 'en-IN' },
  'SGD': { symbol: 'S$', locale: 'en-SG' },
  'AED': { symbol: 'د.إ', locale: 'ar-AE' },
  'IDR': { symbol: 'Rp', locale: 'id-ID' },
  'THB': { symbol: '฿', locale: 'th-TH' },
  'VND': { symbol: '₫', locale: 'vi-VN' },
  'EUR': { symbol: '€', locale: 'de-DE' },
  'MYR': { symbol: 'RM', locale: 'ms-MY' },
  'USD': { symbol: '$', locale: 'en-US' },
  'GBP': { symbol: '£', locale: 'en-GB' },
  'JPY': { symbol: '¥', locale: 'ja-JP' }
};

// Format price with currency symbol and proper number formatting
export const formatPrice = (price, currency = 'INR') => {
  if (price === undefined || price === null || price === '') return '-';
  
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG['INR'];
  const number = parseFloat(price);
  
  if (isNaN(number)) return '-';
  
  // Format the number according to the currency's locale
  const formattedNumber = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number);
  
  // Return the formatted string with the currency symbol
  return `${config.symbol} ${formattedNumber}`.trim();
};
