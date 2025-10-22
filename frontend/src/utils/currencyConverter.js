// Currency conversion utility with real-time API
// Uses exchangerate-api.com (free, no API key required)
// Fallback to predefined rate if API fails
const API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
const FALLBACK_RATE = 87.98; // Last known USD to INR rate

/**
 * Fetch current USD to INR exchange rate from free API
 * @returns {Promise<number>} Current exchange rate
 */
const fetchExchangeRate = async () => {
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(API_BASE_URL, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.rates || !data.rates.INR) {
      throw new Error('Invalid API response: INR rate not found');
    }

    return data.rates.INR;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('Exchange rate API request timed out');
    } else {
      console.warn('Failed to fetch exchange rate from API:', error.message);
    }
    console.log('Falling back to predefined rate');
    return FALLBACK_RATE;
  }
};

/**
 * Get current exchange rate (for display purposes)
 * @returns {Promise<number>} Current USD to INR rate
 */
const getExchangeRate = async () => {
  try {
    return await fetchExchangeRate();
  } catch (error) {
    console.error('Failed to get exchange rate:', error);
    return FALLBACK_RATE;
  }
};

/**
 * Convert USD amount to INR using real-time rates (async)
 * @param {number} usdAmount - Amount in USD
 * @returns {Promise<number>} Amount in INR (rounded to 2 decimal places)
 */
const convertUSDToINR = async (usdAmount) => {
  if (typeof usdAmount !== 'number' || usdAmount < 0) {
    throw new Error('Invalid USD amount provided');
  }

  try {
    const exchangeRate = await fetchExchangeRate();
    const inrAmount = usdAmount * exchangeRate;
    return Math.round(inrAmount * 100) / 100;
  } catch (error) {
    console.error('Currency conversion failed:', error);
    // Fallback to predefined rate if API fails
    return Math.round(usdAmount * FALLBACK_RATE * 100) / 100;
  }
};

/**
 * Convert USD amount to INR using fallback rate (synchronous)
 * Use this when you need immediate conversion without async operations
 * @param {number} usdAmount - Amount in USD
 * @returns {number} Amount in INR (rounded to 2 decimal places)
 */
const convertUSDToINRSync = (usdAmount) => {
  if (typeof usdAmount !== 'number' || usdAmount < 0) {
    throw new Error('Invalid USD amount provided');
  }
  return Math.round(usdAmount * FALLBACK_RATE * 100) / 100;
};

/**
 * Convert INR amount to USD using real-time rates
 * @param {number} inrAmount - Amount in INR
 * @returns {Promise<number>} Amount in USD (rounded to 2 decimal places)
 */
const convertINRToUSD = async (inrAmount) => {
  if (typeof inrAmount !== 'number' || inrAmount < 0) {
    throw new Error('Invalid INR amount provided');
  }

  try {
    const exchangeRate = await fetchExchangeRate();
    const usdAmount = inrAmount / exchangeRate;
    return Math.round(usdAmount * 100) / 100;
  } catch (error) {
    console.error('Currency conversion failed:', error);
    // Fallback to predefined rate if API fails
    return Math.round(inrAmount / FALLBACK_RATE * 100) / 100;
  }
};

/**
 * Format price for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (USD or INR)
 * @returns {string} Formatted price string
 */
const formatPrice = (amount, currency = 'USD') => {
  if (typeof amount !== 'number') {
    return '0.00';
  }

  const formattedAmount = amount.toFixed(2);
  return currency === 'INR' ? `₹${formattedAmount}` : `$${formattedAmount}`;
};

module.exports = {
  convertUSDToINR,
  convertINRToUSD,
  convertUSDToINRSync,
  formatPrice,
  getExchangeRate,
  fetchExchangeRate,
  FALLBACK_RATE
};
