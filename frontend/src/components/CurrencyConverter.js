import React, { useState, useEffect } from 'react';
import { FaExchangeAlt, FaMoneyBillWave } from 'react-icons/fa';

const CurrencyConverter = () => {
  const [amount, setAmount] = useState(1);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // List of popular currencies
  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'SGD', name: 'Singapore Dollar' },
    { code: 'VND', name: 'Vietnamese Dong' },
    { code: 'IDR', name: 'Indonesian Rupiah' },
    { code: 'MYR', name: 'Malaysian Ringgit' },
    { code: 'THB', name: 'Thai Baht' },
    { code: 'AED', name: 'UAE Dirham' },
  ];

  // Fetch exchange rate from ExchangeRate-API
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) {
        setExchangeRate(1);
        setConvertedAmount(amount);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // First, convert from source currency to USD (as our free API uses USD as base)
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates');
        }
        
        const data = await response.json();
        
        // Get the rate for the target currency
        const rate = data.rates[toCurrency];
        
        if (!rate) {
          throw new Error(`Exchange rate not available for ${toCurrency}`);
        }
        
        setExchangeRate(rate);
        setConvertedAmount(amount * rate);
      } catch (err) {
        console.error('Error fetching exchange rate:', err);
        // Fallback to mock rates if API fails
        const mockRates = {
          'USD_EUR': 0.92,
          'EUR_USD': 1.09,
          'USD_GBP': 0.79,
          'GBP_USD': 1.27,
          'USD_JPY': 151.23,
          'JPY_USD': 0.0066,
          'USD_INR': 83.45,
          'INR_USD': 0.012,
          'EUR_GBP': 0.86,
          'GBP_EUR': 1.16,
        };
        
        const rateKey = `${fromCurrency}_${toCurrency}`;
        const rate = mockRates[rateKey] || 1.0;
        
        setExchangeRate(rate);
        setConvertedAmount(amount * rate);
        setError('Using offline rates - may not be current');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchangeRate();
  }, [fromCurrency, toCurrency, amount]);

  const handleAmountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setAmount(value);
    setConvertedAmount(value * (exchangeRate || 1));
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <FaMoneyBillWave className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Currency Converter
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
            Get the latest exchange rates and convert between currencies
          </p>
          <div className="w-20 h-1 bg-blue-600 mx-auto mt-4"></div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="w-full sm:w-1/3">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    value={amount}
                    onChange={handleAmountChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md h-10 border"
                    placeholder="1.00"
                  />
                </div>
              </div>

              <div className="w-full sm:w-1/3">
                <label htmlFor="from-currency" className="block text-sm font-medium text-gray-700 mb-1">
                  From
                </label>
                <select
                  id="from-currency"
                  name="from-currency"
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 h-10 w-full pl-3 pr-10 border border-gray-300 rounded-md bg-white py-2 text-sm"
                >
                  {currencies.map((currency) => (
                    <option key={`from-${currency.code}`} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleSwapCurrencies}
                className="mt-6 sm:mt-0 p-2 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Swap currencies"
              >
                <FaExchangeAlt className="h-5 w-5" />
              </button>

              <div className="w-full sm:w-1/3">
                <label htmlFor="to-currency" className="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <select
                  id="to-currency"
                  name="to-currency"
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 h-10 w-full pl-3 pr-10 border border-gray-300 rounded-md bg-white py-2 text-sm"
                >
                  {currencies.map((currency) => (
                    <option key={`to-${currency.code}`} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  {amount} {fromCurrency} =
                </p>
                <p className="mt-1 text-3xl font-semibold text-blue-600">
                  {isLoading ? '...' : convertedAmount.toFixed(4)} {toCurrency}
                </p>
                {exchangeRate && !isLoading && (
                  <p className="mt-2 text-sm text-gray-500">
                    1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Exchange rates are for demonstration purposes only and may not reflect real-time rates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;
