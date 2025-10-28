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
    doc.setFontSize(22);
    doc.setTextColor(29, 78, 216); // Blue-700
    doc.setFont(undefined, 'bold');
    doc.text('SIGHTSEEING TICKET', 105, 25, { align: 'center' });
    
    // Add border around the entire ticket
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, 15, 180, 260);
    
    let yPos = 45;
    
    // 1. Booking Details Section
    doc.setFillColor(239, 246, 255); // Light blue background
    doc.rect(20, yPos - 5, 170, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(29, 78, 216); // Blue-700
    doc.setFont(undefined, 'bold');
    doc.text('BOOKING DETAILS', 25, yPos + 3);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Add booking details in a table-like format
    const bookingDetails = [
      { label: 'Confirmation Number', value: booking.bookingReference || booking.bookingId },
      { label: 'Date of Booking', value: formatDate(booking.createdAt) },
      { label: 'Status', value: (booking.status || booking.bookingStatus || 'pending').toUpperCase() },
      { label: 'Payment Status', value: (booking.paymentStatus || 'pending').toUpperCase() }
    ];
    
    bookingDetails.forEach((item, index) => {
      doc.setFont(undefined, 'bold');
      doc.text(item.label + ':', 25, yPos + (index * 7));
      doc.setFont(undefined, 'normal');
      doc.text(item.value, 75, yPos + (index * 7));
    });
    
    yPos += (bookingDetails.length * 7) + 15;
    
    // 2. Sightseeing Details Section
    doc.setFillColor(239, 246, 255);
    doc.rect(20, yPos - 5, 170, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(29, 78, 216);
    doc.setFont(undefined, 'bold');
    doc.text('SIGHTSEEING DETAILS', 25, yPos + 3);
    
    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Sightseeing items
    const sightseeingItems = [
      { name: booking.sightseeingName || 'N/A', date: formatDate(booking.dateOfTravel) }
      // Add more sightseeing items if available in booking.sightseeing array
    ];
    
    sightseeingItems.forEach((item, index) => {
      doc.setFont(undefined, 'bold');
      doc.text(`Sightseeing ${index + 1}:`, 25, yPos);
      doc.setFont(undefined, 'normal');
      
      // Split long text into multiple lines
      const maxWidth = 130; // Maximum width in points
      const splitText = doc.splitTextToSize(item.name, maxWidth);
      
      // Add each line of text
      splitText.forEach((line, i) => {
        doc.text(line, 60, yPos + (i * 5));
      });
      
      // Adjust yPos based on number of lines
      yPos += (splitText.length * 5) + 3;
      doc.text(`Date: ${item.date}`, 60, yPos);
      yPos += 8;
    });
    
    yPos += 10;
    
    // 3. Passenger Details Section
    doc.setFillColor(239, 246, 255);
    doc.rect(20, yPos - 5, 170, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(29, 78, 216);
    doc.setFont(undefined, 'bold');
    doc.text('PASSENGER DETAILS', 25, yPos + 3);
    
    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Number of Pax
    doc.setFont(undefined, 'bold');
    doc.text('Number of Pax:', 25, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(String(booking.numberOfPax || 1), 70, yPos);
    yPos += 7;
    
    // Lead Passenger
    doc.setFont(undefined, 'bold');
    doc.text('Lead Passenger:', 25, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(booking.leadGuest?.name || 'N/A', 70, yPos);
    
    // Additional Passengers
    if (booking.passengers && booking.passengers.length > 0) {
      booking.passengers.forEach((passenger, index) => {
        yPos += 5;
        doc.text(`Passenger ${index + 1}:`, 25, yPos);
        doc.text(passenger.name, 70, yPos);
      });
    }
    
    yPos += 15;
    
    // 4. Terms and Conditions
    doc.setFillColor(239, 246, 255);
    doc.rect(20, yPos - 5, 170, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(29, 78, 216);
    doc.setFont(undefined, 'bold');
    doc.text('TERMS AND CONDITIONS', 25, yPos + 3);
    
    yPos += 15;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    const terms = [
      '• For refund contact our support',
      '• This Ticket is only valid on the sightseeing booking date',
      '• The Ticket is not transferable to other person',
      '• Please carry a valid photo ID for verification',
      '• No refund for no-shows or late arrivals'
    ];
    
    terms.forEach((term, index) => {
      doc.text(term, 25, yPos + (index * 5));
    });
    
    // Add footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for choosing our service!', 105, 270, { align: 'center' });
    
    // Save the PDF
    doc.save(`sightseeing-ticket-${booking.bookingReference || booking.bookingId}.pdf`);
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
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="https://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
