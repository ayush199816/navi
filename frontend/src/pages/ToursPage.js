import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGuestSightseeings } from '../redux/slices/guestSightseeingSlice';
import SightseeingNav from '../components/sightseeing/SightseeingNav';

const ToursPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { sightseeings, loading, error } = useSelector((state) => state.guestSightseeings);
  
  useEffect(() => {
    dispatch(fetchGuestSightseeings({ isActive: true }));
  }, [dispatch]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Filter the sightseeings based on search term and country
    const filters = {
      search: searchTerm,
      country: countryFilter,
      isActive: true
    };
    
    // Only include search if there's a search term
    if (!searchTerm.trim()) {
      delete filters.search;
    }
    
    // Only include country if one is selected
    if (!countryFilter) {
      delete filters.country;
    }
    
    dispatch(fetchGuestSightseeings(filters));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <SightseeingNav />
      
      <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Amazing Sightseeings</h1>
          <p className="text-xl text-gray-600">Explore the best activities and attractions at your destination</p>
        </div>

        {/* Search Form */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-12">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Destination Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search sightseeings by name"
                />
              </div>

              {/* Country Filter */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                >
                  <option value="">All Countries</option>
                  {Array.from(new Set(sightseeings.map(s => s.country))).map((country, idx) => (
                    <option key={idx} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <FiSearch className="h-5 w-5" />
                <span>Search</span>
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
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
                              {sightseeing.offerPriceCurrency || 'USD'} {sightseeing.offerPrice.toFixed(2)}
                            </span>
                            <span className="ml-2 text-sm text-gray-500 line-through">
                              {sightseeing.priceCurrency || 'USD'} {sightseeing.price.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            {sightseeing.price ? `${sightseeing.priceCurrency || 'USD'} ${sightseeing.price.toFixed(2)}` : 'Price on request'}
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
