import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  MapPinIcon,
  DocumentTextIcon,
  TagIcon,
  UserCircleIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { fetchSalesLead, updateSalesLead } from '../../../../redux/slices/salesLeadSlice';
import { toast } from 'react-toastify';

const SalesLeadDetail = ({ leadId, onBack, onUpdate }) => {
  const dispatch = useDispatch();
  const { currentLead, loading } = useSelector(state => state.salesLeads);

  useEffect(() => {
    if (leadId) {
      dispatch(fetchSalesLead(leadId))
        .unwrap()
        .catch(error => {
          console.error('Error fetching lead:', error);
          toast.error(error || 'Failed to load lead details');
          if (onBack) onBack(); // Go back to the previous view on error
        });
    }

    return () => {
      // Cleanup if needed
    };
  }, [dispatch, leadId, onBack]);

  // Format date for display
  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'Not specified';
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    const date = new Date(dateString);
    let formatted = date.toLocaleDateString('en-IN', options);
    
    if (includeTime) {
      formatted += ` at ${date.toLocaleTimeString('en-IN', timeOptions)}`;
    }
    
    return formatted;
  };

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!currentLead) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">No lead details available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back to leads
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {currentLead.customerName || 'Lead Details'}
            </h3>
            <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${getStatusBadgeClass(currentLead.status)}`}>
              {currentLead.status || 'N/A'}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Created on {formatDate(currentLead.createdAt, true)}
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                Email
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {currentLead.customerEmail || 'Not provided'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                Phone
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {currentLead.customerPhone || 'Not provided'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                Assigned To
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {currentLead.assignedTo?.name || 'Unassigned'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <TagIcon className="h-4 w-4 mr-2 text-gray-400" />
                Source
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {currentLead.source || 'Not specified'}
              </dd>
            </div>
            {currentLead.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 flex items-start">
                  <DocumentTextIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                  <span>Notes</span>
                </dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                  {currentLead.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default SalesLeadDetail;
