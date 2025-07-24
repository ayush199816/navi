import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RaiseQuoteModal from './RaiseQuoteModal';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    destination: '',
    hasOffers: false
  });

  useEffect(() => {
    fetchPackages();
  }, [filters]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      let url = '/api/packages?isActive=true';
      if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
      if (filters.destination) url += `&destination=${encodeURIComponent(filters.destination)}`;
      
      const res = await axios.get(url);
      
      // Filter packages with offers if that filter is active
      let packagesData = res.data.data;
      if (filters.hasOffers) {
        packagesData = packagesData.filter(pkg => pkg.offerPrice);
      }
      
      setPackages(packagesData);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch packages');
      toast.error('Failed to load packages');
    }
    setLoading(false);
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRaiseQuote = (pkg) => {
    setSelectedPackage(pkg);
    setShowQuoteModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const isOfferValid = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate) >= new Date();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Premade Packages</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Filter Packages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Search</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="form-input w-full"
              placeholder="Search by name or description"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Destination</label>
            <input
              type="text"
              name="destination"
              value={filters.destination}
              onChange={handleFilterChange}
              className="form-input w-full"
              placeholder="Filter by destination"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="hasOffers"
                checked={filters.hasOffers}
                onChange={handleFilterChange}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2">Show only packages with offers</span>
            </label>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="spinner"></div>
          <p className="mt-2">Loading packages...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-gray-100 text-center py-10 rounded-lg">
          <p className="text-gray-600">No packages found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg._id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
              {/* Package Image */}
              <div className="h-48 overflow-hidden relative">
                {pkg.images && pkg.images.length > 0 ? (
                  <img 
                    src={pkg.images[0].startsWith('http') ? pkg.images[0] : `/${pkg.images[0]}`} 
                    alt={pkg.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
                {pkg.offerPrice && isOfferValid(pkg.endDate) && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl-lg">
                    Special Offer
                  </div>
                )}
              </div>
              
              {/* Package Details */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                <p className="text-gray-600 mb-2">{pkg.destination}</p>
                <p className="text-sm text-gray-500 mb-4">{pkg.duration} days</p>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">{pkg.description.substring(0, 100)}...</p>
                </div>
                
                <div className="mt-auto">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      {pkg.offerPrice && isOfferValid(pkg.endDate) ? (
                        <div>
                          <span className="line-through text-gray-400 mr-2">₹{pkg.price.toLocaleString()}</span>
                          <span className="text-xl font-bold text-green-600">₹{pkg.offerPrice.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold">₹{pkg.price.toLocaleString()}</span>
                      )}
                    </div>
                    {pkg.offerPrice && isOfferValid(pkg.endDate) && (
                      <div className="text-sm text-green-600">
                        Valid till: {formatDate(pkg.endDate)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleRaiseQuote(pkg)}
                      className="btn-primary flex-1"
                    >
                      Raise Quote
                    </button>
                    <Link 
                      to={`/agent/packages/${pkg._id}`}
                      className="btn-outline flex-1 text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* RaiseQuoteModal */}
      <RaiseQuoteModal
        open={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        pkg={selectedPackage}
        onSuccess={() => {
          setShowQuoteModal(false);
          setSelectedPackage(null);
          toast.success('Quote raised successfully!');
        }}
      />
      
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default Packages;
