import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import { FiDollarSign, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import axios from 'axios';

const GuestBookings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Handle authentication and fetch bookings
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { state: { from: '/my-bookings' } });
      return;
    }

    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated, loading, navigate]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/bookings/guest/my-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data.data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'confirmed': { color: 'bg-green-100 text-green-800', icon: <FiCheckCircle className="mr-1" /> },
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: <FiClock className="mr-1" /> },
      'cancelled': { color: 'bg-red-100 text-red-800', icon: <FiXCircle className="mr-1" /> },
    };
    
    const { color, icon } = statusMap[status] || { color: 'bg-gray-100 text-gray-800', icon: null };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading || loadingBookings) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate('/tours')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Tours
          </button>
        </div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">You haven't made any bookings yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <li key={booking._id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">{booking.bookingId}</p>
                      <p className="text-sm text-gray-900">
                        {booking.package?.name || 'Custom Package'}
                      </p>
                      <div className="mt-2">
                        <p className="flex items-center text-sm text-gray-500">
                          <FaMapMarkerAlt className="mr-1.5 h-4 w-4 text-gray-400" />
                          {booking.package?.destination || 'Multiple Destinations'}
                        </p>
                        {booking.travelDates?.startDate && (
                          <p className="flex items-center text-sm text-gray-500 mt-1">
                            <FaCalendarAlt className="mr-1.5 h-4 w-4 text-gray-400" />
                            {formatDate(booking.travelDates.startDate)}
                            {booking.travelDates.endDate && ` - ${formatDate(booking.travelDates.endDate)}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mb-2">
                        {getStatusBadge(booking.bookingStatus || 'pending')}
                      </div>
                      <p className="text-sm text-gray-500">
                        <FiDollarSign className="inline mr-1" />
                        ₹{booking.totalAmount?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestBookings;
