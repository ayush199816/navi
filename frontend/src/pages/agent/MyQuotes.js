import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMyQuotes, respondToQuote } from '../../redux/slices/quoteSlice';
import { openModal } from '../../redux/slices/uiSlice';
import QuoteDetailModal from '../../components/QuoteDetailModal';
import CreateQuoteModal from './CreateQuoteModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';

const MyQuotes = () => {
  const dispatch = useDispatch();
  const { quotes, loading, pagination } = useSelector(state => state.quotes);
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'createdAt:desc'
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchQuotes();
  }, [filters, currentPage]);

  const fetchQuotes = () => {
    dispatch(getMyQuotes({
      page: currentPage,
      limit: 10,
      status: filters.status || undefined,
      sortBy: filters.sortBy
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRespondToQuote = (quoteId, response) => {
    dispatch(respondToQuote({ id: quoteId, response }))
      .unwrap()
      .then(() => {
        fetchQuotes();
      });
  };

  const handleViewQuote = (quote) => {
    dispatch(openModal({
      modalType: 'VIEW_QUOTE',
      modalData: { quote }
    }));
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    let badgeClass = '';
    let icon = null;
    
    switch (status) {
      case 'pending':
        badgeClass = 'bg-yellow-100 text-yellow-800';
        icon = <ClockIcon className="h-4 w-4 mr-1" />;
        break;
      case 'accepted':
        badgeClass = 'bg-green-100 text-green-800';
        icon = <CheckCircleIcon className="h-4 w-4 mr-1" />;
        break;
      case 'rejected':
        badgeClass = 'bg-red-100 text-red-800';
        icon = <XCircleIcon className="h-4 w-4 mr-1" />;
        break;
      case 'expired':
        badgeClass = 'bg-gray-100 text-gray-800';
        icon = <ClockIcon className="h-4 w-4 mr-1" />;
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800';
        icon = <ClockIcon className="h-4 w-4 mr-1" />;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Modal state for agent quote detail
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // Modal state for quote creation
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Listen for modal open via Redux (VIEW_QUOTE)
  const { activeModal, modalData } = useSelector(state => state.ui);
  useEffect(() => {
    if (activeModal === 'VIEW_QUOTE' && modalData?.quote) {
      setSelectedQuote(modalData.quote);
      setViewModalOpen(true);
    }
  }, [activeModal, modalData]);

  // Agent response state
  const [agentResponse, setAgentResponse] = useState('');
  const [agentActionLoading, setAgentActionLoading] = useState(false);

  // Show agent response box if quote is not accepted/rejected/expired
  const canRespond = selectedQuote && ['pending', 'responded'].includes(selectedQuote.status);

  // Handle agent response submit
  const handleAgentRespond = async () => {
    if (!selectedQuote) return;
    setAgentActionLoading(true);
    try {
      // First, validate the response
      if (!agentResponse.trim()) {
        toast.error('Please enter a response');
        return;
      }

      // Make the API call to submit the response
      const response = await api.put(`/quotes/${selectedQuote._id}/response`, { 
        response: agentResponse,
        status: 'responded' // Explicitly set status to 'responded' for tracking
      });
      
      // Update the UI with the response
      toast.success('Response sent successfully!');
      
      // Clear the response input
      setAgentResponse(''); 
      
      try {
        // Refresh the quote data to show updated discussion
        const { data } = await api.get(`/quotes/${selectedQuote._id}`);
        if (data.success && data.data) {
          setSelectedQuote(data.data);
          // Also update the quotes list in the background
          fetchQuotes();
        }
      } catch (refreshError) {
        console.error('Error refreshing quote:', refreshError);
        // Even if refresh fails, we can still proceed
      }
    } catch (err) {
      console.error('Error submitting response:', err);
      const errorMessage = err.response?.data?.message || 'Failed to send response. Please try again.';
      
      // Handle specific error cases
      if (err.response?.status === 403) {
        toast.error('You are not authorized to respond to this quote.');
      } else if (err.response?.status === 404) {
        toast.error('Quote not found. It may have been deleted.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setAgentActionLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Quotes</h1>
        <button className="btn-primary flex items-center" onClick={() => setCreateModalOpen(true)}>
          <DocumentPlusIcon className="h-5 w-5 mr-2" />
          Create Quote
        </button>
      </div>

      {/* Create Quote Modal */}
      <CreateQuoteModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          fetchQuotes();
          toast.success('Quote request submitted!');
        }}
      />

      {/* Quote Detail Modal */}
      <QuoteDetailModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        quote={selectedQuote}
        isAdmin={false}
      >
        {canRespond && (
          <div className="mt-4 space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">Respond / Request Changes</label>
              <textarea
                className="form-input w-full"
                rows={2}
                value={agentResponse}
                onChange={e => setAgentResponse(e.target.value)}
                disabled={agentActionLoading}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="btn-primary"
                onClick={handleAgentRespond}
                disabled={agentActionLoading || !agentResponse}
              >Send Response</button>
            </div>
          </div>
        )}
      </QuoteDetailModal>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-auto">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto">
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sortBy"
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="totalPrice:desc">Price (High to Low)</option>
              <option value="totalPrice:asc">Price (Low to High)</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto flex items-end">
            <button
              type="button"
              onClick={fetchQuotes}
              className="btn-outline flex items-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Quotes List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading quotes...</p>
          </div>
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No quotes found</h3>
          <p className="mt-1 text-gray-500">
            You don't have any quotes matching your filters. Try changing your filters or create a new quote.
          </p>
          <div className="mt-6">
            <Link to="/my-quotes/new" className="btn-primary">
              Create New Quote
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {quotes.map((quote) => (
              <li key={quote._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <p className="text-sm font-medium text-primary-600 truncate">
                        {quote.packageDetails?.name || 'Custom Quote'}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <StatusBadge status={quote.status} />
                    </div>
                  </div>
                  
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <span className="truncate">
                          {quote.customerName} • {quote.customerEmail}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        <span className="font-medium text-gray-900">₹{(quote.quotedPrice || quote.totalAmount || 0).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      <span>{quote.destination}</span>
                      <span className="mx-1">•</span>
                      <span>
                        {new Date(quote.travelDates?.startDate).toLocaleDateString()} - {new Date(quote.travelDates?.endDate).toLocaleDateString()}
                      </span>
                      {quote.numberOfTravelers && (
                        <>
                          <span className="mx-1">•</span>
                          <span>
                            {quote.numberOfTravelers?.adults || 1} {quote.numberOfTravelers?.adults === 1 ? 'Adult' : 'Adults'}
                            {quote.numberOfTravelers?.children > 0 && `, ${quote.numberOfTravelers.children} ${quote.numberOfTravelers.children === 1 ? 'Child' : 'Children'}`}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">
                        Created on {new Date(quote.createdAt).toLocaleDateString()}
                        {quote.validUntil && (
                          <span> • Valid until {new Date(quote.validUntil).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleViewQuote(quote)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      
                      {quote.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRespondToQuote(quote._id, 'accepted')}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Accept
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleRespondToQuote(quote._id, 'rejected')}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.pages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * 10, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {[...Array(pagination.pages)].map((_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === pagination.pages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default MyQuotes;
