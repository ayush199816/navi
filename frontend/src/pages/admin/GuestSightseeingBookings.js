import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const GuestSightseeingBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '' });
  
  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        toast.error('Authentication required');
        return;
      }

      console.log('Fetching bookings with status:', filters.status);
      const response = await axios.get(`/api/guest-sightseeing-bookings?status=${filters.status || ''}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      });
      
      console.log('API Response Status:', response.status);
      console.log('API Response Data:', response.data);
      
      if (response.data && response.data.success === false) {
        console.error('API Error:', response.data.message || 'Unknown error');
        toast.error(response.data.message || 'Failed to load bookings');
        return;
      }
      
      // Handle both response structures:
      // 1. From advancedResults: response.data.data
      // 2. Direct from controller: response.data
      const responseData = response.data || {};
      const bookingsData = responseData.data || responseData;
      
      console.log('Processed bookings data:', bookingsData);
      
      if (!bookingsData) {
        console.warn('No bookings data received');
        setBookings([]);
        return;
      }
      
      const bookingsArray = Array.isArray(bookingsData) ? bookingsData : [];
      console.log(`Found ${bookingsArray.length} bookings`);
      setBookings(bookingsArray);
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(error.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/guest-sightseeing-bookings/${bookingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setBookings(bookings.map(booking => 
        booking._id === bookingId ? { ...booking, status } : booking
      ));
      
      toast.success(`Booking ${status} successfully`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Guest Sightseeing Bookings</h1>
      
      <div className="mb-4">
        <select
          className="border rounded p-2"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="border p-2">Booking ID</th>
                <th className="border p-2">Guest</th>
                <th className="border p-2">Tour</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Pax</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="border p-2">{booking.bookingReference}</td>
                  <td className="border p-2">
                    <div>{booking.leadGuest?.name}</div>
                    <div className="text-sm text-gray-500">{booking.leadGuest?.email}</div>
                  </td>
                  <td className="border p-2">{booking.sightseeingName}</td>
                  <td className="border p-2">{formatDate(booking.dateOfTravel)}</td>
                  <td className="border p-2">{booking.numberOfPax}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="border p-2">
                    <div className="flex space-x-2">
                      {booking.status !== 'confirmed' && (
                        <button
                          onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                          className="text-green-600 hover:text-green-800"
                          title="Confirm"
                        >
                          <FaCheck />
                        </button>
                      )}
                      {booking.status !== 'cancelled' && (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to cancel this booking?')) {
                              updateBookingStatus(booking._id, 'cancelled');
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                          title="Cancel"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GuestSightseeingBookings;
