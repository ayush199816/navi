import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateBookingStatus } from '../redux/slices/bookingSlice';
import BookingUpdateModal from './BookingUpdateModal';
import HotelFlightEditModal from './HotelFlightEditModal';
import ActivityEditModal from './ActivityEditModal';
import ClaimModal from './ClaimModal';
import { PencilIcon, XMarkIcon as XIcon, ArrowDownTrayIcon as SaveIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';

console.log('BookingDetailModal mounted'); // DEBUG

const BookingDetailModal = ({ open, onClose, booking, isAdmin, onUpdate }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState(false);
  const [itineraryText, setItineraryText] = useState('');
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [itineraryError, setItineraryError] = useState(null);
  const [itinerarySuccess, setItinerarySuccess] = useState(false);
  const [fetchingQuoteItinerary, setFetchingQuoteItinerary] = useState(false);
  const [quoteItineraryError, setQuoteItineraryError] = useState(null);

  // State for hotel and flight details edit mode
  const [showHotelFlightModal, setShowHotelFlightModal] = useState(false);

  // State for activities edit mode
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);

  // State for booking status update
  const [editingStatus, setEditingStatus] = useState(false);

  // State for claim modal
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState(null);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);

  // State for payment status update
  const [editingPaymentStatus, setEditingPaymentStatus] = useState(false);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [paymentStatusUpdateLoading, setPaymentStatusUpdateLoading] = useState(false);
  const [paymentStatusUpdateError, setPaymentStatusUpdateError] = useState(null);
  const [paymentStatusUpdateSuccess, setPaymentStatusUpdateSuccess] = useState(false);

  // State for seller selection
  const [selectedSellers, setSelectedSellers] = useState([]);
  const [selectedSellerId, setSelectedSellerId] = useState('');
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [sellerServices, setSellerServices] = useState({});
  const [sellerNotes, setSellerNotes] = useState({});

  // Ensure all supplier objects for assigned sellers are loaded in sellers array
  useEffect(() => {
    if (!booking || !booking.sellers || !Array.isArray(booking.sellers)) return;
    const missingIds = booking.sellers
      .map(s => typeof s.seller === 'string' ? s.seller : (s.seller && s.seller._id))
      .filter(id => id && !sellers.some(sel => sel._id === id));
    if (missingIds.length === 0) return;
    console.log('[BookingDetailModal] Missing supplier IDs:', missingIds);
    // Fetch missing suppliers in parallel
    Promise.all(missingIds.map(id =>
      fetch(`/api/sellers/${id}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          console.log(`[BookingDetailModal] Fetched seller for ID ${id}:`, data);
          return data && (data.data || data);
        })
        .catch((err) => {
          console.error(`[BookingDetailModal] Error fetching seller for ID ${id}:`, err);
          return null;
        })
    )).then(results => {
      const found = results.filter(x => x && x._id);
      if (found.length > 0) setSellers(prev => [...prev, ...found]);
    });
  }, [booking, sellers]);

  // Initialize itinerary text and statuses when booking changes
  useEffect(() => {
    console.log('Booking data in useEffect:', booking);
    console.log('Is admin?', isAdmin);

    if (booking && booking.finalItinerary) {
      setItineraryText(booking.finalItinerary);
    } else {
      setItineraryText('');
    }

    if (booking && booking.bookingStatus) {
      setSelectedStatus(booking.bookingStatus);
    }

    if (booking && booking.paymentStatus) {
      setSelectedPaymentStatus(booking.paymentStatus);
    } else {
      setSelectedPaymentStatus('unpaid');
    }

    // Debug seller information
    if (booking) {
      console.log('Seller information in booking:', booking.seller);
    }

    // If booking has a seller assigned, set the selectedSellerId
    if (booking && booking.seller && booking.seller._id) {
      console.log('Setting selectedSellerId to:', booking.seller._id);
      setSelectedSellerId(booking.seller._id);
    } else {
      console.log('No seller found in booking, clearing selectedSellerId');
      setSelectedSellerId('');
    }
  }, [booking]);

  // Fetch sellers when editing status and status is 'booked'
  useEffect(() => {
    if (editingStatus && selectedStatus === 'booked' && sellers.length === 0) {
      fetchSellers();
    }
  }, [editingStatus, selectedStatus]);

  // Function to fetch sellers
  const fetchSellers = async () => {
    console.log('Fetching sellers...');
    setLoadingSellers(true);
    try {
      const response = await axios.get('/api/sellers');
      console.log('Fetched sellers:', response.data);

      if (response.data && response.data.data) {
        setSellers(response.data.data);
        toast.success(`Loaded ${response.data.data.length} sellers`);
      } else {
        setSellers([]);
        toast.warning('No sellers found in the system');
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast.error('Failed to load sellers. Please try again.');
      setSellers([]);
    } finally {
      setLoadingSellers(false);
    }
  };

  // Function to handle itinerary update
  const handleItineraryUpdate = async () => {
    setItineraryLoading(true);
    setItineraryError(null);
    setItinerarySuccess(false);

    try {
      const response = await axios.put(`/api/bookings/${booking._id}`, {
        finalItinerary: itineraryText
      });

      if (response.data.success) {
        setItinerarySuccess(true);
        setEditingItinerary(false);
        // Update the booking object with the new itinerary
        booking.finalItinerary = itineraryText;

        // Reset success message after 3 seconds
        setTimeout(() => {
          setItinerarySuccess(false);
        }, 3000);
      }
    } catch (error) {
      setItineraryError(error.response?.data?.message || 'Failed to update itinerary');
    } finally {
      setItineraryLoading(false);
    }
  };

  // Function to fetch and copy itinerary from the associated quote
  const fetchQuoteItinerary = async () => {
    if (!booking.quote) {
      setQuoteItineraryError('No associated quote found for this booking');
      return;
    }

    setFetchingQuoteItinerary(true);
    setQuoteItineraryError(null);

    try {
      const response = await axios.get(`/api/quotes/${booking.quote}`);

      if (response.data.success && response.data.data.itinerary) {
        // Update the booking with the quote's itinerary
        const quoteItinerary = response.data.data.itinerary;

        // Save the itinerary to the booking
        const updateResponse = await axios.put(`/api/bookings/${booking._id}`, {
          finalItinerary: quoteItinerary
        });

        if (updateResponse.data.success) {
          // Update local state
          setItineraryText(quoteItinerary);
          booking.finalItinerary = quoteItinerary;
          setItinerarySuccess(true);

          // Reset success message after 3 seconds
          setTimeout(() => {
            setItinerarySuccess(false);
          }, 3000);
        }
      } else {
        setQuoteItineraryError('No itinerary found in the associated quote');
      }
    } catch (error) {
      setQuoteItineraryError(error.response?.data?.message || 'Failed to fetch quote itinerary');
    } finally {
      setFetchingQuoteItinerary(false);
    }
  };

  // Always render the modal, but hide its content if not open or booking is missing
  if (!open || !booking) return null;

  const {
    bookingId,
    customerDetails,
    travelDates,
    totalAmount,
    agentCommission,
    bookingStatus = 'pending',
    // paymentStatus is not destructured here to avoid the unused variable warning
    // we access it directly via booking.paymentStatus when needed
    specialRequirements,
    finalItinerary,
    hotelDetails = [],
    flightDetails = [],
    agent,
    createdAt,
    updatedAt,
    invoiceUrl,
    travelers = []
  } = booking;

  const handleStatusUpdate = async () => {
    setStatusUpdateLoading(true);
    setStatusUpdateError(null);
    setStatusUpdateSuccess(false);

    console.log('Updating booking status to:', selectedStatus);
    console.log('Booking ID:', booking._id);

    // Validate seller selection when status is 'booked'
    if (selectedStatus === 'booked' && selectedSellers.length === 0) {
      setStatusUpdateError('Please select at least one supplier when marking a booking as booked');
      setStatusUpdateLoading(false);
      return;
    }

    try {
      // Use the original endpoint with a simpler approach
      console.log('Making API call to update status');
      const url = `/api/bookings/${booking._id}/status`;
      console.log('Request URL:', url);

      // Prepare payload with status and sellers if status is 'booked'
      const payload = { status: selectedStatus };
      if (selectedStatus === 'booked') {
        // Create array of seller objects with their services and notes
        const sellersData = selectedSellers.map(sellerId => ({
          seller: sellerId,
          services: sellerServices[sellerId] || '',
          notes: sellerNotes[sellerId] || ''
        }));

        payload.sellers = sellersData;
        console.log('Adding sellers to payload:', sellersData);

        // Also include the first seller as the primary seller for backward compatibility
        if (selectedSellers.length > 0) {
          payload.sellerId = selectedSellers[0];
          console.log('Adding primary sellerId to payload:', selectedSellers[0]);
        }
      }
      console.log('Request payload:', payload);

      // Make a PUT request to the original endpoint
      const response = await axios.put(url, payload);
      console.log('Response status:', response.status);
      console.log('API response:', response.data);
      console.log('Seller in response:', response.data.data.seller);

      // Process the successful response from axios
      if (response.data && response.data.success) {
        // Get the updated booking from the response
        const updatedBooking = response.data.data;
        console.log('Updated booking from server:', updatedBooking);

        // Force update the booking object with the new status and seller if applicable
        if (booking) {
          booking.bookingStatus = selectedStatus;
          if (selectedStatus === 'booked' && updatedBooking.seller) {
            booking.seller = updatedBooking.seller;
            booking.sellerAssignedAt = updatedBooking.sellerAssignedAt;
          }
        }

        // Create a new booking object with updated status for the parent component
        const updatedBookingWithStatus = {
          ...booking,
          bookingStatus: selectedStatus,
          seller: selectedStatus === 'booked' ? updatedBooking.seller : booking.seller,
          sellerAssignedAt: selectedStatus === 'booked' ? updatedBooking.sellerAssignedAt : booking.sellerAssignedAt
        };

        console.log('Updated booking object to pass to parent:', updatedBookingWithStatus);

        // Notify parent component about the update
        if (onUpdate) {
          console.log('Calling onUpdate with updated booking');
          onUpdate(updatedBookingWithStatus);
        } else {
          console.log('onUpdate callback not provided');
        }

        // Show success message
        let successMessage = `Booking status updated to ${selectedStatus}`;
        if (selectedStatus === 'booked') {
          const sellerName = sellers.find(s => s._id === selectedSellerId)?.name || 'selected seller';
          successMessage += ` and assigned to ${sellerName}`;
        }
        toast.success(successMessage);

        setStatusUpdateSuccess(true);
        setEditingStatus(false);

        // Reset success message after 3 seconds
        setTimeout(() => {
          setStatusUpdateSuccess(false);
        }, 3000);
      } else {
        console.error('API returned error:', response.data);
        setStatusUpdateError('Server returned an error: ' + (response.data?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
      // More detailed error logging
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });

      // Provide a more helpful error message
      let errorMessage = 'Failed to update booking status';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage += `: ${err.message}`;
      }

      setStatusUpdateError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handlePaymentStatusUpdate = async () => {
    setPaymentStatusUpdateLoading(true);
    setPaymentStatusUpdateError(null);
    setPaymentStatusUpdateSuccess(false);

    console.log('Updating payment status to:', selectedPaymentStatus);
    console.log('Booking ID:', booking._id);

    try {
      // Make a direct API call with only the paymentStatus field
      const response = await axios.put(`/api/bookings/${booking._id}`, {
        paymentStatus: selectedPaymentStatus
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        // Get the updated booking from the response
        const updatedBooking = response.data.data;
        console.log('Updated booking from server:', updatedBooking);

        // Force update the booking object with the new status
        if (booking) {
          booking.paymentStatus = selectedPaymentStatus;
        }

        // Create a new booking object with updated status for the parent component
        const updatedBookingWithStatus = {
          ...booking,
          paymentStatus: selectedPaymentStatus
        };

        console.log('Updated booking object to pass to parent:', updatedBookingWithStatus);

        // Notify parent component about the update
        if (onUpdate) {
          console.log('Calling onUpdate with updated booking');
          onUpdate(updatedBookingWithStatus);
        } else {
          console.log('onUpdate callback not provided');
        }

        setPaymentStatusUpdateSuccess(true);
        setEditingPaymentStatus(false);

        // Reset success message after 3 seconds
        setTimeout(() => {
          setPaymentStatusUpdateSuccess(false);
        }, 3000);
      } else {
        console.error('API returned success: false', response.data);
        setPaymentStatusUpdateError('Server returned an error: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
      setPaymentStatusUpdateError(err.response?.data?.message || 'Failed to update payment status');
    } finally {
      setPaymentStatusUpdateLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch(`/api/bookings/${booking._id}/invoice`, {
        method: 'GET',
        headers: { 'Accept': 'application/pdf' },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${bookingId || booking._id.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      setDownloadError('Failed to download invoice.');
    }
    setDownloading(false);
  };

  // Early return if modal is not open
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-auto">
      {/* Main Modal Content */}
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl overflow-y-auto max-h-[95vh]">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">Booking Details</h3>
          <button className="btn-outline px-2 py-1" onClick={onClose}>&times;</button>
        </div>

        {/* Booking Summary Section */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="font-semibold text-lg">Booking ID:</span> <span className="font-mono text-lg">{bookingId || booking._id.slice(-6)}</span>
            </div>
            <div className="flex space-x-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${bookingStatus === 'processing' ? 'bg-orange-100 text-orange-800' : bookingStatus === 'booked' ? 'bg-blue-100 text-blue-800' : bookingStatus === 'confirmed' ? 'bg-green-100 text-green-800' : bookingStatus === 'completed' ? 'bg-green-800 text-white' : bookingStatus === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1)}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : booking.paymentStatus === 'partially_paid' ? 'bg-orange-100 text-orange-800' : booking.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                {booking.paymentStatus ? (booking.paymentStatus === 'partially_paid' ? 'Partially Paid' : booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)) : 'Unpaid'}
              </span>

              {/* Add prominent status update button for admin users */}
              {isAdmin && bookingStatus !== 'booked' && (
                <button
                  className="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                  onClick={() => {
                    console.log('Update Status clicked, isAdmin:', isAdmin);
                    setEditingStatus(true);
                    // Fetch sellers when edit button is clicked
                    fetchSellers();
                  }}
                >
                  <PencilIcon className="h-4 w-4 mr-1" /> Update Status
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
            <div>
              <div className="mb-1"><span className="font-semibold">Customer:</span> {customerDetails?.name} ({customerDetails?.email})</div>
              <div className="mb-1"><span className="font-semibold">Phone:</span> {customerDetails?.phone}</div>
              <div className="mb-1"><span className="font-semibold">Address:</span> {customerDetails?.address}</div>
            </div>
            <div>
              {booking.packageDetails && (
                <>
                  <div className="mb-1"><span className="font-semibold">Package:</span> {booking.packageDetails?.name}</div>
                  <div className="mb-1"><span className="font-semibold">Destination:</span> {booking.packageDetails?.destination}</div>
                  <div className="mb-1"><span className="font-semibold">Duration:</span> {booking.packageDetails?.duration} days</div>
                </>
              )}
            </div>
          </div>
          <div className="mb-1"><span className="font-semibold">Travel Dates:</span> {travelDates?.startDate ? new Date(travelDates.startDate).toLocaleDateString() : 'N/A'} to {travelDates?.endDate ? new Date(travelDates.endDate).toLocaleDateString() : 'N/A'}</div>
          <div className="mb-1"><span className="font-semibold">Total Amount:</span> ₹{totalAmount?.toLocaleString()}</div>
        </div>

        {/* Booking Status with Edit Option for Operations/Admin */}
        {!isAdmin ? null : (
          <div className="mb-2">
            <div className="flex items-center">
              <span className="font-semibold mr-2">Status:</span>
              {editingStatus ? (
                <div className="flex flex-col w-full">
                  <div className="flex items-center space-x-2">
                    {/* Supplier Selection Section */}
                    <div className="mb-4">
                      <label className="block font-semibold mb-2">Suppliers <span className="text-red-500">*</span></label>
                      {loadingSellers ? (
                        <div className="text-sm text-gray-500">Loading suppliers...</div>
                      ) : sellers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {sellers.map(seller => (
                            <label key={seller._id} className="flex items-center space-x-2 border p-2 rounded">
                              <input
                                type="checkbox"
                                id={`seller-${seller._id}`}
                                checked={selectedSellers.includes(seller._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSellers([...selectedSellers, seller._id]);
                                  } else {
                                    setSelectedSellers(selectedSellers.filter(id => id !== seller._id));
                                  }
                                }}
                                className="mr-2"
                              />
                              <span>{seller.name} - {seller.pocName || 'No POC'} - {seller.destination || 'No destination'}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-red-500">No suppliers available. Please add suppliers first.</div>
                      )}
                    </div>

                    {/* Booking Status Section */}
                    <select
                      className="form-input py-1 px-2"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      disabled={statusUpdateLoading || selectedSellers.length === 0}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="booked">Booked</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
                      onClick={handleStatusUpdate}
                      disabled={statusUpdateLoading || selectedSellers.length === 0}
                    >
                      {statusUpdateLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-400"
                      onClick={() => {
                        setEditingStatus(false);
                        setSelectedStatus(booking.bookingStatus);
                      }}
                      disabled={statusUpdateLoading}
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Multiple Seller selection when status is 'booked' */}
                  {selectedStatus === 'booked' && (
                    <div className="mt-2 ml-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Suppliers (at least one required)
                      </label>
                      {loadingSellers ? (
                        <div className="text-sm text-gray-500">Loading suppliers...</div>
                      ) : sellers.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-xs text-blue-600 mb-1">
                            Select suppliers for this booking and specify their services
                          </div>

                          {sellers.map(seller => (
                            <div key={seller._id} className="border border-gray-200 rounded p-2 bg-gray-50">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`seller-${seller._id}`}
                                  checked={selectedSellers.includes(seller._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedSellers([...selectedSellers, seller._id]);
                                    } else {
                                      setSelectedSellers(selectedSellers.filter(id => id !== seller._id));
                                    }
                                  }}
                                  className="mr-2"
                                />
                                <label htmlFor={`seller-${seller._id}`} className="text-sm font-medium">
                                  {seller.name} - {seller.pocName || 'No POC'} - {seller.destination || 'No destination'}
                                  {seller.services && ` (${Object.entries(seller.services)
                                    .filter(([_, value]) => value)
                                    .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                                    .join(', ')})`}
                                </label>
                              </div>

                              {selectedSellers.includes(seller._id) && (
                                <div className="mt-2 pl-6 space-y-2">
                                  <div>
                                    <label className="block text-xs text-gray-600">Services</label>
                                    <input
                                      type="text"
                                      value={sellerServices[seller._id] || ''}
                                      onChange={(e) => setSellerServices({
                                        ...sellerServices,
                                        [seller._id]: e.target.value
                                      })}
                                      placeholder="e.g., Hotel, Transport, Activities"
                                      className="form-input text-sm w-full mt-1 py-1"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600">Notes</label>
                                    <textarea
                                      value={sellerNotes[seller._id] || ''}
                                      onChange={(e) => setSellerNotes({
                                        ...sellerNotes,
                                        [seller._id]: e.target.value
                                      })}
                                      placeholder="Any special instructions or notes"
                                      className="form-textarea text-sm w-full mt-1 py-1"
                                      rows="2"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-red-500">
                          No suppliers available. Please add suppliers first.
                        </div>
                      )}
                      {selectedStatus === 'booked' && selectedSellers.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          You must select at least one supplier when marking a booking as booked.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <span className={`capitalize mr-2 ${bookingStatus === 'processing' ? 'text-orange-600 font-medium' : bookingStatus === 'booked' ? 'text-green-600 font-medium' : bookingStatus === 'confirmed' ? 'text-blue-600 font-medium' : bookingStatus === 'completed' ? 'text-green-800 font-medium' : bookingStatus === 'cancelled' ? 'text-red-600 font-medium' : ''}`}>
                    {bookingStatus}
                  </span>
                  {isAdmin && bookingStatus !== 'booked' && (
                    <button
                      className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                      onClick={() => {
                        console.log('Edit status clicked, isAdmin:', isAdmin);
                        setEditingStatus(true);
                        // Fetch sellers when edit button is clicked
                        if (!sellers.length) {
                          fetchSellers();
                        }
                      }}
                    >
                      <PencilIcon className="h-3 w-3 mr-1" /> Update Status
                    </button>
                  )}
                  {bookingStatus === 'booked' && (
                    <span className="text-xs text-gray-500 ml-2">(Cannot change status after booking is marked as booked)</span>
                  )}
                </div>
              )}
            </div>

            {/* Display assigned seller information if booking is already booked */}
            {bookingStatus === 'booked' && (
              <div className="mt-2">
                {/* Display suppliers information */}
                <div className="p-2 bg-blue-50 rounded-md">
                  {booking.sellers && booking.sellers.length > 0 ? (
                    <div>
                      <p className="font-medium text-sm mb-2">Assigned Suppliers:</p>
                      <div className="space-y-2">
                        {booking.sellers.map((sellerItem, index) => (
                          <div key={index} className="bg-white p-2 rounded border">
                            <div className="font-medium">
                              {(() => {
                                let sellerObj = sellerItem.seller;
                                // If seller is just an ID, look up full details from sellers array
                                if (typeof sellerObj === 'string') {
                                  const found = sellers.find(s => s._id === sellerObj);
                                  if (found) sellerObj = found;
                                }
                                console.log('[BookingDetailModal] Rendering assigned supplier:', sellerObj);
                                if (sellerObj && (sellerObj.name || sellerObj.pocName || sellerObj._id)) {
                                  return <>
                                    {sellerObj.name ? sellerObj.name : 'Unknown Supplier'}
                                    {sellerObj.pocName ? ` - ${sellerObj.pocName}` : ''}
                                    {sellerObj.destination ? ` (${sellerObj.destination})` : ''}
                                  </>;
                                } else {
                                  return <span className="text-gray-400">Unknown Supplier</span>;
                                }
                              })()}
                            </div>
                            {sellerItem.services && (
                              <div className="text-sm mt-1"><span className="font-medium">Services:</span> {sellerItem.services}</div>
                            )}
                            {sellerItem.notes && (
                              <div className="text-sm"><span className="font-medium">Notes:</span> {sellerItem.notes}</div>
                            )}
                            {sellerItem.seller.services && (
                              <div className="text-xs mt-1">
                                <span className="font-medium">Available Services:</span> {Object.entries(sellerItem.seller.services)
                                  .filter(([_, value]) => value)
                                  .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                                  .join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : booking.seller ? (
                    <div>
                      <p className="font-medium text-sm mb-1">Assigned Seller:</p>
                      <div className="bg-white p-2 rounded border">
                        <div>
                          <span className="font-medium">{booking.seller.name}</span> - {booking.seller.pocName || 'No POC'}
                          {booking.seller.destination && ` (${booking.seller.destination})`}
                        </div>
                        {booking.seller.services && (
                          <p className="text-xs mt-1">
                            <span className="font-medium">Services:</span> {Object.entries(booking.seller.services)
                              .filter(([_, value]) => value)
                              .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No supplier has been assigned yet.</p>
                  )}
                  {booking.sellerAssignedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Assigned on: {new Date(booking.sellerAssignedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {statusUpdateError && isAdmin && (
          <div className="mb-2 text-red-600 text-sm">
            {statusUpdateError}
          </div>
        )}

        {statusUpdateSuccess && isAdmin && (
          <div className="mb-2 text-green-600 text-sm">
            Status updated successfully!
          </div>
        )}

        {/* Payment Status Display (Read-only) */}
        {!isAdmin ? null : (
          <div className="mb-2 flex items-center">
            <span className="font-semibold mr-2">Payment Status:</span>
            <span className={`capitalize mr-2 ${booking.paymentStatus === 'paid' ? 'text-green-600 font-medium' : booking.paymentStatus === 'partially_paid' ? 'text-orange-600 font-medium' : booking.paymentStatus === 'refunded' ? 'text-blue-600 font-medium' : 'text-red-600 font-medium'}`}>
              {booking.paymentStatus ? booking.paymentStatus.replace('_', ' ') : 'unpaid'}
            </span>
            <span className="text-sm text-gray-500 ml-2">(Updated when payment is claimed)</span>
          </div>
        )}

        <div className="mb-2"><span className="font-semibold">Total Amount:</span> ₹{totalAmount?.toLocaleString()}</div>
        {specialRequirements && (
          <div className="mb-2"><span className="font-semibold">Special Requirements:</span> {specialRequirements}</div>
        )}

        {/* Final Itinerary Section */}
        {/* Agent Payment Claim Button */}
        {user && user.role === 'agent' && booking && booking.bookingStatus === 'confirmed' && (
          <div className="mb-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-lg">Payment Claim</h4>
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowClaimModal(true)}
              >
                <CurrencyDollarIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                Claim Payment
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">Submit a payment claim for this confirmed booking to receive funds in your wallet.</p>
          </div>
        )}

        {/* Final Itinerary Section */}
        <div className="mb-4 border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-lg">Final Itinerary</h4>
            <div className="flex space-x-2">
              {booking.quote && !finalItinerary && isAdmin && (
                <button
                  className="text-green-600 hover:text-green-800 flex items-center text-sm border border-green-600 rounded px-2 py-1"
                  onClick={fetchQuoteItinerary}
                  disabled={fetchingQuoteItinerary}
                >
                  {fetchingQuoteItinerary ? 'Fetching...' : 'Copy from Quote'}
                </button>
              )}
              {isAdmin && (
                <button
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                  onClick={() => setEditingItinerary(!editingItinerary)}
                >
                  <PencilIcon className="h-4 w-4 mr-1" /> Edit
                </button>
              )}
            </div>
          </div>

          {itineraryError && <div className="text-red-500 text-sm mb-2">{itineraryError}</div>}
          {quoteItineraryError && <div className="text-red-500 text-sm mb-2">{quoteItineraryError}</div>}
          {itinerarySuccess && <div className="text-green-500 text-sm mb-2">Itinerary updated successfully!</div>}

          {editingItinerary ? (
            <div className="mb-3">
              <textarea
                className="w-full border rounded p-2 min-h-[150px]"
                value={itineraryText}
                onChange={(e) => setItineraryText(e.target.value)}
                placeholder="Enter the final itinerary details here..."
              />
              <div className="flex justify-end mt-2 space-x-2">
                <button
                  className="btn-outline px-3 py-1 text-sm flex items-center"
                  onClick={() => {
                    setEditingItinerary(false);
                    setItineraryText(booking.finalItinerary || '');
                  }}
                  disabled={itineraryLoading}
                >
                  <XIcon className="h-4 w-4 mr-1" /> Cancel
                </button>
                <button
                  className="btn-primary px-3 py-1 text-sm flex items-center"
                  onClick={handleItineraryUpdate}
                  disabled={itineraryLoading}
                >
                  {itineraryLoading ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4 mr-1" /> Save
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded border whitespace-pre-wrap">
              {finalItinerary ? finalItinerary : (
                <span className="text-gray-500 italic">No itinerary has been added yet.</span>
              )}
            </div>
          )}
        </div>

        {/* Hotel Details Section */}
        <div className="mb-4 border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-lg">Hotel Details</h4>
            {isAdmin && (
              <button
                className="text-blue-600 hover:text-blue-800 flex items-center"
                onClick={() => setShowHotelFlightModal(true)}
              >
                <PencilIcon className="h-4 w-4 mr-1" /> Edit
              </button>
            )}
          </div>

          {hotelDetails && hotelDetails.length > 0 ? (
            <div className="space-y-3">
              {hotelDetails.map((hotel, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded border">
                  <div className="font-medium">{hotel.name}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div><span className="font-medium">Check-in Date:</span> {hotel.checkIn ? new Date(hotel.checkIn).toLocaleDateString() : 'N/A'}</div>
                    <div><span className="font-medium">Check-out Date:</span> {hotel.checkOut ? new Date(hotel.checkOut).toLocaleDateString() : 'N/A'}</div>
                    <div><span className="font-medium">Confirmation Number:</span> {hotel.confirmationNumber || 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No hotel details have been added yet.</p>
          )}
        </div>

        {/* Flight Details Section */}
        <div className="mb-4 border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-lg">Flight Details</h4>
            {isAdmin && (
              <button
                className="text-blue-600 hover:text-blue-800 flex items-center"
                onClick={() => setShowHotelFlightModal(true)}
              >
                <PencilIcon className="h-4 w-4 mr-1" /> Edit
              </button>
            )}
          </div>
          
          {flightDetails && flightDetails.length > 0 ? (
            <div className="space-y-3">
              {flightDetails.map((flight, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded border">
                  <div className="font-medium">{flight.airportName} {flight.flightNumber}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div><span className="font-medium">Date of Travel:</span> {flight.travelDate ? new Date(flight.travelDate).toLocaleDateString() : 'N/A'}</div>
                    <div><span className="font-medium">Departure Time:</span> {flight.departureTime || 'N/A'}</div>
                    <div><span className="font-medium">Arrival Time:</span> {flight.arrivalTime || 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No flight details have been added yet.</p>
          )}
        </div>

        {/* Travelers Section */}
        <div className="mb-4 border-t pt-4">
          <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold text-lg">Travelers</h4>
          {isAdmin && (
            <button
              className="text-blue-600 hover:text-blue-800 flex items-center"
              onClick={() => setShowUpdateModal(true)}
            >
              <PencilIcon className="h-4 w-4 mr-1" /> Edit
            </button>
          )}
        </div>
        {booking.travelers && booking.travelers.length > 0 ? (
          <div className="space-y-2">
            {booking.travelers.map((traveler, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded border">
                <div className="font-medium">{traveler.name}</div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div><span className="font-medium">Gender:</span> {traveler.gender ? traveler.gender.charAt(0).toUpperCase() + traveler.gender.slice(1) : 'N/A'}</div>
                  <div><span className="font-medium">Age:</span> {traveler.age || 'N/A'} yrs</div>
                  <div><span className="font-medium">ID Type:</span> {traveler.idType ? traveler.idType.replace('_', ' ').charAt(0).toUpperCase() + traveler.idType.replace('_', ' ').slice(1) : 'N/A'}</div>
                  <div><span className="font-medium">ID Number:</span> {traveler.idNumber || 'N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No traveler details have been added yet.</p>
        )}
      </div>
      {/* Activities Section */}
      <div className="mb-4 border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold text-lg">Activities & Sightseeing</h4>
          {isAdmin && (
            <button
              className="text-blue-600 hover:text-blue-800 flex items-center"
              onClick={() => setShowActivitiesModal(true)}
            >
              <PencilIcon className="h-4 w-4 mr-1" /> Edit
            </button>
          )}
        </div>
        {booking.activities && booking.activities.length > 0 ? (
          <div className="space-y-4">
            {booking.activities.map((activity, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded border">
                <div className="font-medium text-lg">{activity.sightseeingName}</div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div><span className="font-medium">Date:</span> {activity.date ? new Date(activity.date).toLocaleDateString() : 'N/A'}</div>
                  <div><span className="font-medium">Pickup Time:</span> {activity.pickupTime || 'N/A'}</div>
                  <div><span className="font-medium">Drop Time:</span> {activity.dropTime || 'N/A'}</div>
                  <div>
                    <span className="font-medium">Pickup Location:</span> {' '}
                    {activity.pickupLocation && activity.pickupLocation.startsWith('From:') ? (
                      <span className="text-blue-600">{activity.pickupLocation}</span>
                    ) : (activity.pickupLocation || 'N/A')}
                  </div>
                  <div>
                    <span className="font-medium">Drop Location:</span> {' '}
                    {activity.isSameAsPickup ? (
                      <span className="text-gray-600">Same as pickup</span>
                    ) : activity.isConnectingActivity ? (
                      <span className="text-blue-600">{activity.dropLocation}</span>
                    ) : (activity.dropLocation || 'N/A')}
                  </div>
                  {activity.isConnectingActivity && (
                    <div className="col-span-2 bg-blue-50 p-2 rounded mt-1">
                      <span className="font-medium text-blue-700">Connected Activity:</span> {' '}
                      <span className="text-blue-700">This activity connects to the next sightseeing location</span>
                    </div>
                  )}
                  {activity.notes && (
                    <div className="col-span-2 mt-2"><span className="font-medium">Notes:</span> {activity.notes}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No activities have been added yet.</p>
        )}
      </div>

      {isAdmin && agent && (
        <div className="mb-2"><span className="font-semibold">Agent:</span> {agent?.name} ({agent?.email})</div>
      )}
      <div className="mb-2 text-xs text-gray-500">Created: {new Date(createdAt).toLocaleString()} | Updated: {new Date(updatedAt).toLocaleString()}</div>
      {invoiceUrl && (
        <div className="mt-4">
          <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">Download Invoice</a>
        </div>
      )}
      <div className="flex justify-end mt-4 space-x-2">
        <button
          className="btn-primary"
          onClick={() => setShowUpdateModal(true)}
        >
          Update Booking
        </button>
        <button className="btn-outline" onClick={onClose}>Close</button>
      </div>

      {/* Render all modals inline */}
      {booking && (
        <>
          <BookingUpdateModal
            open={showUpdateModal}
            onClose={() => setShowUpdateModal(false)}
            booking={booking}
          />

          <HotelFlightEditModal
            open={showHotelFlightModal}
            onClose={() => setShowHotelFlightModal(false)}
            booking={booking}
            onUpdate={(updatedBooking) => {
              if (updatedBooking.hotelDetails) booking.hotelDetails = updatedBooking.hotelDetails;
              if (updatedBooking.flightDetails) booking.flightDetails = updatedBooking.flightDetails;
            }}
          />

          <ActivityEditModal
            open={showActivitiesModal}
            onClose={() => setShowActivitiesModal(false)}
            booking={booking}
            onUpdate={(updatedBooking) => {
              if (updatedBooking.activities) booking.activities = updatedBooking.activities;
            }}
          />

          {showClaimModal && (
            <ClaimModal
              isOpen={showClaimModal}
              onClose={() => setShowClaimModal(false)}
              booking={booking}
            />
          )}
        </>
      )}
    </div>
  </div>
);
};

export default BookingDetailModal;
