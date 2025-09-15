import React, { createContext, useContext, useState, useEffect } from 'react';

export const CURRENCY_SYMBOLS = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'INR': '₹',
  'SGD': 'S$',
  'THB': '฿',
  'AED': 'د.إ',
  'IDR': 'Rp',
  'MYR': 'RM',
  'CAD': 'C$',
  'VND': '₫'
};

const FALLBACK_RATES = {
  'USD': 1,
  'EUR': 0.92,
  'GBP': 0.79,
  'INR': 83.5,
  'SGD': 1.35,
  'THB': 36.5,
  'AED': 3.67,
  'IDR': 16250,
  'MYR': 4.75,
  'CAD': 1.36,
  'VND': 25000
};

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  // Initialize selectedCurrency from localStorage or default to USD
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    return savedCurrency && CURRENCY_SYMBOLS[savedCurrency] ? savedCurrency : 'USD';
  });
  
  const [exchangeRates, setExchangeRates] = useState({});
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [error, setError] = useState(null);

  // Save currency to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('selectedCurrency', selectedCurrency);
  }, [selectedCurrency]);

  // Fetch exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setIsLoadingRates(true);
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates');
        }
        
        const data = await response.json();
        
        if (data.rates) {
          const rates = {};
          Object.keys(CURRENCY_SYMBOLS).forEach(code => {
            if (data.rates[code]) {
              rates[code] = {
                rate: data.rates[code],
                symbol: CURRENCY_SYMBOLS[code]
              };
            }
          });
          setExchangeRates(rates);
        } else {
          throw new Error('Invalid response from exchange rate API');
        }
      } catch (err) {
        console.error('Error fetching exchange rates:', err);
        // Use fallback rates if API fails
        const fallbackRates = {};
        Object.entries(FALLBACK_RATES).forEach(([code, rate]) => {
          fallbackRates[code] = { rate, symbol: CURRENCY_SYMBOLS[code] };
        });
        setExchangeRates(fallbackRates);
        setError('Using offline rates - may not be current');
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchExchangeRates();
    // Refresh rates every hour
    const intervalId = setInterval(fetchExchangeRates, 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const formatPrice = (priceInUSD) => {
    if (isLoadingRates) {
      return 'Loading...';
    }
    
    const currency = exchangeRates[selectedCurrency];
    console.log('formatPrice called with:', { 
      priceInUSD, 
      selectedCurrency, 
      currency, 
      exchangeRates,
      allCurrencies: Object.keys(exchangeRates)
    });
    
    if (!currency) {
      console.error(`No currency found for: ${selectedCurrency}`);
      return `$${priceInUSD.toFixed(2)}`;
    }
    
    const convertedPrice = (priceInUSD * currency.rate).toFixed(2);
    const formattedNumber = convertedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const result = `${currency.symbol} ${formattedNumber}`;
    console.log('formatPrice result:', result);
    return result;
  };

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency,
        setSelectedCurrency,
        formatPrice,
        CURRENCY_SYMBOLS,
        isLoadingRates,
        error
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
