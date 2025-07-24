import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { fetchSalesLead, updateSalesLead } from '../../../redux/slices/salesLeadSlice';
import { toast } from 'react-toastify';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const EditLead = () => {
  const { leadId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get lead from location state or fetch it
  const leadFromState = location.state?.lead;
  const { currentLead, loading, error } = useSelector(state => state.salesLeads);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    status: 'new',
    source: '',
    notes: '',
    assignedTo: ''
  });

  // Set initial form data
  useEffect(() => {
    if (leadFromState) {
      setFormData({
        customerName: leadFromState.customerName || '',
        customerEmail: leadFromState.customerEmail || '',
        customerPhone: leadFromState.customerPhone || '',
        status: leadFromState.status || 'new',
        source: leadFromState.source || '',
        notes: leadFromState.notes || '',
        assignedTo: leadFromState.assignedTo?._id || ''
      });
    } else if (leadId && currentLead?._id === leadId) {
      setFormData({
        customerName: currentLead.customerName || '',
        customerEmail: currentLead.customerEmail || '',
        customerPhone: currentLead.customerPhone || '',
        status: currentLead.status || 'new',
        source: currentLead.source || '',
        notes: currentLead.notes || '',
        assignedTo: currentLead.assignedTo?._id || ''
      });
    }
  }, [leadFromState, currentLead, leadId]);

  // Fetch lead if not in state
  useEffect(() => {
    if (leadId && !leadFromState) {
      dispatch(fetchSalesLead(leadId)).unwrap().catch(error => {
        toast.error(error || 'Failed to load lead');
        navigate('/sales/leads');
      });
    }
  }, [dispatch, leadId, leadFromState, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateSalesLead({ id: leadId, ...formData })).unwrap();
      toast.success('Lead updated successfully');
      navigate('/sales/leads');
    } catch (error) {
      toast.error(error || 'Failed to update lead');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Edit Lead</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Source
              </label>
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/sales/leads')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Update Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLead;
