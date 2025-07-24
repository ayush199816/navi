import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getQuotes } from '../../redux/slices/quoteSlice';
import { createSalesLead } from '../../redux/slices/salesLeadSlice';
import { fetchUsersByRole } from '../../utils/userUtils';

const ConvertQuoteToLeadModal = ({ isOpen, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [selectedQuote, setSelectedQuote] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');
  const [quotes, setQuotes] = useState([]);
  const [salesTeam, setSalesTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch quotes and sales team members when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch all quotes that don't have leads yet
        // First, get all statuses except 'converted_to_lead' and 'rejected'
        const quotesResponse = await dispatch(
          getQuotes({ 
            hasLead: false,
            limit: 100 // Increase limit to get more quotes
          })
        );
        
        // Filter out converted_to_lead and rejected quotes on the client side
        if (quotesResponse.payload && Array.isArray(quotesResponse.payload.data)) {
          quotesResponse.payload.data = quotesResponse.payload.data.filter(
            quote => !['converted_to_lead', 'rejected'].includes(quote.status)
          );
        }
        
        // Extract quotes from the response
        const validQuotes = Array.isArray(quotesResponse.payload?.data) 
          ? quotesResponse.payload.data 
          : [];
        
        // Fetch sales team members
        const salesTeamMembers = await fetchUsersByRole('sales');
        
        setQuotes(validQuotes);
        setSalesTeam(salesTeamMembers);
        
        // Set default assignment to current user if available
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && (user.role === 'sales' || user.role === 'admin' || user.role === 'operations')) {
          setAssignedTo(user._id);
        } else if (salesTeamMembers.length > 0) {
          setAssignedTo(salesTeamMembers[0]._id);
        }
        
        if (validQuotes.length === 0) {
          setError('No pending quotes available to convert to leads.');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedQuote) {
      setError('Please select a quote to convert');
      return;
    }
    
    try {
      await dispatch(createSalesLead({
        quoteId: selectedQuote,
        assignedTo,
        priority,
        notes: notes || undefined
      })).unwrap();
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create sales lead');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Convert Quote to Lead</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading data...</p>
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No pending quotes available to convert to leads.</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Quote
                  </label>
                  <select
                    value={selectedQuote}
                    onChange={(e) => setSelectedQuote(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">-- Select a quote --</option>
                    {quotes.map((quote) => (
                      <option key={quote._id} value={quote._id}>
                        {quote.quoteId} - {quote.customerName} - {quote.destination}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    {salesTeam.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    className="w-full p-2 border rounded"
                    placeholder="Add any notes about this lead..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={!selectedQuote}
                  >
                    Create Lead
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConvertQuoteToLeadModal;
