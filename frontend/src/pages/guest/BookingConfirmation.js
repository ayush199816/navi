import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiCheckCircle } from 'react-icons/fi';
import axios from '../../utils/axiosConfig';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const user = useSelector(state => state.auth.user);
  const [booking, setBooking] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await axios.get(`/api/bookings/guest/${bookingId}`);
        setBooking(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching booking:', error);
      }
    };
    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <FiCheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
              </div>
              <h2 className="mt-3 text-3xl font-extrabold text-gray-900">
                Booking Confirmed
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Your booking has been successfully created. You'll receive an email with all the details.
              </p>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center">
                  <dt className="text-sm font-medium text-gray-500">Booking ID</dt>
                  <dd className="ml-4 text-sm text-gray-900">#{booking._id}</dd>
                </div>
                <div className="flex items-center">
                  <dt className="text-sm font-medium text-gray-500">Sightseeing</dt>
                  <dd className="ml-4 text-sm text-gray-900">{booking.sightseeing.name}</dd>
                </div>
                <div className="flex items-center">
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="ml-4 text-sm text-gray-900">{new Date(booking.bookingDate).toLocaleDateString()}</dd>
                </div>
                <div className="flex items-center">
                  <dt className="text-sm font-medium text-gray-500">Total Pax</dt>
                  <dd className="ml-4 text-sm text-gray-900">{booking.paxCount}</dd>
                </div>
                <div className="flex items-center">
                  <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                  <dd className="ml-4 text-sm text-gray-900">₹{booking.totalAmount}</dd>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900">Lead Passenger Details</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center">
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="ml-4 text-sm text-gray-900">{booking.leadPax.name}</dd>
                  </div>
                  <div className="flex items-center">
                    <dt className="text-sm font-medium text-gray-500">Age</dt>
                    <dd className="ml-4 text-sm text-gray-900">{booking.leadPax.age}</dd>
                  </div>
                  <div className="flex items-center">
                    <dt className="text-sm font-medium text-gray-500">Passport Number</dt>
                    <dd className="ml-4 text-sm text-gray-900">{booking.leadPax.passportNumber}</dd>
                  </div>
                  <div className="flex items-center">
                    <dt className="text-sm font-medium text-gray-500">PAN Number</dt>
                    <dd className="ml-4 text-sm text-gray-900">{booking.leadPax.panNumber}</dd>
                  </div>
                </div>

                {booking.additionalPax && booking.additionalPax.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900">Additional Passenger Details</h3>
                    {booking.additionalPax.map((pax, index) => (
                      <div key={index} className="mt-4 space-y-4">
                        <h4 className="text-sm font-medium text-gray-500">Passenger {index + 2}</h4>
                        <div className="flex items-center">
                          <dt className="text-sm font-medium text-gray-500">Name</dt>
                          <dd className="ml-4 text-sm text-gray-900">{pax.name}</dd>
                        </div>
                        <div className="flex items-center">
                          <dt className="text-sm font-medium text-gray-500">Age</dt>
                          <dd className="ml-4 text-sm text-gray-900">{pax.age}</dd>
                        </div>
                        <div className="flex items-center">
                          <dt className="text-sm font-medium text-gray-500">Passport Number</dt>
                          <dd className="ml-4 text-sm text-gray-900">{pax.passportNumber}</dd>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <button
                  onClick={() => window.location.href = '/guest-dashboard'}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
