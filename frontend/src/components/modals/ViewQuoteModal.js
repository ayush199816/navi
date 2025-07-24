import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { DocumentTextIcon, UserIcon, CalendarIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';

const ViewQuoteModal = ({ quote }) => {
  const dispatch = useDispatch();
  const [showHistory, setShowHistory] = useState(false);
  
  if (!quote) return <div>Quote not found</div>;

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
            <DocumentTextIcon className="h-5 w-5 text-primary-500 mr-2" />
            Quote Details
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
            ${quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              quote.status === 'accepted by agent' || quote.status === 'accepted' ? 'bg-green-100 text-green-800' : 
              quote.status === 'rejected' ? 'bg-red-100 text-red-800' : 
              'bg-gray-100 text-gray-800'}`}
          >
            {quote.status}
          </span>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Quote ID: {quote.quoteId || quote._id}
        </p>
      </div>

      <div className="border-t border-b border-gray-200 py-4">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Package</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {quote.packageDetails?.name || 'Custom Quote'}
            </dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
              Customer Name
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{quote.customerName}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{quote.customerEmail}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Phone</dt>
            <dd className="mt-1 text-sm text-gray-900">{quote.customerPhone}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
              Number of Travelers
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {quote.numberOfTravelers ? 
                `${quote.numberOfTravelers.adults || 0} adults, ${quote.numberOfTravelers.children || 0} children` : 
                'Not specified'}
            </dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
              Travel Date
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(quote.travelDate)}</dd>
          </div>
          
          {quote.returnDate && (
            <div>
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                Return Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(quote.returnDate)}</dd>
            </div>
          )}
          
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Special Requests</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {quote.specialRequests || 'None'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-b border-gray-200 py-4">
        <h4 className="text-sm font-medium text-gray-500 mb-4">Pricing Details</h4>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <CurrencyRupeeIcon className="h-4 w-4 mr-1 text-gray-400" />
              Base Price
            </dt>
            <dd className="mt-1 text-sm text-gray-900">₹{quote.basePrice?.toLocaleString() || 'N/A'}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Taxes & Fees</dt>
            <dd className="mt-1 text-sm text-gray-900">₹{quote.taxesAndFees?.toLocaleString() || 'N/A'}</dd>
          </div>
          
          {quote.discountAmount > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Discount</dt>
              <dd className="mt-1 text-sm text-green-600">-₹{quote.discountAmount?.toLocaleString()}</dd>
            </div>
          )}
          
          <div className="sm:col-span-2">
            <dt className="text-base font-medium text-gray-900 flex items-center">
              <CurrencyRupeeIcon className="h-5 w-5 mr-1 text-gray-900" />
              {quote.quotedPrice && quote.quotedPrice !== quote.totalPrice ? 'Updated Price' : 'Total Price'}
            </dt>
            <dd className="mt-1 text-base font-bold text-gray-900">
              {quote.quotedPrice ? (
                <>
                  ₹{quote.quotedPrice.toLocaleString()}
                  {quote.quotedPrice !== quote.totalPrice && (
                    <span className="ml-2 text-sm line-through text-gray-500">
                      ₹{quote.totalPrice?.toLocaleString()}
                    </span>
                  )}
                </>
              ) : (
                <>₹{quote.totalPrice?.toLocaleString()}</>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {quote.inclusions && quote.inclusions.length > 0 && (
        <div className="border-b border-gray-200 py-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Inclusions</h4>
          <ul className="mt-2 divide-y divide-gray-200">
            {quote.inclusions.map((item, index) => (
              <li key={index} className="py-2 flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-900">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {quote.exclusions && quote.exclusions.length > 0 && (
        <div className="border-b border-gray-200 py-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Exclusions</h4>
          <ul className="mt-2 divide-y divide-gray-200">
            {quote.exclusions.map((item, index) => (
              <li key={index} className="py-2 flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span className="text-sm text-gray-900">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* History Button */}
      {quote.discussion && quote.discussion.length > 0 && (
        <div className="mb-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-3 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {showHistory ? 'Hide History' : 'Show History'} ({quote.discussion.length} {quote.discussion.length === 1 ? 'entry' : 'entries'})
          </button>
        </div>
      )}
      
      {/* Discussion History */}
      {quote.discussion && quote.discussion.length > 0 && showHistory && (
        <div className="mb-3 animate-fadeIn">
          <div className="font-semibold mb-2">Discussion History:</div>
          <div className="border rounded-md overflow-hidden max-h-60 overflow-y-auto">
            {quote.discussion.map((item, index) => (
              <div key={index} className={`p-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b last:border-b-0`}>
                <div className="whitespace-pre-wrap">{item.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.user} - {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>Created on {formatDate(quote.createdAt)}</p>
        {quote.validUntil && (
          <p className="mt-1">Valid until {formatDate(quote.validUntil)}</p>
        )}
      </div>
    </div>
  );
};

export default ViewQuoteModal;
