import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiStar, FiGlobe, FiChevronDown, FiChevronUp, FiDollarSign, FiActivity, FiUsers } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGuestSightseeings } from '../redux/slices/guestSightseeingSlice';
import SightseeingNav from '../components/sightseeing/SightseeingNav';
import { useCurrency } from '../contexts/CurrencyContext';

const ToursPage = () => {
  const [citySearch, setCitySearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [tourTypeFilter, setTourTypeFilter] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  // State declarations
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [isDragging, setIsDragging] = useState(null);
  const sliderRef = useRef(null);
  
  // Default price range
  const [priceRange, setPriceRange] = useState([0, 1000]);
  
  // Get sightseeings from Redux store
  const { sightseeings, loading, error } = useSelector((state) => state.guestSightseeings);
  
  // Calculate min and max price from available sightseeings
  const priceRangeLimits = React.useMemo(() => {
    if (!sightseeings?.length) return { min: 0, max: 1000 };
    const prices = sightseeings.map(s => s.price).filter(price => typeof price === 'number');
    if (prices.length === 0) return { min: 0, max: 1000 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [sightseeings]);

  const normalizeFilterValue = (value = '') => value?.toString().trim().toLowerCase() || '';
  const formatFilterLabel = (value = '') => {
    if (!value) return '';
    return value
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const activityTypeOptions = React.useMemo(() => {
    const defaultOptions = ['sightseeing', 'transfers', 'both'];
    const fromData = sightseeings?.map(s => normalizeFilterValue(s.activityType)).filter(Boolean) || [];
    const uniqueValues = Array.from(new Set([...defaultOptions, ...fromData]));
    return uniqueValues.map(value => ({
      value,
      label: formatFilterLabel(value)
    }));
  }, [sightseeings]);

  const tourTypeOptions = React.useMemo(() => {
    const defaultOptions = ['shared', 'private', 'both', 'none'];
    const fromData = sightseeings?.map(s => normalizeFilterValue(s.tourType)).filter(Boolean) || [];
    const uniqueValues = Array.from(new Set([...defaultOptions, ...fromData]));
    return uniqueValues.map(value => ({
      value,
      label: value === 'none' ? 'Not specified' : formatFilterLabel(value)
    }));
  }, [sightseeings]);
  
  // Handle slider drag
  const handleMouseDown = useCallback((type) => {
    setIsDragging(type);
  }, []);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);
  
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !sliderRef.current) return;
    
    const slider = sliderRef.current;
    const rect = slider.getBoundingClientRect();
    
    // Calculate the new value based on mouse position (with bounds checking)
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    
    // Calculate the price range size
    const range = priceRangeLimits.max - priceRangeLimits.min;
    
    // Calculate the new value using logarithmic scale for better distribution
    const percentage = x / rect.width;
    let newValue;
    
    // Use logarithmic scale for better distribution of values
    if (range > 1000) {
      // For larger ranges, use logarithmic scale
      const logMin = Math.log10(priceRangeLimits.min || 1);
      const logMax = Math.log10(priceRangeLimits.max || 1);
      const logRange = logMax - logMin;
      const logValue = logMin + (percentage * logRange);
      newValue = Math.round(Math.pow(10, logValue));
    } else {
      // For smaller ranges, use linear scale
      newValue = Math.round(priceRangeLimits.min + (percentage * range));
    }
    
    // Ensure we don't go below min or above max
    newValue = Math.max(priceRangeLimits.min, Math.min(newValue, priceRangeLimits.max));
    
    // Calculate minimum gap (1% of total range, but at least 1 unit)
    const minGap = Math.max(1, range * 0.01);
    
    // Update the appropriate value based on which handle is being dragged
    if (isDragging === 'min') {
      // For min handle, ensure it doesn't go above max - minGap
      const maxMinValue = priceRange[1] - minGap;
      const clampedValue = Math.min(newValue, maxMinValue);
      setPriceRange(prev => [Math.max(clampedValue, priceRangeLimits.min), prev[1]]);
    } else if (isDragging === 'max') {
      // For max handle, ensure it doesn't go below min + minGap
      const minMaxValue = priceRange[0] + minGap;
      const clampedValue = Math.max(newValue, minMaxValue);
      setPriceRange(prev => [prev[0], Math.min(clampedValue, priceRangeLimits.max)]);
    }
  }, [isDragging, priceRangeLimits.min, priceRangeLimits.max, priceRange]);
  
  // Add/remove global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  // Update price range when limits change
  useEffect(() => {
    setPriceRange([priceRangeLimits.min, priceRangeLimits.max]);
  }, [priceRangeLimits]);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const currencyDropdownRef = useRef(null);
  
  // Get currency context
  const {
    selectedCurrency,
    setSelectedCurrency,
    formatPrice,
    CURRENCY_SYMBOLS
  } = useCurrency();
  
  
  const handleSearch = useCallback((e) => {
    e?.preventDefault?.();
    // Prepare filters
    const filters = {
      isActive: true
    };
    
    // Add city filter if provided
    if (cityFilter) {
      filters.city = cityFilter;
    }
    
    // Add country filter if selected
    if (countryFilter) {
      filters.country = countryFilter;
    }

    if (activityFilter) {
      filters.activityType = activityFilter;
    }

    if (tourTypeFilter) {
      filters.tourType = tourTypeFilter;
    }

    const trimmedSearch = citySearch.trim();
    if (trimmedSearch) {
      filters.search = trimmedSearch;
    }
    setActiveSearchTerm(trimmedSearch);
    
    dispatch(fetchGuestSightseeings(filters));
  }, [cityFilter, citySearch, countryFilter, activityFilter, tourTypeFilter, dispatch]);
  
  // Filter sightseeings by price on the client side
  const filteredSightseeings = React.useMemo(() => {
    if (!sightseeings) return [];
    const normalizedActivityFilter = normalizeFilterValue(activityFilter);
    const normalizedTourTypeFilter = normalizeFilterValue(tourTypeFilter);
    const normalizedSearchTerm = normalizeFilterValue(activeSearchTerm);

    return sightseeings.filter(sightseeing => {
      const price = sightseeing.price || 0;
      const sightseeingActivity = normalizeFilterValue(sightseeing.activityType);
      const sightseeingTourType = normalizeFilterValue(sightseeing.tourType);
      const fieldsToSearch = [
        sightseeing.name,
        sightseeing.description,
        sightseeing.city,
        sightseeing.country
      ];
      const matchesActivity = normalizedActivityFilter ? sightseeingActivity === normalizedActivityFilter : true;
      const matchesTourType = normalizedTourTypeFilter ? sightseeingTourType === normalizedTourTypeFilter : true;
      const matchesSearch = normalizedSearchTerm
        ? fieldsToSearch.some(field => normalizeFilterValue(field).includes(normalizedSearchTerm))
        : true;
      return price >= priceRange[0] && price <= priceRange[1] && matchesActivity && matchesTourType && matchesSearch;
    });
  }, [sightseeings, priceRange, activityFilter, tourTypeFilter, activeSearchTerm]);
  
  // Initial data load and setup
  useEffect(() => {
    // Initial load with default filters
    const initialFilters = {
      isActive: true
    };
    
    dispatch(fetchGuestSightseeings(initialFilters));
    setActiveSearchTerm('');
    
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
            <div className="space-y-4 mb-4">
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-3.5 text-gray-700 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  placeholder="Search by tour name, city, or destination..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  aria-label="Search tours"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* City Filter */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="block w-full pl-12 pr-10 py-3.5 text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all duration-200 cursor-pointer"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                  >
                    <option value="">All Cities</option>
                    {Array.from(new Set(sightseeings
                      .filter(s => !countryFilter || s.country === countryFilter)
                      .map(s => s.city)
                      .filter(Boolean)))
                      .sort()
                      .map((city, idx) => (
                        <option key={idx} value={city}>{city}</option>
                      ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FiChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
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

                {/* Activity Type Filter */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiActivity className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="block w-full pl-12 pr-10 py-3.5 text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all duration-200 cursor-pointer"
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                  >
                    <option value="">All Activity Types</option>
                    {activityTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FiChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Tour Type Filter */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiUsers className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="block w-full pl-12 pr-10 py-3.5 text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all duration-200 cursor-pointer"
                    value={tourTypeFilter}
                    onChange={(e) => setTourTypeFilter(e.target.value)}
                  >
                    <option value="">All Tour Types</option>
                    {tourTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FiChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Price Range Filter */}
            <div className="mb-4">
              <button 
                type="button"
                onClick={() => setShowPriceFilter(!showPriceFilter)}
                className="flex items-center text-sm text-gray-600 hover:text-blue-600 mb-2"
              >
                <FiDollarSign className="mr-1" />
                <span>Price Range</span>
                {showPriceFilter ? (
                  <FiChevronUp className="ml-1 w-4 h-4" />
                ) : (
                  <FiChevronDown className="ml-1 w-4 h-4" />
                )}
              </button>
              
              {showPriceFilter && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      {formatPrice(priceRange[0])}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatPrice(priceRange[1])}
                    </span>
                  </div>
                  <div 
                    className="relative py-2"
                    ref={sliderRef}
                    onMouseLeave={handleMouseUp}
                  >
                    <div className="relative w-full h-1 bg-gray-200 rounded-full" ref={sliderRef}>
                      <div 
                        className="absolute h-full bg-blue-500 rounded-full"
                        style={{
                          left: `${((priceRange[0] - priceRangeLimits.min) / (priceRangeLimits.max - priceRangeLimits.min)) * 100}%`,
                          width: `${((priceRange[1] - priceRange[0]) / (priceRangeLimits.max - priceRangeLimits.min)) * 100}%`
                        }}
                      />
                      <input
                        type="range"
                        min={priceRangeLimits.min}
                        max={priceRangeLimits.max}
                        step={1}
                        value={priceRange[0]}
                        onChange={(e) => {
                          const newMin = parseInt(e.target.value);
                          if (newMin < priceRange[1]) {
                            setPriceRange([newMin, priceRange[1]]);
                          }
                        }}
                        onMouseDown={() => handleMouseDown('min')}
                        className="absolute w-full h-1 appearance-none pointer-events-none opacity-0"
                      />
                      <input
                        type="range"
                        min={priceRangeLimits.min}
                        max={priceRangeLimits.max}
                        step={1}
                        value={priceRange[1]}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value);
                          if (newMax > priceRange[0]) {
                            setPriceRange([priceRange[0], newMax]);
                          }
                        }}
                        onMouseDown={() => handleMouseDown('max')}
                        className="absolute w-full h-1 appearance-none pointer-events-none opacity-0"
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full cursor-pointer -ml-2 z-10"
                        style={{
                          left: `${((priceRange[0] - priceRangeLimits.min) / (priceRangeLimits.max - priceRangeLimits.min)) * 100}%`,
                          transform: 'translateY(-50%) translateX(0)'
                        }}
                        onMouseDown={() => handleMouseDown('min')}
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full cursor-pointer -ml-2 z-10"
                        style={{
                          left: `${((priceRange[1] - priceRangeLimits.min) / (priceRangeLimits.max - priceRangeLimits.min)) * 100}%`,
                          transform: 'translateY(-50%) translateX(-100%)'
                        }}
                        onMouseDown={() => handleMouseDown('max')}
                      />
                    </div>  
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-2 flex justify-center">
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
          ) : filteredSightseeings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No sightseeings found matching your filters.</p>
              <button 
                onClick={() => {
                  setPriceRange([priceRangeLimits.min, priceRangeLimits.max]);
                  setCityFilter('');
                  setCountryFilter('');
                  setCitySearch('');
                  setActivityFilter('');
                  setTourTypeFilter('');
                  setActiveSearchTerm('');
                  dispatch(fetchGuestSightseeings({ isActive: true }));
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSightseeings.map((sightseeing) => (
                <div key={sightseeing._id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                  {/* Media Section - Images and Videos */}
                  <div className="relative h-48">
                    {sightseeing.images && sightseeing.images.length > 0 ? (
                      <img 
                        src={sightseeing.images[0].startsWith('http') ? sightseeing.images[0] : `${process.env.REACT_APP_API_URL}/${sightseeing.images[0]}`} 
                        alt={sightseeing.name}
                        className="w-full h-full object-cover"
                      />
                    ) : sightseeing.videos && sightseeing.videos.length > 0 ? (
                      <div className="relative w-full h-full">
                        <video
                          src={sightseeing.videos[0].startsWith('http') ? sightseeing.videos[0] : `${process.env.REACT_APP_API_URL}/${sightseeing.videos[0]}`}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                          Video
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No media available</span>
                      </div>
                    )}
                  </div>
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
                          const urlFriendlyName = sightseeing.name
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '') // Remove special characters
                            .replace(/\s+/g, '-')      // Replace spaces with hyphens
                            .replace(/-+/g, '-');       // Replace multiple hyphens with single one
                          navigate(`/sightseeing/${sightseeing._id}/${urlFriendlyName}`);
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
