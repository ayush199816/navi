import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RequireAuth from '../auth/RequireAuth';
import { EyeIcon } from '@heroicons/react/24/outline';
import BookingDetailModal from '../../components/BookingDetailModal';
import AdminClaimModal from '../../components/AdminClaimModal';

const BookingsAdmin = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [bookingToClaimPayment, setBookingToClaimPayment] = useState(null);
  const pageSize = 10;

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line
  }, [page, search, status]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let url = `/api/bookings?page=${page}&limit=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&bookingStatus=${status}`;
      const res = await axios.get(url);
      
      // Normalize booking data to ensure consistent structure
      const normalizedBookings = res.data.data.map(booking => ({
        ...booking,
        // Ensure totalAmount is available at root level
        totalAmount: booking.totalAmount || (booking.pricing?.totalAmount || 0),
        // Ensure pricing object has all required fields
        pricing: {
          ...(booking.pricing || {}),
          totalAmount: booking.pricing?.totalAmount || booking.totalAmount || 0,
          packagePrice: booking.pricing?.packagePrice || 0,
          agentPrice: booking.pricing?.agentPrice || 0,
          discountAmount: booking.pricing?.discountAmount || 0,
          currency: booking.pricing?.currency || 'INR'
        }
      }));
      
      setBookings(normalizedBookings);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    }
    setLoading(false);
  };

  const handleView = (booking) => {
    setSelectedBooking(booking);
    setShowViewModal(true);
  };
  
  const handleBookingUpdate = (updatedBooking) => {
    console.log('handleBookingUpdate called with:', updatedBooking);
    
    // Update the booking in the local state
    const updatedBookings = bookings.map(bk => {
      if (bk._id === updatedBooking._id) {
        console.log('Found matching booking to update:', bk._id);
        console.log('Old status:', bk.bookingStatus, 'New status:', updatedBooking.bookingStatus);
        return updatedBooking;
      }
      return bk;
    });
    
    console.log('Setting updated bookings array');
    setBookings(updatedBookings);
    
    console.log('Setting selected booking to:', updatedBooking);
    setSelectedBooking(updatedBooking);
  };

  const [claimingPayment, setClaimingPayment] = useState(false);
  const [claimError, setClaimError] = useState(null);

  const handleClaimPayment = (booking) => {
    if (!booking || booking.bookingStatus === 'cancelled') {
      return;
    }
    
    // Set the booking to claim payment for and open the modal
    setBookingToClaimPayment(booking);
    setShowClaimModal(true);
  };
  
  const handleClaimSuccess = (updatedBooking) => {
    // Update the booking in the local state with the returned data
    const updatedBookings = bookings.map(bk => {
      if (bk._id === updatedBooking._id) {
        return {
          ...bk,
          ...updatedBooking,
          // Ensure totalAmount is available at root level
          totalAmount: updatedBooking.totalAmount || (updatedBooking.pricing?.totalAmount || 0),
          // Ensure pricing object has all required fields
          pricing: {
            ...(updatedBooking.pricing || {}),
            totalAmount: updatedBooking.pricing?.totalAmount || updatedBooking.totalAmount || 0,
            packagePrice: updatedBooking.pricing?.packagePrice || 0,
            agentPrice: updatedBooking.pricing?.agentPrice || 0,
            discountAmount: updatedBooking.pricing?.discountAmount || 0,
            currency: updatedBooking.pricing?.currency || 'INR'
          }
        };
      }
      return bk;
    });
    
    setBookings(updatedBookings);
    
    // Only close the modal if payment is fully claimed
    if (updatedBooking.paymentStatus === 'paid') {
      setShowClaimModal(false);
      setBookingToClaimPayment(null);
    }
    
    // Refresh bookings to get the latest data from server
    fetchBookings();
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <RequireAuth allowedRoles={['admin', 'operations']}>
      <div className="max-w-7xl mx-auto p-8">
        <h2 className="text-2xl font-bold mb-6">All Bookings</h2>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <input
            className="form-input sm:w-1/3"
            type="text"
            placeholder="Search by agent, customer, package"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="form-input sm:w-1/5"
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Booking ID</th>
                <th className="px-4 py-2 border">Agent</th>
                <th className="px-4 py-2 border">Customer</th>
                <th className="px-4 py-2 border">Package</th>
                <th className="px-4 py-2 border">Dates</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Payment Status</th>
                <th className="px-4 py-2 border">Amount</th>
                <th className="px-4 py-2 border">Claim Payment</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">No bookings found.</td>
                </tr>
              ) : (
                bookings.map(bk => (
                  <tr key={bk._id}>
                    <td className="px-4 py-2 border font-mono">{bk.bookingId || bk._id.slice(-6)}</td>
                    <td className="px-4 py-2 border">{bk.agent?.name || '-'}</td>
                    <td className="px-4 py-2 border">{bk.customerDetails?.name || '-'}</td>
                    <td className="px-4 py-2 border">{bk.package?.name ? `${bk.package.name} (${bk.package.destination || bk.destination || '-'})` : (bk.destination || '-')}</td>
                    <td className="px-4 py-2 border">{bk.travelDates?.startDate ? new Date(bk.travelDates.startDate).toLocaleDateString() : '-'} - {bk.travelDates?.endDate ? new Date(bk.travelDates.endDate).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-2 border capitalize">{bk.bookingStatus || 'pending'}</td>
                    <td className="px-4 py-2 border capitalize">
                      <span className={`${bk.paymentStatus === 'paid' ? 'text-green-600 font-medium' : 
                                       bk.paymentStatus === 'partially_paid' ? 'text-orange-600 font-medium' : 
                                       bk.paymentStatus === 'refunded' ? 'text-blue-600 font-medium' : 
                                       'text-red-600 font-medium'}`}>
                        {bk.paymentStatus ? bk.paymentStatus.replace('_', ' ') : 'unpaid'}
                      </span>
                    </td>
                    <td className="px-4 py-2 border">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          ₹{typeof bk.totalAmount === 'number' ? bk.totalAmount.toLocaleString() : 
                            bk.pricing?.totalAmount ? bk.pricing.totalAmount.toLocaleString() : '0'}
                        </span>
                        {bk.pricing?.currency && bk.pricing.currency !== 'INR' && (
                          <span className="text-xs text-gray-500">
                            {bk.pricing.currency}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 border text-center">
                      <button
                        onClick={() => handleClaimPayment(bk)}
                        className={`inline-flex items-center px-2 py-1 text-sm rounded 
                          ${bk.paymentStatus === 'partially_paid' ? 'bg-orange-500 hover:bg-orange-600' : 
                            bk.paymentStatus === 'paid' ? 'bg-gray-400' : 
                            'bg-green-600 hover:bg-green-700'} 
                          text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={!bk.totalAmount || (bk.paymentStatus === 'paid' && !bk.paymentStatus === 'partially_paid') || bk.bookingStatus === 'cancelled'}
                      >
                        {bk.paymentStatus === 'paid' ? 'Paid' : 
                         bk.paymentStatus === 'partially_paid' ? 'Claim Remaining' : 'Claim'}
                      </button>
                    </td>
                    <td className="px-4 py-2 border text-center">
                      <button
                        onClick={() => handleView(bk)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" /> View
                      </button>
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
        {/* View Booking Modal placeholder */}
        {/* Polished Booking Detail Modal */}
        {selectedBooking && (
          <BookingDetailModal
            open={showViewModal}
            onClose={() => setShowViewModal(false)}
            booking={selectedBooking}
            isAdmin={true}
            onUpdate={handleBookingUpdate}
          />
        )}

        {/* Admin Claim Payment Modal */}
        {bookingToClaimPayment && (
          <AdminClaimModal
            isOpen={showClaimModal}
            onClose={() => {
              setShowClaimModal(false);
              setBookingToClaimPayment(null);
            }}
            booking={bookingToClaimPayment}
            onSuccess={handleClaimSuccess}
          />
        )}
      </div>
    </RequireAuth>
  );
};

export default BookingsAdmin;
