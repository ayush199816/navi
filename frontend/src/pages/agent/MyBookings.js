import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMyBookings, cancelBooking } from '../../redux/slices/bookingSlice';
import { openModal } from '../../redux/slices/uiSlice';
import BookingDetailModal from '../../components/BookingDetailModal';
import {
  ShoppingBagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const MyBookings = () => {
  const dispatch = useDispatch();
  const { bookings, loading, pagination } = useSelector(state => state.bookings);
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'createdAt:desc'
  });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBookings = useCallback(() => {
    dispatch(getMyBookings({
      page: currentPage,
      limit: 10,
      status: filters.status || undefined,
      sortBy: filters.sortBy
    }));
  }, [dispatch, currentPage, filters.status, filters.sortBy]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Debug: Log bookings data when it changes
  useEffect(() => {
    if (bookings && bookings.length > 0) {
      console.log('Bookings data:', bookings.map(b => ({
        id: b._id,
        bookingId: b.bookingId,
        status: b.status,
        bookingStatus: b.bookingStatus,
        paymentStatus: b.paymentStatus
      })));
    }
  }, [bookings]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setViewModalOpen(true);
  };

  const handleCancelBooking = (bookingId) => {
    dispatch(openModal({
      modalType: 'CANCEL_BOOKING',
      modalData: { 
        bookingId,
        onConfirm: (reason) => {
          dispatch(cancelBooking({ id: bookingId, reason }))
            .unwrap()
            .then(() => {
              fetchBookings();
            });
        }
      }
    }));
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    let badgeClass = '';
    let icon = null;
    let displayStatus = status || 'pending';
    
    switch (displayStatus) {
      case 'pending':
        badgeClass = 'bg-yellow-100 text-yellow-800';
        icon = <ClockIcon className="h-4 w-4 mr-1" />;
        break;
      case 'processing':
        badgeClass = 'bg-orange-100 text-orange-800';
        icon = <ArrowPathIcon className="h-4 w-4 mr-1" />;
        break;
      case 'booked':
        badgeClass = 'bg-blue-100 text-blue-800';
        icon = <CheckCircleIcon className="h-4 w-4 mr-1" />;
        break;
      case 'confirmed':
        badgeClass = 'bg-green-100 text-green-800';
        icon = <CheckCircleIcon className="h-4 w-4 mr-1" />;
        break;
      case 'cancelled':
        badgeClass = 'bg-red-100 text-red-800';
        icon = <XCircleIcon className="h-4 w-4 mr-1" />;
        break;
      case 'completed':
        badgeClass = 'bg-blue-100 text-blue-800';
        icon = <CheckCircleIcon className="h-4 w-4 mr-1" />;
        break;
      case 'in-progress':
        badgeClass = 'bg-indigo-100 text-indigo-800';
        icon = <ClockIcon className="h-4 w-4 mr-1" />;
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800';
        icon = <ClockIcon className="h-4 w-4 mr-1" />;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
        {icon}
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </span>
    );
  };
  
  // Payment status badge component
  const PaymentStatusBadge = ({ status }) => {
    let badgeClass = '';
    let displayStatus = status || 'unpaid';
    
    switch (displayStatus) {
      case 'paid':
        badgeClass = 'bg-green-100 text-green-800';
        break;
      case 'partially_paid':
        badgeClass = 'bg-orange-100 text-orange-800';
        displayStatus = 'partially paid';
        break;
      case 'refunded':
        badgeClass = 'bg-blue-100 text-blue-800';
        break;
      case 'unpaid':
      default:
        badgeClass = 'bg-red-100 text-red-800';
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </span>
    );
  };

  // Modal state for agent booking detail
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Refresh bookings when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('Refreshing bookings due to refresh trigger');
      fetchBookings();
    }
  }, [refreshTrigger, fetchBookings]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Bookings</h1>
      </div>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        booking={selectedBooking}
        isAdmin={false}
        onUpdate={(updatedBooking) => {
          console.log('Booking updated in modal, refreshing list:', updatedBooking);
          setSelectedBooking(updatedBooking);
          setRefreshTrigger(prev => prev + 1);
        }}
      />

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-auto">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto">
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sortBy"
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="totalAmount:desc">Amount (High to Low)</option>
              <option value="totalAmount:asc">Amount (Low to High)</option>
              <option value="travelDate:asc">Travel Date (Earliest)</option>
              <option value="travelDate:desc">Travel Date (Latest)</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto flex items-end">
            <button
              type="button"
              onClick={fetchBookings}
              className="btn-outline flex items-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No bookings found</h3>
          <p className="mt-1 text-gray-500">
            You don't have any bookings matching your filters. Try changing your filters or create a new booking from a quote.
          </p>
          <div className="mt-6">
            <Link to="/my-quotes" className="btn-primary">
              View My Quotes
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <li key={booking._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShoppingBagIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <p className="text-sm font-medium text-primary-600 truncate">
                        {booking.packageDetails?.name || 'Custom Package'} - Booking #{booking.bookingId}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex space-x-2">
                      <StatusBadge status={booking.bookingStatus} />
                      <PaymentStatusBadge status={booking.paymentStatus} />
                    </div>
                  </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <span className="truncate">
                          {booking.customerDetails?.name || booking.customerName} • {booking.customerDetails?.email || booking.customerEmail}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        <span className="font-medium text-gray-900">
                          ₹{typeof booking.totalAmount === 'number' ? booking.totalAmount.toLocaleString() : 
                            booking.pricing?.totalAmount ? booking.pricing.totalAmount.toLocaleString() : '0'}
                          {booking.pricing?.currency && booking.pricing.currency !== 'INR' && ` (${booking.pricing.currency})`}
                        </span>
                        {(booking.travelers?.length || booking.numberOfTravelers) && (
                          <span className="ml-1">• {booking.travelers?.length || booking.numberOfTravelers} travelers</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <span className="truncate">
                          <span className="font-medium">Destination:</span> {booking.packageDetails?.destination || 'Custom Destination'}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <p>
                        Travel Date: <span className="font-medium">{new Date(booking.travelDate).toLocaleDateString()}</span>
                        {booking.returnDate && (
                          <span> to <span className="font-medium">{new Date(booking.returnDate).toLocaleDateString()}</span></span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">
                        Created on {new Date(booking.createdAt).toLocaleDateString()}
                        {booking.paymentStatus && (
                          <span> • Payment: <span className="font-medium capitalize">{booking.paymentStatus}</span></span>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleViewBooking(booking)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      
                      {booking.invoiceUrl && (
                        <a
                          href={booking.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                          Invoice
                        </a>
                      )}
                      
                      {['pending', 'confirmed'].includes(booking.bookingStatus) && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(booking._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.pages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * 10, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {[...Array(pagination.pages)].map((_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === pagination.pages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
