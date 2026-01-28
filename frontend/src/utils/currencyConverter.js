// Currency conversion utility for THB to INR conversion
// Fixed rate: 1 THB = 3.15 INR

// Fixed exchange rate for THB to INR conversion
const THB_TO_INR_RATE = 3.25;

// Currency symbols
const CURRENCY_SYMBOLS = {
  THB: '฿',
  INR: '₹'
};

/**
 * Convert amount from USD to INR
 * Using approximate rate: 1 USD = 83 INR
 * @param {number} amount - Amount in USD
 * @returns {Promise<number>} Amount in INR (rounded to 2 decimal places)
 */
const convertUSDToINR = async (amount) => {
  if (typeof amount !== 'number' || amount < 0) {
    throw new Error('Invalid amount provided');
  }
  // Fixed rate: 1 USD = 83 INR
  const USD_TO_INR_RATE = 93.72;
  return Math.round(amount * USD_TO_INR_RATE * 100) / 100;
};

/**
 * Convert amount from THB to INR using fixed rate
 * @param {number} amount - Amount in THB
 * @returns {number} Amount in INR (rounded to 2 decimal places)
 */
const convertTHBToINR = (amount) => {
  if (typeof amount !== 'number' || amount < 0) {
    throw new Error('Invalid amount provided');
  }
  return Math.round(amount * THB_TO_INR_RATE * 100) / 100;
};

/**
 * Convert amount from INR to THB using fixed rate
 * @param {number} amount - Amount in INR
 * @returns {number} Amount in THB (rounded to 2 decimal places)
 */
const convertINRToTHB = (amount) => {
  if (typeof amount !== 'number' || amount < 0) {
    throw new Error('Invalid amount provided');
  }
  return Math.round(amount / THB_TO_INR_RATE * 100) / 100;
};

/**
 * Convert amount between THB and INR
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency ('THB' or 'INR')
 * @param {string} toCurrency - Target currency ('THB' or 'INR')
 * @returns {number} Converted amount (rounded to 2 decimal places)
 */
const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (typeof amount !== 'number' || amount < 0) {
    throw new Error('Invalid amount provided');
  }
  
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (fromCurrency === 'THB' && toCurrency === 'INR') {
    return convertTHBToINR(amount);
  }
  
  if (fromCurrency === 'INR' && toCurrency === 'THB') {
    return convertINRToTHB(amount);
  }
  
  throw new Error(`Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`);
};

/**
 * Get exchange rate between THB and INR
 * @param {string} fromCurrency - Source currency ('THB' or 'INR')
 * @param {string} toCurrency - Target currency ('THB' or 'INR')
 * @returns {Promise<number>} Exchange rate
 */
const getExchangeRate = async (fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  if (fromCurrency === 'THB' && toCurrency === 'INR') {
    return THB_TO_INR_RATE;
  }
  
  if (fromCurrency === 'INR' && toCurrency === 'THB') {
    return 1 / THB_TO_INR_RATE;
  }
  
  throw new Error(`Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`);
};


/**
 * Format price for display with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code ('THB' or 'INR')
 * @returns {string} Formatted price string
 */
const formatPrice = (amount, currency = 'INR') => {
  if (typeof amount !== 'number') {
    return '0.00';
  }

  const formattedAmount = amount.toFixed(2);
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${formattedAmount}`;
};

/**
 * Get currency symbol for display
 * @param {string} currency - Currency code ('THB' or 'INR')
 * @returns {string} Currency symbol
 */
const getCurrencySymbol = (currency) => {
  return CURRENCY_SYMBOLS[currency] || currency;
};

module.exports = {
  convertCurrency,
  convertUSDToINR,
  convertTHBToINR,
  convertINRToTHB,
  getExchangeRate,
  formatPrice,
  getCurrencySymbol,
  THB_TO_INR_RATE,
  CURRENCY_SYMBOLS
};
