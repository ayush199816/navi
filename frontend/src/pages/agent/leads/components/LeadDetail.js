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
import { fetchLeadById, clearCurrentLead, deleteLead } from '../../../../redux/slices/leadSlice';
import { toast } from 'react-toastify';
import { openModal } from '../../../../redux/slices/uiSlice';

const LeadDetail = ({ leadId, onBack }) => {
  const dispatch = useDispatch();
  const { currentLead, loading } = useSelector(state => state.leads);

  useEffect(() => {
    if (leadId) {
      dispatch(fetchLeadById(leadId))
        .unwrap()
        .catch(error => {
          console.error('Error fetching lead:', error);
          toast.error(error || 'Failed to load lead details');
          if (onBack) onBack(); // Go back to the previous view on error
        });
    }

    return () => {
      dispatch(clearCurrentLead());
    };
  }, [dispatch, leadId, onBack]);

  const handleEdit = () => {
    dispatch(openModal({
      modalType: 'EDIT_LEAD',
      modalData: { 
        lead: currentLead,
        onSuccess: () => dispatch(fetchLeadById(leadId))
      }
    }));
  };

  const handleDelete = () => {
    dispatch(openModal({
      modalType: 'CONFIRM_DELETE',
      modalData: {
        title: 'Delete Lead',
        message: 'Are you sure you want to delete this lead? This action cannot be undone.',
        onConfirm: () => {
          dispatch(deleteLead(leadId))
            .unwrap()
            .then(() => {
              toast.success('Lead deleted successfully');
              if (onBack) onBack();
            })
            .catch((error) => {
              toast.error(error || 'Failed to delete lead');
            });
        }
      }
    }));
  };

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
      case 'proposal':
        return 'bg-purple-100 text-purple-800';
      case 'negotiation':
        return 'bg-indigo-100 text-indigo-800';
      case 'won':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading.leadDetail) {
    return (
      <div className="animate-pulse p-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="grid grid-cols-3 gap-4">
              <div className="h-4 bg-gray-200 rounded col-span-1"></div>
              <div className="h-4 bg-gray-200 rounded col-span-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentLead) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Lead not found or has been deleted.</p>
        <button
          onClick={onBack}
          className="mt-4 btn-outline flex items-center mx-auto"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Leads
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <button
            onClick={onBack}
            className="mb-2 text-gray-500 hover:text-gray-700 flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">Back to leads</span>
          </button>
          <h3 className="text-lg leading-6 font-medium text-gray-900">{currentLead.customerName}</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(currentLead.status)}`}>
              {currentLead.status ? currentLead.status.charAt(0).toUpperCase() + currentLead.status.slice(1) : 'No Status'}
            </span>
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="btn-outline"
          >
            Edit Lead
          </button>
          <button
            onClick={handleDelete}
            className="btn-danger"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-400" />
              Email
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{currentLead.customerEmail || 'Not provided'}</dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <PhoneIcon className="h-5 w-5 mr-2 text-gray-400" />
              Phone
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{currentLead.customerPhone || 'Not provided'}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <TagIcon className="h-5 w-5 mr-2 text-gray-400" />
              Source
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {currentLead.source ? currentLead.source.charAt(0).toUpperCase() + currentLead.source.slice(1).replace('_', ' ') : 'Unknown'}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <CurrencyRupeeIcon className="h-5 w-5 mr-2 text-gray-400" />
              Budget
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {currentLead.budget ? `₹${currentLead.budget.toLocaleString()}` : 'Not specified'}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <UserCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
              Assigned To
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {currentLead.assignedTo ? (
                <div>
                  <div className="font-medium">{currentLead.assignedTo.name}</div>
                  <div className="text-gray-600">{currentLead.assignedTo.email}</div>
                  {currentLead.assignedTo.phone && (
                    <div className="text-gray-600">{currentLead.assignedTo.phone}</div>
                  )}
                </div>
              ) : 'Unassigned'}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <CurrencyRupeeIcon className="h-5 w-5 mr-2 text-gray-400" />
              Lead Value
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {currentLead.value ? `₹${new Intl.NumberFormat('en-IN').format(currentLead.value)}` : 'Not specified'}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
              Last Contacted
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatDate(currentLead.lastContacted, true) || 'No contact made yet'}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
              Created By
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {currentLead.createdBy?.name || 'System'}
              {currentLead.createdBy?.email && (
                <div className="text-gray-600">{currentLead.createdBy.email}</div>
              )}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
              Travel Date
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatDate(currentLead.travelDate || currentLead.quote?.travelDates?.start)}
              {currentLead.quote?.travelDates?.end && (
                <span> to {formatDate(currentLead.quote.travelDates.end)}</span>
              )}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
              Destination
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {currentLead.destination || 'Not specified'}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
              Created On
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatDate(currentLead.createdAt)}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
              Last Updated
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatDate(currentLead.updatedAt)}
            </dd>
          </div>
          {currentLead.notes && (
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
                Notes
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                {currentLead.notes}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

export default LeadDetail;
