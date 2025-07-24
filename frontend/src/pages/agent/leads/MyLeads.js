import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  PlusIcon, 
  FunnelIcon, 
  ArrowPathIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { fetchLeads, setFilters, deleteLead } from '../../../redux/slices/leadSlice';
import { openModal } from '../../../redux/slices/uiSlice';
import { toast } from 'react-toastify';
import LeadSearch from './components/LeadSearch';
import LeadDetail from './components/LeadDetail';

// Initial filter state to use for resetting filters
const initialFilters = {
  status: '',
  source: '',
  dateRange: 'all',
  sortBy: 'createdAt:desc',
  search: ''
};

const MyLeads = () => {
  const dispatch = useDispatch();
  const { leads, pagination, filters, loading } = useSelector(state => state.leads);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  useEffect(() => {
    dispatch(fetchLeads({ page: currentPage, filters }));
  }, [dispatch, currentPage]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    dispatch(setFilters({ [name]: value }));
    setCurrentPage(1);
    dispatch(fetchLeads({ page: 1, filters: { ...filters, [name]: value } }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    dispatch(fetchLeads({ page, filters }));
  };

  const handleCreateLead = () => {
    dispatch(openModal({
      modalType: 'CREATE_LEAD',
      modalData: {
        onSuccess: () => dispatch(fetchLeads({ page: 1, filters }))
      }
    }));
  };

  const handleViewLead = (lead) => {
    dispatch(openModal({
      modalType: 'VIEW_LEAD',
      modalData: { lead }
    }));
  };

  const handleEditLead = (lead) => {
    dispatch(openModal({
      modalType: 'EDIT_LEAD',
      modalData: { 
        lead,
        onSuccess: () => dispatch(fetchLeads({ page: currentPage, filters }))
      }
    }));
  };

  const handleDeleteLead = (leadId) => {
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
              dispatch(fetchLeads({ page: currentPage, filters }));
            })
            .catch((error) => {
              toast.error(error || 'Failed to delete lead');
            });
        }
      }
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {selectedLeadId ? (
        <LeadDetail 
          leadId={selectedLeadId} 
          onBack={() => setSelectedLeadId(null)} 
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Leads</h1>
            <button
              type="button"
              onClick={handleCreateLead}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Lead
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <LeadSearch 
              currentFilters={filters} 
              onSearch={setCurrentPage} 
            />
          </div>
          
          {/* Filters */}
          <div className="bg-white shadow rounded-lg mb-6 p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FunnelIcon className="h-5 w-5 mr-2 text-gray-500" />
          Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
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
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <select
              id="source"
              name="source"
              value={filters.source}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="">All Sources</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social_media">Social Media</option>
              <option value="email_campaign">Email Campaign</option>
              <option value="phone_inquiry">Phone Inquiry</option>
              <option value="partner">Partner</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              id="dateRange"
              name="dateRange"
              value={filters.dateRange}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          
          <div>
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
              <option value="name:asc">Name (A-Z)</option>
              <option value="name:desc">Name (Z-A)</option>
              <option value="budget:desc">Budget (High to Low)</option>
              <option value="budget:asc">Budget (Low to High)</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              dispatch(setFilters(initialFilters));
              setCurrentPage(1);
              dispatch(fetchLeads({ page: 1, filters: initialFilters }));
            }}
            className="btn-outline mr-2"
          >
            Reset Filters
          </button>
          <button
            type="button"
            onClick={() => dispatch(fetchLeads({ page: currentPage, filters }))}
            className="btn-outline flex items-center"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading.leads ? (
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex space-x-4 p-4 border-b border-gray-200">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No leads found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No leads match your current filters. Try changing your filters or create a new lead.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleCreateLead}
                className="btn-primary flex items-center mx-auto"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Lead
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {leads.map((lead) => (
              <li key={lead._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UserIcon className="h-10 w-10 rounded-full bg-gray-100 p-2 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-primary-600">{lead.name}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <EnvelopeIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedLeadId(lead._id)}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditLead(lead)}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead._id)}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-red-600 focus:outline-none"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <PhoneIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {lead.phone || 'No phone'}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <TagIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {lead.source || 'Unknown source'}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <p>
                        Created on{' '}
                        <time dateTime={lead.createdAt}>
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </time>
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                        lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                        lead.status === 'proposal' ? 'bg-purple-100 text-purple-800' :
                        lead.status === 'negotiation' ? 'bg-indigo-100 text-indigo-800' :
                        lead.status === 'won' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </div>
                    {lead.budget && (
                      <div className="text-sm font-medium text-gray-900">
                        Budget: ₹{lead.budget.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

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
        </>
      )}
    </div>
  );
};

export default MyLeads;
