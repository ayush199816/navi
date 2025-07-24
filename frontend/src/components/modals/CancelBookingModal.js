import React, { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const CancelBookingModal = ({ bookingId, onConfirm, onClose }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Call the onConfirm function with the cancellation reason
    onConfirm(reason);
    
    // Close the modal after submission
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Cancel Booking</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Are you sure you want to cancel this booking? This action cannot be undone.
              Please note that cancellation fees may apply based on the booking terms and conditions.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
            Cancellation Reason
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            placeholder="Please provide a reason for cancellation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>

        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            {isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CancelBookingModal;
