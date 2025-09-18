import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiStar, FiGlobe, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGuestSightseeings } from '../redux/slices/guestSightseeingSlice';
import SightseeingNav from '../components/sightseeing/SightseeingNav';
import { useCurrency } from '../contexts/CurrencyContext';

const ToursPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const currencyDropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get currency context
  const {
    selectedCurrency,
    setSelectedCurrency,
    formatPrice,
    CURRENCY_SYMBOLS,
    isLoadingRates
  } = useCurrency();
  
  const { sightseeings, loading, error } = useSelector((state) => state.guestSightseeings);
  
  useEffect(() => {
    dispatch(fetchGuestSightseeings({ isActive: true }));
    
    // Handle click outside to close currency dropdown
    const handleClickOutside = (event) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
        setShowCurrencyDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dispatch, currencyDropdownRef]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    // First, filter by city if provided
    const filters = {
      city: citySearch.trim(),
      country: countryFilter,
      isActive: true
    };
    
    // Only include city if there's a city search term
    if (!filters.city) {
      delete filters.city;
    }
    
    // Only include country if one is selected
    if (!filters.country) {
      delete filters.country;
    }
    
    // Add search term to filters if provided
    if (searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }
    
    dispatch(fetchGuestSightseeings(filters));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <SightseeingNav>
        <div className="flex items-center">
        {/* Currency Selector */}
        <div className="relative ml-4" ref={currencyDropdownRef}>
          <button 
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors focus:outline-none"
          >
            <FiGlobe className="w-5 h-5" />
            <span className="font-medium">{selectedCurrency}</span>
            {showCurrencyDropdown ? (
              <FiChevronUp className="w-4 h-4" />
            ) : (
              <FiChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {showCurrencyDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
              <div className="py-1">
                {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
                  <button
                    key={code}
                    onClick={() => {
                      setSelectedCurrency(code);
                      setShowCurrencyDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${selectedCurrency === code ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {code} ({symbol})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </SightseeingNav>
      
      <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Amazing Sightseeings</h1>
          <p className="text-xl text-gray-600">Explore the best activities and attractions at your destination</p>
        </div>

        {/* Search Form */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-12 border border-gray-100">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* City Input */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-3.5 text-gray-700 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="Search by city..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  aria-label="Search by city"
                />
              </div>

              {/* Sightseeing Name Input */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-3.5 text-gray-700 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="Search Island Tour/ Dinner Cruise Tiger Park..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search sightseeings by name"
                />
              </div>

              {/* Country Filter */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="block w-full pl-12 pr-10 py-3.5 text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all duration-200 cursor-pointer"
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                >
                  <option value="">All Destinations</option>
                  {Array.from(new Set(sightseeings.map(s => s.country))).map((country, idx) => (
                    <option key={idx} value={country}>{country}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FiChevronDown className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                className="w-full md:min-w-[300px] px-16 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 whitespace-nowrap transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <FiSearch className="h-5 w-5" />
                <span className="font-semibold">Search Tours</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sightseeings Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {countryFilter ? `Sightseeings in ${countryFilter}` : 'All Sightseeings'}
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading sightseeings...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="https://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sightseeings.map((sightseeing) => (
                <div key={sightseeing._id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                  {sightseeing.images && sightseeing.images.length > 0 ? (
                    <img 
                      src={sightseeing.images[0].startsWith('http') ? sightseeing.images[0] : `${process.env.REACT_APP_API_URL}/${sightseeing.images[0]}`} 
                      alt={sightseeing.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-gray-900">{sightseeing.name}</h3>
                      <div className="flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        <FiStar className="mr-1" />
                        {sightseeing.rating || 'New'}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{sightseeing.country}</p>
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">{sightseeing.description}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        {sightseeing.offerPrice && sightseeing.offerPrice < sightseeing.price ? (
                          <div>
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(sightseeing.offerPrice)}
                            </span>
                            <span className="ml-2 text-sm text-gray-500 line-through">
                              {formatPrice(sightseeing.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            {sightseeing.price ? formatPrice(sightseeing.price) : 'Price on request'}
                          </span>
                        )}
                      </div>
                      <button 
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/sightseeing/${sightseeing._id}`);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default ToursPage;
