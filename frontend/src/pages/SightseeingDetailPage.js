import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SightseeingNav from '../components/sightseeing/SightseeingNav';
import { FiCalendar, FiPlus, FiMinus, FiShoppingCart, FiMapPin, FiClock, FiStar, FiPackage, FiTag, FiGlobe, FiChevronDown, FiChevronUp, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import { useCurrency } from '../contexts/CurrencyContext';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { getGuestSightseeingById, clearCurrentSightseeing, fetchGuestSightseeings } from '../redux/slices/guestSightseeingSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const SightseeingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [pax, setPax] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [recommendedSightseeings, setRecommendedSightseeings] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [similarSightseeings, setSimilarSightseeings] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const currencyDropdownRef = useRef(null);
  
  // Get currency context
  const {
    selectedCurrency,
    setSelectedCurrency,
    CURRENCY_SYMBOLS,
    formatPrice,
  } = useCurrency();
  
  const { 
    currentSightseeing, 
    loading: sightseeingLoading
  } = useSelector((state) => ({
    currentSightseeing: state.guestSightseeings.currentSightseeing,
    loading: state.guestSightseeings.loading,
  }));
  
  const sightseeing = currentSightseeing || {};

  // Handle click outside to close currency dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
        setShowCurrencyDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [currencyDropdownRef]);

  useEffect(() => {
    if (!id) {
      toast.error('Invalid sightseeing ID');
      navigate('/tours');
      return;
    }

    let isMounted = true;

    const loadSightseeing = async () => {
      try {
        if (isMounted) {
          dispatch(clearCurrentSightseeing());
        }
        
        const result = await dispatch(getGuestSightseeingById(id)).unwrap();
        
        if (isMounted) {
          if (!result) {
            throw new Error('Sightseeing not found');
          }
        }
      } catch (error) {
        if (isMounted) {
          toast.error(error || 'Failed to load sightseeing details');
          navigate('/tours');
        }
      }
    };

    loadSightseeing();
    
    return () => {
      isMounted = false;
    };
  }, [id, dispatch, navigate]);

  // Fetch recommended sightseeings when current sightseeing loads
  useEffect(() => {
    // Clear recommendations when sightseeing changes
    setRecommendedSightseeings([]);
    
    const fetchRecommended = async () => {
      if (!sightseeing.city && !sightseeing.country) return;
      
      setLoadingRecommended(true);
      try {
        const params = {
          limit: 6,
          excludeId: sightseeing._id,
        };
        
        // Add city filter if available
        if (sightseeing.city) {
          params.city = sightseeing.city;
        }
        
        // Add country filter if available
        if (sightseeing.country) {
          params.country = sightseeing.country;
        }
        
        const result = await dispatch(fetchGuestSightseeings(params)).unwrap();
        setRecommendedSightseeings(result.data || []);
      } catch (error) {
        console.error('Failed to fetch recommended sightseeings:', error);
      } finally {
        setLoadingRecommended(false);
      }
    };

    if (sightseeing._id) {
      fetchRecommended();
    }
  }, [sightseeing._id, sightseeing.city, sightseeing.country, dispatch]);

  // Auto refresh recommendations on initial page load
  useEffect(() => {
    const autoRefreshOnLoad = async () => {
      if (sightseeing._id && (sightseeing.city || sightseeing.country)) {
        // Clear old recommendations first
        setRecommendedSightseeings([]);
        
        setLoadingRecommended(true);
        try {
          const params = {
            limit: 6,
            excludeId: sightseeing._id,
          };
          
          // Add city filter if available
          if (sightseeing.city) {
            params.city = sightseeing.city;
          }
          
          // Add country filter if available
          if (sightseeing.country) {
            params.country = sightseeing.country;
          }
          
          const result = await dispatch(fetchGuestSightseeings(params)).unwrap();
          setRecommendedSightseeings(result.data || []);
        } catch (error) {
          console.error('Failed to auto refresh recommended sightseeings:', error);
        } finally {
          setLoadingRecommended(false);
        }
      }
    };

    // Small delay to ensure the page is fully loaded
    const timer = setTimeout(autoRefreshOnLoad, 400);
    
    return () => clearTimeout(timer);
  }, [dispatch, sightseeing._id, sightseeing.city, sightseeing.country]); // Add missing dependencies

  // Fetch similar sightseeings based on similar names
  useEffect(() => {
    // Clear similar sightseeings when sightseeing changes
    setSimilarSightseeings([]);
    
    const fetchSimilarSightseeings = async () => {
      if (!sightseeing._id || !sightseeing.name) return;
      
      setLoadingSimilar(true);
      try {
        // Extract meaningful keywords from the current sightseeing name
        const nameWords = sightseeing.name.toLowerCase()
          .split(/[^a-zA-Z0-9]+/)
          .filter(word => word.length > 2);
        
        // Filter out generic terms and focus on specific tour types
        const genericTerms = [
          'the', 'a', 'an', 'and', 'or', 'with', 'on', 'for', 'in', 
          'experience', 'tour', 'show', 'ultimate', 'adventure', 'package', 
          'tickets', 'seating', 'regular', 'deluxe', 'shared', 'transfers',
          'adult', 'kids', 'child', 'family', 'private', 'public'
        ];
        
        // Keep specific terms that indicate the actual activity
        const relevantKeywords = nameWords.filter(word => !genericTerms.includes(word));
        
        // If we have specific keywords, use them; otherwise use the most meaningful words
        let searchTerms;
        if (relevantKeywords.length > 0) {
          searchTerms = relevantKeywords.slice(0, 2); // Use top 2 specific keywords
        } else {
          // Fallback: use the first meaningful words but avoid generic ones
          searchTerms = nameWords.slice(0, 2);
        }
        
        const params = {
          limit: 6,
          excludeId: sightseeing._id,
          search: searchTerms.join(' '),
        };
        
        const result = await dispatch(fetchGuestSightseeings(params)).unwrap();
        setSimilarSightseeings(result.data || []);
      } catch (error) {
        console.error('Failed to fetch similar sightseeings:', error);
      } finally {
        setLoadingSimilar(false);
      }
    };

    if (sightseeing._id && sightseeing.name) {
      fetchSimilarSightseeings();
    }
  }, [dispatch, sightseeing._id, sightseeing.name]);

  // Manual refresh function
  const refreshRecommendations = async () => {
    if (!sightseeing.city && !sightseeing.country) {
      toast.info('No location information available for recommendations');
      return;
    }
    
    setLoadingRecommended(true);
    try {
      const params = {
        limit: 6,
        excludeId: sightseeing._id,
      };
      
      // Add city filter if available
      if (sightseeing.city) {
        params.city = sightseeing.city;
      }
      
      // Add country filter if available
      if (sightseeing.country) {
        params.country = sightseeing.country;
      }
      
      const result = await dispatch(fetchGuestSightseeings(params)).unwrap();
      setRecommendedSightseeings(result.data || []);
      toast.success('Recommendations refreshed!');
    } catch (error) {
      console.error('Failed to refresh recommended sightseeings:', error);
      toast.error('Failed to refresh recommendations');
    } finally {
      setLoadingRecommended(false);
    }
  };

  const handleAddToCart = () => {
    if (!sightseeing) return;
    
    // Create a unique ID that includes the date and pax to allow multiple entries of the same sightseeing
    const uniqueId = `${sightseeing._id}-${selectedDate.getTime()}-${pax}`;
    
    // Ensure we're storing prices in USD
    const priceInUSD = sightseeing.priceCurrency === 'USD' 
      ? sightseeing.price 
      : sightseeing.price / (sightseeing.exchangeRate || 1);
      
    const offerPriceInUSD = sightseeing.offerPrice && sightseeing.priceCurrency === 'USD'
      ? sightseeing.offerPrice
      : sightseeing.offerPrice / (sightseeing.exchangeRate || 1);
      
    const cartItem = {
      id: uniqueId,
      originalId: sightseeing._id, // Keep reference to the original sightseeing ID
      name: sightseeing.name,
      price: priceInUSD, // Store price in USD
      priceCurrency: 'USD', // Explicitly set to USD
      offerPrice: sightseeing.offerPrice ? offerPriceInUSD : undefined, // Store offer price in USD if available
      quantity: 1, // Each selection is a separate entry
      pax: pax, // Store pax separately
      date: selectedDate,
      image: sightseeing.images?.[0],
      type: 'sightseeing',
      totalPrice: (sightseeing.offerPrice ? offerPriceInUSD : priceInUSD) * pax, // Calculate total in USD
      hasOffer: sightseeing.offerPrice !== null && sightseeing.offerPrice !== undefined
    };
    
    dispatch(addToCart(cartItem));
    toast.success('Added to cart successfully!');
  };

  if (sightseeingLoading || !sightseeing || Object.keys(sightseeing).length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sightseeing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">Sightseeing not found</h2>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <SightseeingNav sightseeing={sightseeing}>
        <div className="flex items-center">
          {/* Currency Selector */}
          <div className="relative" ref={currencyDropdownRef}>
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
          <button 
            onClick={() => navigate(-1)}
            className="mb-6 text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Back to Results
          </button>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Image Gallery */}
            <div className="relative h-96 w-full">
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
                    controls
                    poster={sightseeing.images && sightseeing.images.length > 0 ? 
                      (sightseeing.images[0].startsWith('http') ? sightseeing.images[0] : `${process.env.REACT_APP_API_URL}/${sightseeing.images[0]}`) : 
                      undefined
                    }
                  />
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-sm px-3 py-1 rounded-full flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Video Available
                  </div>
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No media available</span>
                </div>
              )}
              <div className="absolute bottom-4 right-4 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full flex items-center">
                <FiStar className="mr-1" />
                {sightseeing.rating?.toFixed(1) || 'New'}
              </div>
            </div>
            
            {/* Main Content */}
            <div className="p-6 md:p-8">
              <div className="md:flex md:justify-between md:items-start">
                {/* Left Column - Details */}
                <div className="md:w-2/3 md:pr-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{sightseeing.name}</h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <FiMapPin className="mr-1" />
                    <span>{sightseeing.city || sightseeing.location || 'Location not specified'}</span>
                    {sightseeing.country && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {sightseeing.country}
                      </span>
                    )}
                  </div>
                  
                  <div className="prose max-w-none mb-6">
                    <h3 className="text-lg font-semibold mb-2">Overview</h3>
                    <p className="text-gray-700">{sightseeing.description || 'No description available.'}</p>
                  </div>
                  
                  <div className="prose max-w-none mb-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <FiClock className="mr-2" /> Duration
                    </h3>
                    <p className="text-gray-700">{sightseeing.duration || 'Not specified'}</p>
                  </div>
                  
                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold mb-2">What's Included</h3>
                    <ul className="list-disc pl-5 text-gray-700">
                      {Array.isArray(sightseeing.inclusions) && sightseeing.inclusions.length > 0 ? (
                        sightseeing.inclusions.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li>No inclusions specified</li>
                      )}
                    </ul>
                  </div>
                </div>
                
                {/* Right Column - Booking */}
                <div className="md:w-1/3 mt-8 md:mt-0">
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {sightseeing.offerPrice ? (
                          <>
                            {formatPrice(sightseeing.offerPrice)}
                            <span className="ml-2 text-sm text-gray-500 line-through">
                              {formatPrice(sightseeing.price)}
                            </span>
                          </>
                        ) : (
                          formatPrice(sightseeing.price || 0)
                        )}
                      </div>
                      <p className="text-sm text-gray-600">per person</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Date
                        </label>
                        <div className="relative">
                          <DatePicker
                            selected={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            minDate={new Date()}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            dateFormat="MMMM d, yyyy"
                          />
                          <FiCalendar className="absolute right-3 top-2.5 text-gray-400" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of People
                        </label>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                          <button 
                            type="button" 
                            onClick={() => setPax(Math.max(1, pax - 1))}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
                          >
                            <FiMinus />
                          </button>
                          <div className="flex-1 text-center px-4 py-2">
                            {pax} {pax === 1 ? 'Person' : 'People'}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setPax(pax + 1)}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
                          >
                            <FiPlus />
                          </button>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">Price per person</span>
                          <span className="text-sm font-medium">
                            {formatPrice(sightseeing.offerPrice || sightseeing.price || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total</span>
                          <span className="text-blue-600">
                            {formatPrice((sightseeing.offerPrice || sightseeing.price || 0) * pax)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <button
                          onClick={handleAddToCart}
                          className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FiShoppingCart className="mr-2 h-5 w-5" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Detailed Information Section */}
            <div className="bg-white px-6 py-12">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Left Column */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">About This Tour</h2>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 mb-6">
                        {sightseeing.aboutTour || sightseeing.detailedDescription || 'No detailed description available.'}
                      </p>
                      
                      {sightseeing.highlights && sightseeing.highlights.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Highlights</h3>
                          <ul className="list-disc pl-5 space-y-2">
                            {sightseeing.highlights.map((highlight, index) => (
                              <li key={index} className="text-gray-700">{highlight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Tour Details</h3>
                      
                      <div className="space-y-6">
                        {sightseeing.meetingPoint && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                              <FiMapPin className="mr-2 text-blue-600" />
                              Meeting Point
                            </h4>
                            <p className="text-gray-700 pl-6">{sightseeing.meetingPoint}</p>
                          </div>
                        )}
                        
                        {sightseeing.duration && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                              <FiClock className="mr-2 text-blue-600" />
                              Duration
                            </h4>
                            <p className="text-gray-700 pl-6">{sightseeing.duration}</p>
                          </div>
                        )}
                        
                        {sightseeing.whatToBring && sightseeing.whatToBring.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                              <FiPackage className="mr-2 text-blue-600" />
                              What to Bring
                            </h4>
                            <div className="flex flex-wrap gap-2 pl-6">
                              {sightseeing.whatToBring.map((item, index) => (
                                <span key={index} className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {sightseeing.keywords && sightseeing.keywords.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                              <FiTag className="mr-2 text-blue-600" />
                              Keywords
                            </h4>
                            <div className="flex flex-wrap gap-2 pl-6">
                              {sightseeing.keywords.map((keyword, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Video Gallery Section */}
          {sightseeing.videos && sightseeing.videos.length > 0 && (
            <div className="mt-12 bg-white rounded-xl shadow-lg p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Gallery</h2>
                <p className="text-gray-600">
                  Watch videos to get a better feel for this amazing experience
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sightseeing.videos.map((video, index) => (
                  <div key={index} className="relative overflow-hidden rounded-lg border border-gray-200">
                    <video
                      src={video.startsWith('http') ? video : `${process.env.REACT_APP_API_URL}/${video}`}
                      className="w-full h-48 object-cover"
                      controls
                      preload="metadata"
                      poster={sightseeing.images && sightseeing.images.length > 0 ? 
                        (sightseeing.images[0].startsWith('http') ? sightseeing.images[0] : `${process.env.REACT_APP_API_URL}/${sightseeing.images[0]}`) : 
                        undefined
                      }
                    />
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      Video {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Similar Sightseeing Section */}
          {similarSightseeings.length > 0 && (
            <div className="mt-12 bg-white rounded-xl shadow-lg p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Similar Sightseeing Options</h2>
                <p className="text-gray-600">
                  More tours similar to "{sightseeing.name}"
                </p>
              </div>
              
              {loadingSimilar ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {similarSightseeings.map((similar) => (
                    <div key={similar._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      {/* Media - Image or Video */}
                      <div className="h-48 w-full">
                        {similar.images && similar.images.length > 0 ? (
                          <img 
                            src={similar.images[0].startsWith('http') ? similar.images[0] : `${process.env.REACT_APP_API_URL}/${similar.images[0]}`} 
                            alt={similar.name}
                            className="w-full h-full object-cover"
                          />
                        ) : similar.videos && similar.videos.length > 0 ? (
                          <div className="relative w-full h-full">
                            <video
                              src={similar.videos[0].startsWith('http') ? similar.videos[0] : `${process.env.REACT_APP_API_URL}/${similar.videos[0]}`}
                              className="w-full h-full object-cover"
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
                            <span className="text-gray-400">No media</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                          {similar.name}
                        </h3>
                        
                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <FiMapPin className="mr-1" />
                          <span>{similar.city || 'Location not specified'}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-600 text-sm mb-3">
                          <FiClock className="mr-1" />
                          <span>{similar.duration || 'Not specified'}</span>
                        </div>
                        
                        {/* Price */}
                        <div className="mb-4">
                          <div className="text-lg font-bold text-blue-600">
                            {formatPrice(similar.offerPrice || similar.price || 0)}
                            {similar.offerPrice && (
                              <span className="ml-2 text-sm text-gray-500 line-through">
                                {formatPrice(similar.price || 0)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">per person</p>
                        </div>
                        
                        {/* View Details Button */}
                        <button
                          onClick={() => navigate(`/sightseeing/${similar._id}/${encodeURIComponent(similar.name.toLowerCase().replace(/\s+/g, '-'))}`)}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* View All Similar Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => navigate('/tours')}
                  className="inline-flex items-center px-6 py-3 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition-colors duration-200 font-medium"
                >
                  View All Similar Tours
                  <FiChevronRight className="ml-2" />
                </button>
              </div>
            </div>
          )}
          
          {/* Recommended Sightseeing Section */}
          {recommendedSightseeings.length > 0 && (
            <div className="mt-12 bg-white rounded-xl shadow-lg p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommended Sightseeing Options</h2>
                  <p className="text-gray-600">
                    Discover more amazing experiences in {sightseeing.city || sightseeing.country || 'this destination'}
                  </p>
                </div>
                <button
                  onClick={refreshRecommendations}
                  disabled={loadingRecommended}
                  className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiRefreshCw className={`mr-2 ${loadingRecommended ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              
              {loadingRecommended ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedSightseeings.map((recommended) => (
                    <div key={recommended._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      {/* Media - Image or Video */}
                      <div className="h-48 w-full">
                        {recommended.images && recommended.images.length > 0 ? (
                          <img 
                            src={recommended.images[0].startsWith('http') ? recommended.images[0] : `${process.env.REACT_APP_API_URL}/${recommended.images[0]}`} 
                            alt={recommended.name}
                            className="w-full h-full object-cover"
                          />
                        ) : recommended.videos && recommended.videos.length > 0 ? (
                          <div className="relative w-full h-full">
                            <video
                              src={recommended.videos[0].startsWith('http') ? recommended.videos[0] : `${process.env.REACT_APP_API_URL}/${recommended.videos[0]}`}
                              className="w-full h-full object-cover"
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
                            <span className="text-gray-400">No media</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                          {recommended.name}
                        </h3>
                        
                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <FiMapPin className="mr-1" />
                          <span>{recommended.city || 'Location not specified'}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-600 text-sm mb-3">
                          <FiClock className="mr-1" />
                          <span>{recommended.duration || 'Not specified'}</span>
                        </div>
                        
                        {/* Price */}
                        <div className="mb-4">
                          <div className="text-lg font-bold text-blue-600">
                            {formatPrice(recommended.offerPrice || recommended.price || 0)}
                            {recommended.offerPrice && (
                              <span className="ml-2 text-sm text-gray-500 line-through">
                                {formatPrice(recommended.price || 0)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">per person</p>
                        </div>
                        
                        {/* View Details Button */}
                        <button
                          onClick={() => navigate(`/sightseeing/${recommended._id}/${encodeURIComponent(recommended.name.toLowerCase().replace(/\s+/g, '-'))}`)}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* View All Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => navigate('/tours')}
                  className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors duration-200 font-medium"
                >
                  View All Sightseeing Options
                  <FiChevronRight className="ml-2" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SightseeingDetailPage;
