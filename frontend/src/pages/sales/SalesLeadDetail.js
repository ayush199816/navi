import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchSalesLead, 
  updateSalesLead, 
  addSalesLeadNote,
  resetCurrentLead
} from '../../redux/slices/salesLeadSlice';
import { statusBadges, priorityBadges, formatDate } from '../../utils/statusHelpers';

const SalesLeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentLead, loading, error } = useSelector((state) => state.salesLeads);
  
  const [note, setNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    nextFollowUp: ''
  });

  // Fetch lead data
  useEffect(() => {
    if (id) {
      dispatch(fetchSalesLead(id));
    }
    
    return () => {
      dispatch(resetCurrentLead());
    };
  }, [dispatch, id]);

  // Update form data when currentLead changes
  useEffect(() => {
    if (currentLead) {
      setFormData({
        status: currentLead.status,
        priority: currentLead.priority,
        assignedTo: currentLead.assignedTo?._id || '',
        nextFollowUp: currentLead.nextFollowUp ? new Date(currentLead.nextFollowUp).toISOString().split('T')[0] : ''
      });
    }
  }, [currentLead]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateSalesLead({ id, ...formData }));
    setIsEditing(false);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (note.trim()) {
      dispatch(addSalesLeadNote({ id, content: note }));
      setNote('');
    }
  };

  if (loading && !currentLead) {
    return <div className="p-8 text-center">Loading lead details...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  if (!currentLead) {
    return <div className="p-8 text-center">Lead not found</div>;
  }

  const { quote, notes = [], lastContacted, createdAt, createdBy, updatedAt, updatedBy } = currentLead;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Lead: {quote?.customerName}</h1>
        <div className="space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {isEditing ? 'Cancel' : 'Edit Lead'}
          </button>
          <button
            onClick={() => navigate('/sales/leads')}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            Back to Leads
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Lead Information</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadges[formData.status]?.bgColor} ${statusBadges[formData.status]?.textColor}`}>
                {statusBadges[formData.status]?.label || formData.status}
              </span>
            </div>
            
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal_sent">Proposal Sent</option>
                      <option value="negotiation">In Negotiation</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up</label>
                    <input
                      type="date"
                      name="nextFollowUp"
                      value={formData.nextFollowUp}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadges[formData.status]?.bgColor} ${statusBadges[formData.status]?.textColor}`}>
                      {statusBadges[formData.status]?.label || formData.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className="font-medium">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityBadges[formData.priority]?.bgColor} ${priorityBadges[formData.priority]?.textColor}`}>
                      {priorityBadges[formData.priority]?.label || formData.priority}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Contact</p>
                  <p className="font-medium">{formatDate(lastContacted || createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Next Follow-up</p>
                  <p className="font-medium">{formData.nextFollowUp ? formatDate(formData.nextFollowUp) : 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium">{currentLead.assignedTo?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lead Value</p>
                  <p className="font-medium">₹{currentLead.value?.toLocaleString() || '0'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quote Details */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quote Details</h2>
            {quote ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer Name</p>
                  <p className="font-medium">{quote.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{quote.customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{quote.customerPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="font-medium">{quote.destination}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Travel Dates</p>
                  <p className="font-medium">
                    {quote.travelDates?.startDate ? (
                      <>
                        {new Date(quote.travelDates.startDate).toLocaleDateString()} -{' '}
                        {quote.travelDates.endDate && new Date(quote.travelDates.endDate).toLocaleDateString()}
                      </>
                    ) : (
                      'Flexible'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-medium">₹{quote.totalAmount?.toLocaleString() || '0'}</p>
                </div>
                {quote.requirements && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Requirements</p>
                    <p className="font-medium whitespace-pre-line">{quote.requirements}</p>
                  </div>
                )}
              </div>
            ) : (
              <p>No quote details available</p>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <form onSubmit={handleAddNote} className="mb-6">
              <div className="flex">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 p-2 border rounded-l focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </form>
            <div className="space-y-4">
              {notes.length > 0 ? (
                notes.map((note, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>{note.createdBy?.name || 'System'}</span>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-line">{note.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No notes yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Activity */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Activity</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">{formatDate(createdAt)}</p>
                <p className="text-xs text-gray-500">by {createdBy?.name || 'System'}</p>
              </div>
              {updatedAt && updatedBy && (
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">{formatDate(updatedAt)}</p>
                  <p className="text-xs text-gray-500">by {updatedBy.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/quotes/${quote?._id}`)}
                className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
              >
                View Full Quote
              </button>
              <button
                onClick={() => navigate(`/quotes/${quote?._id}/edit`)}
                className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
              >
                Edit Quote
              </button>
              <button
                onClick={() => {}}
                className="w-full text-left px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded"
              >
                Convert to Booking
              </button>
              <button
                onClick={() => {}}
                className="w-full text-left px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded"
              >
                Send Proposal
              </button>
              <button
                onClick={() => {}}
                className="w-full text-left px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded"
              >
                Mark as Lost
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesLeadDetail;
