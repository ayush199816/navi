import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CalendarIcon, MapPinIcon, ClockIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import RaiseQuoteModal from './RaiseQuoteModal';

const PackageDetail = () => {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchPackageDetails();
  }, [id]);

  const fetchPackageDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/packages/${id}`);
      setPkg(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch package details');
      toast.error('Failed to load package details');
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const isOfferValid = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate) >= new Date();
  };

  const handleRaiseQuote = () => {
    setShowQuoteModal(true);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center py-10">
          <div className="spinner"></div>
          <p className="mt-2">Loading package details...</p>
        </div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Package not found'}
        </div>
        <Link to="/packages" className="btn-outline">
          Back to Packages
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link to="/packages" className="text-primary-600 hover:text-primary-700 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Packages
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Image Gallery */}
        <div className="relative h-80 sm:h-96 md:h-[500px] bg-gray-100">
          {pkg.images && pkg.images.length > 0 ? (
            <>
              <img
                src={pkg.images[activeImageIndex].startsWith('http') ? pkg.images[activeImageIndex] : `/${pkg.images[activeImageIndex]}`}
                alt={pkg.name}
                className="w-full h-full object-cover"
              />
              {pkg.images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                  {pkg.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-3 h-3 rounded-full ${
                        index === activeImageIndex ? 'bg-white' : 'bg-gray-300 bg-opacity-70'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">No images available</span>
            </div>
          )}
          {pkg.offerPrice && isOfferValid(pkg.endDate) && (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-md">
              <div className="text-sm">Special Offer</div>
              <div className="text-lg font-bold">Save ₹{(pkg.price - pkg.offerPrice).toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Package Details */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{pkg.name}</h1>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPinIcon className="h-5 w-5 mr-1" />
                <span>{pkg.destination}</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              {pkg.offerPrice && isOfferValid(pkg.endDate) ? (
                <div>
                  <div className="text-lg text-gray-500 line-through">₹{pkg.price.toLocaleString()}</div>
                  <div className="text-3xl font-bold text-green-600">₹{pkg.offerPrice.toLocaleString()}</div>
                  <div className="text-sm text-green-600">
                    Offer valid till: {formatDate(pkg.endDate)}
                  </div>
                </div>
              ) : (
                <div className="text-3xl font-bold text-gray-900">₹{pkg.price.toLocaleString()}</div>
              )}
              <div className="text-sm text-gray-500 mt-1">per person</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center">
              <ClockIcon className="h-6 w-6 text-primary-600 mr-2" />
              <div>
                <div className="text-sm text-gray-500">Duration</div>
                <div className="font-medium">{pkg.duration} days</div>
              </div>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="h-6 w-6 text-primary-600 mr-2" />
              <div>
                <div className="text-sm text-gray-500">Best Time to Visit</div>
                <div className="font-medium">{pkg.bestTimeToVisit || 'Any time'}</div>
              </div>
            </div>
            <div className="flex items-center">
              <CurrencyRupeeIcon className="h-6 w-6 text-primary-600 mr-2" />
              <div>
                <div className="text-sm text-gray-500">Agent Price</div>
                <div className="font-medium">₹{pkg.agentPrice.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{pkg.description}</p>
          </div>

          {pkg.itinerary && pkg.itinerary.length > 0 && (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-4">Itinerary</h2>
    <div className="space-y-4">
      {pkg.itinerary.map((dayObj, index) => (
        <div key={index} className="border-l-4 border-primary-500 pl-4 py-2 bg-gray-50">
          <h3 className="font-semibold text-lg mb-1">Day {dayObj.day || index + 1}: {dayObj.title || ''}</h3>
          {dayObj.description && <p className="text-gray-700 mb-1"><span className="font-medium">Description:</span> {dayObj.description}</p>}
          {dayObj.activities && dayObj.activities.length > 0 && (
            <div className="mb-1">
              <span className="font-medium">Activities:</span>
              <ul className="list-disc list-inside ml-4">
                {dayObj.activities.map((act, i) => <li key={i}>{act}</li>)}
              </ul>
            </div>
          )}
          {dayObj.meals && (
            <div className="mb-1">
              <span className="font-medium">Meals:</span> {
                Array.isArray(dayObj.meals)
                  ? dayObj.meals.join(', ')
                  : typeof dayObj.meals === 'object' && dayObj.meals !== null
                    ? Object.entries(dayObj.meals)
                        .filter(([k, v]) => v)
                        .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
                        .join(', ')
                    : dayObj.meals
              }
            </div>
          )}
          {dayObj.accommodation && (
            <div className="mb-1">
              <span className="font-medium">Accommodation:</span> {dayObj.accommodation}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Inclusions</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {pkg.inclusions ? (
                pkg.inclusions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))
              ) : (
                <li>Contact us for inclusion details</li>
              )}
            </ul>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Exclusions</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {pkg.exclusions ? (
                pkg.exclusions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))
              ) : (
                <li>Contact us for exclusion details</li>
              )}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleRaiseQuote}
              className="btn-primary py-3 px-6 text-lg"
            >
              Raise a Quote
            </button>
            <Link
              to="/packages"
              className="btn-outline py-3 px-6 text-lg text-center"
            >
              Browse More Packages
            </Link>
          </div>
        </div>
      </div>

      {/* RaiseQuoteModal */}
      <RaiseQuoteModal
        open={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        pkg={pkg}
        onSuccess={() => {
          setShowQuoteModal(false);
          toast.success('Quote raised successfully!');
        }}
      />

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default PackageDetail;
