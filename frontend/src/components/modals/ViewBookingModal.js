import React from 'react';
import { useDispatch } from 'react-redux';
import { 
  ShoppingBagIcon, 
  UserIcon, 
  CalendarIcon, 
  CurrencyRupeeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

const ViewBookingModal = ({ booking }) => {
  const dispatch = useDispatch();
  
  if (!booking) return <div>Booking not found</div>;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <ShoppingBagIcon className="h-5 w-5 text-primary-500 mr-2" />
            Booking Details
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
            ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              booking.status === 'in-progress' ? 'bg-indigo-100 text-indigo-800' :
              'bg-gray-100 text-gray-800'}`}
          >
            {booking.status}
          </span>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Booking ID: {booking.bookingId || booking._id}
        </p>
      </div>

      <div className="border-t border-b border-gray-200 py-4">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Package</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {booking.packageDetails?.name || 'Custom Package'}
            </dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
              Customer Name
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{booking.customerName}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
              Email
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{booking.customerEmail}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
              Phone
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{booking.customerPhone}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
              Number of Travelers
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{booking.numberOfTravelers}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
              Travel Date
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(booking.travelDate)}</dd>
          </div>
          
          {booking.returnDate && (
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                Return Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(booking.returnDate)}</dd>
            </div>
          )}
          
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
              Destination
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {booking.destination || (booking.packageDetails && booking.packageDetails.destination)}
            </dd>
          </div>
          
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Special Requests</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {booking.specialRequests || 'None'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-b border-gray-200 py-4">
        <h4 className="text-sm font-medium text-gray-500 mb-4">Payment Details</h4>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <CurrencyRupeeIcon className="h-4 w-4 mr-1 text-gray-400" />
              Total Amount
            </dt>
            <dd className="mt-1 text-sm font-bold text-gray-900">₹{booking.totalAmount?.toLocaleString() || '0'}</dd>
          </div>
          
          {booking.pricing?.packagePrice > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Package Price</dt>
              <dd className="mt-1 text-sm text-gray-900">₹{booking.pricing.packagePrice?.toLocaleString()}</dd>
            </div>
          )}
          
          {booking.pricing?.agentPrice > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Agent Price</dt>
              <dd className="mt-1 text-sm text-gray-900">₹{booking.pricing.agentPrice?.toLocaleString()}</dd>
            </div>
          )}
          
          {booking.pricing?.discountAmount > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Discount</dt>
              <dd className="mt-1 text-sm text-green-600">-₹{booking.pricing.discountAmount?.toLocaleString()}</dd>
            </div>
          )}
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">{booking.paymentStatus || 'Not Paid'}</dd>
          </div>
          
          {booking.paymentMethod && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{booking.paymentMethod}</dd>
            </div>
          )}
          
          {booking.amountPaid > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Amount Paid</dt>
              <dd className="mt-1 text-sm text-gray-900">₹{booking.amountPaid?.toLocaleString()}</dd>
            </div>
          )}
          
          {booking.balanceAmount > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Balance Due</dt>
              <dd className="mt-1 text-sm text-gray-900">₹{booking.balanceAmount?.toLocaleString()}</dd>
            </div>
          )}
        </dl>
      </div>

      {booking.itinerary && (
        <div className="border-b border-gray-200 py-4">
          <h4 className="text-sm font-medium text-gray-500 mb-4">Itinerary</h4>
          <div className="space-y-4">
            {booking.itinerary.map((day, index) => (
              <div key={index} className="border-l-2 border-primary-200 pl-4">
                <h5 className="text-sm font-medium text-gray-900">Day {index + 1}</h5>
                <p className="text-sm text-gray-600 mt-1">{day.description}</p>
                {day.activities && day.activities.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-sm text-gray-600 pl-2">
                    {day.activities.map((activity, actIndex) => (
                      <li key={actIndex}>{activity}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {booking.inclusions && booking.inclusions.length > 0 && (
        <div className="border-b border-gray-200 py-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Inclusions</h4>
          <ul className="mt-2 divide-y divide-gray-200">
            {booking.inclusions.map((item, index) => (
              <li key={index} className="py-2 flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-900">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {booking.exclusions && booking.exclusions.length > 0 && (
        <div className="border-b border-gray-200 py-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Exclusions</h4>
          <ul className="mt-2 divide-y divide-gray-200">
            {booking.exclusions.map((item, index) => (
              <li key={index} className="py-2 flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span className="text-sm text-gray-900">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          <p>Booked on {formatDate(booking.createdAt)}</p>
          {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
            <p className="mt-1">Last updated on {formatDate(booking.updatedAt)}</p>
          )}
        </div>
        
        {booking.invoiceUrl && (
          <a
            href={booking.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
            Download Invoice
          </a>
        )}
      </div>
    </div>
  );
};

export default ViewBookingModal;
