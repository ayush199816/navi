import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchSalesLeads, 
  fetchSalesLead,
  createSalesLead,
  updateSalesLead,
  deleteSalesLead,
  resetCurrentLead,
  setFilters as setSalesFilters,
  setPagination as setSalesPagination
} from '../../../redux/slices/salesLeadSlice';
import { openModal, closeModal } from '../../../redux/slices/uiSlice';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import LeadSearch from '../../agent/leads/components/LeadSearch';
// Import the modal component
import Modal from '../../../components/modals/Modal';
import SalesLeadDetail from './components/SalesLeadDetail';
import { toast } from 'react-toastify';

const SalesLeads = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const leadsState = useSelector((state) => state.salesLeads);
  console.log('Redux salesLeads state:', leadsState);
  
  const leads = leadsState?.leads || [];
  const loading = leadsState?.loading || false;
  const error = leadsState?.error;
  const currentLead = leadsState?.currentLead;
  
  console.log('Leads data:', leads);
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    assignedTo: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [selectedLead, setSelectedLead] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10
  });

  // Fetch leads on component mount and when filters/pagination change
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Dispatching fetchSalesLeads with:', { ...filters, ...pagination });
        const result = await dispatch(fetchSalesLeads({ ...filters, ...pagination }));
        console.log('fetchSalesLeads result:', result);
      } catch (err) {
        console.error('Error fetching sales leads:', err);
      }
    };
    
    fetchData();
  }, [dispatch, JSON.stringify(filters), pagination.page, pagination.limit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetCurrentLead());
    };
  }, [dispatch]);

  const handleViewLead = (lead) => {
    dispatch(openModal({
      modalType: 'VIEW_LEAD',
      modalData: {
        lead,
        onClose: () => dispatch(closeModal()),
        onUpdate: () => {
          dispatch(fetchSalesLeads({ ...filters, ...pagination }));
          dispatch(closeModal());
        }
      }
    }));
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await dispatch(updateSalesLead({ id: leadId, status: newStatus })).unwrap();
      toast.success('Lead status updated successfully');
      dispatch(fetchSalesLeads({ ...filters, ...pagination }));
    } catch (error) {
      toast.error(error || 'Failed to update lead status');
    }
  };

  const handleAssignLead = async (leadId, agentId) => {
    try {
      await dispatch(updateSalesLead({ id: leadId, assignedTo: agentId })).unwrap();
      toast.success('Lead assigned successfully');
      dispatch(fetchSalesLeads({ ...filters, ...pagination }));
    } catch (error) {
      toast.error(error || 'Failed to assign lead');
    }
  };

  const handleCreateLead = async (leadData) => {
    try {
      await dispatch(createSalesLead(leadData)).unwrap();
      toast.success('Lead created successfully');
      dispatch(fetchSalesLeads({ ...filters, ...pagination }));
      navigate('/sales/leads');
    } catch (error) {
      toast.error(error || 'Failed to create lead');
    }
  };

  const handleEditLead = (lead) => {
    navigate(`/sales/leads/edit/${lead._id}`, { state: { lead } });
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await dispatch(deleteSalesLead(leadId)).unwrap();
        toast.success('Lead deleted successfully');
        dispatch(fetchSalesLeads({ ...filters, ...pagination }));
      } catch (error) {
        toast.error(error || 'Failed to delete lead');
      }
    }
  };

  if (loading && (!leads || leads.length === 0)) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Sales Leads</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error loading leads: {error.leads}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Leads</h1>
        <button
          onClick={handleCreateLead}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Lead
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <LeadSearch 
          currentFilters={filters}
          onSearch={() => setPagination(prev => ({ ...prev, page: 1 }))}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Travel Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(leads) && leads.length > 0 ? leads.map((lead) => {
                console.log('Rendering lead:', lead);
                return (
                <tr key={lead._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {lead.quote?.quoteId || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {lead.agent?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {lead.quote?.itinerary?.destinations?.map(d => d.name).join(', ') || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {lead.assignedTo?.name || 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {lead.quote?.travelDate ? new Date(lead.quote.travelDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                      lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewLead(lead)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEditLead(lead)}
                      className="text-yellow-600 hover:text-yellow-900 mr-4"
                      title="Edit Lead"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLead(lead._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Lead"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              )}) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Modal is handled by the global Modal component */}
    </div>
  );
};

export default SalesLeads;
