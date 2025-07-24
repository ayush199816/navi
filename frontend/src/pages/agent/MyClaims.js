import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const MyClaims = () => {
  const { user } = useSelector(state => state.auth);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  // Fetch claims
  const fetchClaims = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      
      const response = await axios.get(`/api/claims/my-claims?${params.toString()}`);
      
      setClaims(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError(err.response?.data?.message || 'Failed to fetch claims');
      toast.error(err.response?.data?.message || 'Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [page, limit, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };

  const getStatusBadge = (status) => {
    let bgColor = 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'pending':
        bgColor = 'bg-yellow-100 text-yellow-800';
        break;
      case 'approved':
        bgColor = 'bg-green-100 text-green-800';
        break;
      case 'rejected':
        bgColor = 'bg-red-100 text-red-800';
        break;
      default:
        bgColor = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Payment Claims</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-md shadow-sm mb-6">
        <h3 className="text-lg font-medium mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              name="status" 
              value={filters.status} 
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              name="startDate"
              type="date"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              name="endDate"
              type="date"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        
        <button 
          onClick={handleClearFilters} 
          className="px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Clear Filters
        </button>
      </div>
      
      {/* Claims Table */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">No claims found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Reference</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Passenger</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claimed (USD)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {claims.map(claim => (
                <tr key={claim._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{claim.transactionId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link to={`/bookings/${claim.bookingId}`} className="text-indigo-600 hover:text-indigo-900">
                      {claim.bookingId}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{claim.leadPaxName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{claim.amount} {claim.currency}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${claim.claimedAmount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStatusBadge(claim.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(claim.claimDate), 'MMM dd, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {!loading && !error && claims.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-700">Showing {claims.length} of {totalPages * limit} claims</p>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-700">{page} of {totalPages}</span>
            
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={page >= totalPages}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyClaims;
