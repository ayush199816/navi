import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { XMarkIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import { updateSalesLead } from '../../../../redux/slices/salesLeadSlice';
import { toast } from 'react-toastify';

const SalesLeadQuoteView = ({ lead, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    priority: '',
    notes: '',
    followUpDate: ''
  });
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.salesLeads);

  useEffect(() => {
    if (lead) {
      setFormData({
        status: lead.status || '',
        priority: lead.priority || 'medium',
        notes: lead.notes || '',
        followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : ''
      });
    }
  }, [lead]);

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
      await dispatch(updateSalesLead({
        id: lead._id,
        ...formData
      })).unwrap();
      
      toast.success('Lead updated successfully');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error || 'Failed to update lead');
    }
  };

  if (!lead) return null;

  console.log('Lead data in View:', lead);
  console.log('Quote data:', lead.quote);
  console.log('Itinerary data:', lead.quote?.itinerary);
  console.log('Destinations:', lead.quote?.itinerary?.destinations);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Lead Details - {lead.quoteId || lead.quote?._id || 'N/A'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quote Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Quote Information</h4>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Agent</p>
                <p className="mt-1 text-sm text-gray-900">
                  {lead.agent?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Destination</p>
                <p className="mt-1 text-sm text-gray-900">
                  {lead.quote?.itinerary?.destinations?.map(d => d.name).join(', ') || lead.quote?.destinations || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Travel Date</p>
                <p className="mt-1 text-sm text-gray-900">
                  {lead.quote?.travelDate ? new Date(lead.quote.travelDate).toLocaleDateString() : 
                    lead.quote?.itinerary?.startDate ? new Date(lead.quote.itinerary.startDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="mt-1 text-sm text-gray-900">
                  {lead.quote?.totalPrice ? `$${lead.quote.totalPrice.toLocaleString()}` : 
                    lead.quote?.totalAmount ? `$${lead.quote.totalAmount.toLocaleString()}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="mt-1 text-sm text-gray-900">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    lead.quote?.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    lead.quote?.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    lead.quote?.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    lead.quote?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {lead.quote?.status || 'N/A'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Sales Lead Information */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-gray-900">Sales Information</h4>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md flex items-center hover:bg-indigo-700 disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  {loading ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    id="followUpDate"
                    name="followUpDate"
                    value={formData.followUpDate}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="mt-1 text-sm text-gray-900">
                    <span className="capitalize">{lead.status || 'N/A'}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className="mt-1 text-sm text-gray-900 capitalize">
                    {lead.priority || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Follow-up Date</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                    {lead.notes || 'No notes available'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesLeadQuoteView;
