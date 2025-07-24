import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RequireAuth from '../auth/RequireAuth';
import BookPackageModal from './BookPackageModal';
import RaiseQuoteModal from './RaiseQuoteModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BrowsePackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line
  }, [page, search, destination, duration, minPrice, maxPrice]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      let url = `/api/packages?page=${page}&limit=${pageSize}&isActive=true`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (destination) url += `&destination=${encodeURIComponent(destination)}`;
      if (duration) url += `&minDuration=${duration}&maxDuration=${duration}`;
      if (minPrice) url += `&minPrice=${minPrice}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;
      const res = await axios.get(url);
      setPackages(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch packages');
    }
    setLoading(false);
  };

  const handleBook = (pkg) => {
    setSelectedPackage(pkg);
    setShowBookModal(true);
  };

  const handleRaiseQuote = (pkg) => {
    setSelectedPackage(pkg);
    setShowQuoteModal(true);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <RequireAuth allowedRoles={['agent']}>
      <div className="max-w-6xl mx-auto p-8">
        <h2 className="text-2xl font-bold mb-6">Browse Packages</h2>
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-5 gap-2">
          <input
            className="form-input"
            type="text"
            placeholder="Search by name or description"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <input
            className="form-input"
            type="text"
            placeholder="Destination"
            value={destination}
            onChange={e => { setDestination(e.target.value); setPage(1); }}
          />
          <input
            className="form-input"
            type="number"
            placeholder="Duration (days)"
            value={duration}
            onChange={e => { setDuration(e.target.value); setPage(1); }}
            min="1"
          />
          <input
            className="form-input"
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={e => { setMinPrice(e.target.value); setPage(1); }}
            min="0"
          />
          <input
            className="form-input"
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
            min="0"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Destination</th>
                <th className="px-4 py-2 border">Duration</th>
                <th className="px-4 py-2 border">Price</th>
                <th className="px-4 py-2 border">Offer</th>
                <th className="px-4 py-2 border">Valid Until</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">No packages found.</td>
                </tr>
              ) : (
                packages.map(pkg => (
                  <tr key={pkg._id}>
                    <td className="px-4 py-2 border font-semibold">{pkg.name}</td>
                    <td className="px-4 py-2 border">{pkg.destination}</td>
                    <td className="px-4 py-2 border">{pkg.duration} days</td>
                    <td className="px-4 py-2 border">
                      <div className="flex flex-col">
                        <span className={pkg.offerPrice ? 'line-through text-gray-500 text-sm' : ''}>₹{pkg.price.toLocaleString()}</span>
                        {pkg.offerPrice && <span className="font-semibold text-green-600">₹{pkg.offerPrice.toLocaleString()}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2 border">
                      {pkg.offerPrice ? (
                        <span className="text-green-600 font-semibold">
                          Save ₹{(pkg.price - pkg.offerPrice).toLocaleString()}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-2 border">
                      {pkg.endDate ? new Date(pkg.endDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-2 border flex space-x-2">
                      <button className="btn-primary px-2 py-1 text-sm" onClick={() => handleBook(pkg)}>Book</button>
                      <button className="btn-outline px-2 py-1 text-sm" onClick={() => handleRaiseQuote(pkg)}>Raise Quote</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            <button
              className="btn-outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <button
              className="btn-outline"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
        {/* BookPackageModal */}
        <BookPackageModal
          open={showBookModal}
          onClose={() => setShowBookModal(false)}
          pkg={selectedPackage}
          onSuccess={() => {
            setShowBookModal(false);
            setSelectedPackage(null);
            toast.success('Booking successful!');
            // Optionally, refresh packages
          }}
        />
        
        {/* RaiseQuoteModal */}
        <RaiseQuoteModal
          open={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
          pkg={selectedPackage}
          onSuccess={() => {
            setShowQuoteModal(false);
            setSelectedPackage(null);
            toast.success('Quote raised successfully!');
            // Optionally, refresh packages
          }}
        />
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </RequireAuth>
  );
};

export default BrowsePackages;
