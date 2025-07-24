import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SightseeingNav from '../components/sightseeing/SightseeingNav';
import { FiCalendar, FiUsers, FiPlus, FiMinus, FiShoppingCart, FiCreditCard, FiMapPin, FiClock, FiInfo, FiStar, FiPackage, FiTag } from 'react-icons/fi';
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
  
  const { 
    currentSightseeing, 
    loading: sightseeingLoading, 
    error, 
  } = useSelector((state) => ({
    currentSightseeing: state.guestSightseeings.currentSightseeing,
    loading: state.guestSightseeings.loading,
    error: state.guestSightseeings.error,
  }));
  
  const sightseeing = currentSightseeing || {};

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
        console.log('Sightseeing loaded:', result);
        
        if (isMounted) {
          if (!result) {
            throw new Error('Sightseeing not found');
          }
        }
      } catch (error) {
        console.error('Error loading sightseeing:', error);
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

  const handleAddToCart = () => {
    if (!sightseeing) return;
    
    // Create a unique ID that includes the date and pax to allow multiple entries of the same sightseeing
    const uniqueId = `${sightseeing._id}-${selectedDate.getTime()}-${pax}`;
    
    // Use offerPrice if available, otherwise use regular price
    const price = sightseeing.offerPrice !== null && sightseeing.offerPrice !== undefined 
      ? sightseeing.offerPrice 
      : sightseeing.price;
      
    const cartItem = {
      id: uniqueId,
      originalId: sightseeing._id, // Keep reference to the original sightseeing ID
      name: sightseeing.name,
      price: sightseeing.price, // Store original price
      offerPrice: sightseeing.offerPrice, // Store offer price separately
      quantity: 1, // Each selection is a separate entry
      pax: pax, // Store pax separately
      date: selectedDate,
      image: sightseeing.images?.[0],
      type: 'sightseeing',
      totalPrice: price * pax, // Calculate total using the appropriate price
      hasOffer: sightseeing.offerPrice !== null && sightseeing.offerPrice !== undefined
    };
    
    dispatch(addToCart(cartItem));
    toast.success('Added to cart successfully!');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
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
            onClick={() => navigate('/tours')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Tours
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <SightseeingNav sightseeing={sightseeing} />
      
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
              <img 
                src={sightseeing.images?.[0] || '/placeholder-sightseeing.jpg'} 
                alt={sightseeing.name}
                className="w-full h-full object-cover"
              />
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
                    <span>{sightseeing.location || 'Location not specified'}</span>
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
                            {sightseeing.offerPriceCurrency || 'USD'} {sightseeing.offerPrice.toFixed(2)}
                            <span className="ml-2 text-sm text-gray-500 line-through">
                              {sightseeing.priceCurrency || 'USD'} {sightseeing.price?.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          `${sightseeing.priceCurrency || 'USD'} ${sightseeing.price?.toFixed(2) || '0.00'}`
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
                            ${sightseeing.offerPrice ? sightseeing.offerPrice.toFixed(2) : sightseeing.price?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total</span>
                          <span className="text-blue-600">
                            ${((sightseeing.offerPrice || sightseeing.price || 0) * pax).toFixed(2)}
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
        </div>
      </div>
    </div>
  );
};

export default SightseeingDetailPage;
