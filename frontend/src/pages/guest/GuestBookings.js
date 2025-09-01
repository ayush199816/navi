import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaCalendarAlt, FaMapMarkerAlt, FaFilePdf, FaDownload, FaUsers } from 'react-icons/fa';
import { FiDollarSign, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
      setLoadingBookings(true);
      const token = localStorage.getItem('token');
      const [bookingsRes, sightseeingRes] = await Promise.all([
        axios.get('/api/bookings/guest/my-bookings', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/guest-sightseeing-bookings/my-bookings', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const allBookings = [
        ...(bookingsRes.data.data || []).map(b => ({ ...b, type: 'package' })),
        ...(sightseeingRes.data.data || []).map(b => ({ ...b, type: 'sightseeing' }))
      ];
      
      setBookings(allBookings);
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const generatePdf = (booking) => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 62, 80);
    doc.text('Booking Confirmation', 20, 25);
    
    // Booking details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    let yPos = 40;
    
    // Booking Info
    doc.setFont(undefined, 'bold');
    doc.text('Booking ID:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(booking.bookingReference || booking.bookingId, 60, yPos);
    
    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.text('Booking Date:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(formatDate(booking.createdAt), 60, yPos);
    
    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.text('Status:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text((booking.status || booking.bookingStatus || 'pending').toUpperCase(), 60, yPos);
    
    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.text('Payment Status:', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text((booking.paymentStatus || 'pending').toUpperCase(), 60, yPos);
    
    // Guest Details
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.text('Guest Details', 20, yPos);
    
    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.text('Lead Guest:', 25, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(`${booking.leadGuest?.name || 'N/A'}`, 60, yPos);
    
    // Sightseeing Details
    yPos += 15;
    doc.setFont(undefined, 'bold');
    doc.text('Sightseeing Details', 20, yPos);
    
    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.text('Tour:', 25, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(booking.sightseeingName || 'N/A', 60, yPos);
    
    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.text('Date of Travel:', 25, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(formatDate(booking.dateOfTravel), 60, yPos);
    
    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.text('Number of Pax:', 25, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(String(booking.numberOfPax || 1), 60, yPos);
    
    // Save the PDF
    doc.save(`booking-${booking.bookingReference || booking.bookingId}.pdf`);
  };

  if (loading || loadingBookings) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
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
                <li key={booking._id} className="p-4 hover:bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-blue-600">
                            {booking.bookingReference || booking.bookingId}
                            {booking.type === 'sightseeing' && (
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                Sightseeing
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-900 font-medium mt-1">
                            {booking.sightseeingName || booking.package?.name || 'Custom Package'}
                          </p>
                        </div>
                        <button
                          onClick={() => generatePdf(booking)}
                          className="text-gray-500 hover:text-blue-600 ml-2"
                          title="Download Booking Confirmation"
                        >
                          <FaFilePdf className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        <p className="flex items-center text-sm text-gray-600">
                          <FaUsers className="mr-2 h-3.5 w-3.5 text-gray-400" />
                          {booking.numberOfPax || 1} {booking.numberOfPax === 1 ? 'Person' : 'People'}
                        </p>
                        <p className="flex items-center text-sm text-gray-600">
                          <FaCalendarAlt className="mr-2 h-3.5 w-3.5 text-gray-400" />
                          {formatDate(booking.dateOfTravel || booking.travelDates?.startDate)}
                          {booking.travelDates?.endDate && ` - ${formatDate(booking.travelDates.endDate)}`}
                        </p>
                        {booking.leadGuest?.name && (
                          <p className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">👤</span>
                            {booking.leadGuest.name}
                          </p>
                        )}
                      </div>
                      
                      <div className="mt-2 flex justify-between items-center">
                        <div>
                          {getStatusBadge(booking.status || booking.bookingStatus || 'pending')}
                          {booking.paymentStatus && (
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              booking.paymentStatus === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {booking.paymentStatus.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          ${booking.totalAmount?.toLocaleString() || '0'}
                        </p>
                      </div>
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
