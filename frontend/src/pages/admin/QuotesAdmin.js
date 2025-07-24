import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import RequireAuth from '../auth/RequireAuth';
import { EyeIcon } from '@heroicons/react/24/outline';
import QuoteDetailModal from '../../components/QuoteDetailModal';
import AIItineraryGenerator from '../../components/AIItineraryGenerator';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const QuotesAdmin = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [aiModalOpen, setAIModalOpen] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    fetchQuotes();
    // eslint-disable-next-line
  }, [page, search, status]);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      let url = `/quotes?page=${page}&limit=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;
      const res = await api.get(url);
      setQuotes(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch quotes');
    }
    setLoading(false);
  };

  const handleView = (quote) => {
    setSelectedQuote(quote);
    setAdminResponse(quote.response || '');
    setShowViewModal(true);
  };

  const handleQuoteAction = async (action) => {
    if (!selectedQuote) return;
    setActionLoading(true);
    try {
      let payload = {};
      
      // Ensure discussion is an array
      const currentDiscussion = Array.isArray(selectedQuote.discussion) ? selectedQuote.discussion : [];
      
      if (action === 'respond') {
        // Add response to discussion history
        payload = { 
          response: adminResponse,
          discussion: [...currentDiscussion, {
            message: adminResponse,
            timestamp: new Date(),
            user: localStorage.getItem('userName') || 'Operations',
            type: 'response'
          }]
        };
      } else {
        // Status change (accept/reject)
        payload = { 
          status: action,
          discussion: [...currentDiscussion, {
            message: `Quote status changed to ${action}`,
            timestamp: new Date(),
            user: localStorage.getItem('userName') || 'Operations',
            type: 'status_change'
          }]
        };
      }
      
      const response = await api.put(`/quotes/${selectedQuote._id}`, payload);
      toast.success('Quote updated!');
      
      // Update the selected quote with the new data
      if (response.data && response.data.data) {
        setSelectedQuote(response.data.data);
        // Don't close the modal, so user can see the response
        if (action === 'respond') {
          // Clear the response input field
          setAdminResponse('');
        } else {
          // Close modal for accept/reject actions
          setShowViewModal(false);
          setSelectedQuote(null);
        }
      } else {
        setShowViewModal(false);
        setSelectedQuote(null);
      }
      
      // Refresh the quotes list
      fetchQuotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update quote');
    }
    setActionLoading(false);
  };

  // Attach AI itinerary to quote
  const handleAttachItinerary = async (itinerary) => {
    if (!selectedQuote) return;
    setActionLoading(true);
    try {
      // Ensure discussion is an array
      const currentDiscussion = Array.isArray(selectedQuote.discussion) ? selectedQuote.discussion : [];
      
      // Add the itinerary and record it in the discussion history
      const payload = {
        itinerary,
        discussion: [...currentDiscussion, {
          message: `AI-generated itinerary attached`,
          timestamp: new Date(),
          user: localStorage.getItem('userName') || 'Operations',
          type: 'system'
        }]
      };
      
      const response = await api.put(`/quotes/${selectedQuote._id}`, payload);
      toast.success('Itinerary attached!');
      
      // Update the selected quote with the new data to show the itinerary immediately
      if (response.data && response.data.data) {
        setSelectedQuote(response.data.data);
        setAIModalOpen(false); // Close the AI modal but keep the quote modal open
      } else {
        setShowViewModal(false);
        setSelectedQuote(null);
      }
      
      // Refresh the quotes list
      fetchQuotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to attach itinerary');
    }
    setActionLoading(false);
  };


  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <RequireAuth allowedRoles={['admin', 'operations']}>
      <div className="max-w-7xl mx-auto p-8">
        <h2 className="text-2xl font-bold mb-6">All Quotes</h2>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <input
            className="form-input sm:w-1/3"
            type="text"
            placeholder="Search by agent, customer, destination"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="form-input sm:w-1/5"
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Quote ID</th>
                <th className="px-4 py-2 border">Agent</th>
                <th className="px-4 py-2 border">Customer</th>
                <th className="px-4 py-2 border">Destination</th>
                <th className="px-4 py-2 border">Dates</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Amount</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">No quotes found.</td>
                </tr>
              ) : (
                quotes.map(qt => (
                  <tr key={qt._id}>
                    <td className="px-4 py-2 border font-mono">{qt.quoteId || qt._id.slice(-6)}</td>
                    <td className="px-4 py-2 border">{qt.agent?.name || '-'}</td>
                    <td className="px-4 py-2 border">{qt.customerName || '-'}</td>
                    <td className="px-4 py-2 border">{qt.destination}</td>
                    <td className="px-4 py-2 border">
                      {qt.travelDates?.startDate ? new Date(qt.travelDates.startDate).toLocaleDateString() : ''} - 
                      {qt.travelDates?.endDate ? new Date(qt.travelDates.endDate).toLocaleDateString() : ''}
                    </td>
                    <td className="px-4 py-2 border capitalize">{qt.status}</td>
                    <td className="px-4 py-2 border">₹{(qt.quotedPrice || qt.totalAmount || 0).toLocaleString()}</td>
                    <td className="px-4 py-2 border">
                      <button className="btn-outline px-2 py-1 flex items-center gap-1" onClick={() => handleView(qt)}>
                        <EyeIcon className="w-4 h-4" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            <button
              className="btn-outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <button
              className="btn-outline"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
        {/* View Quote Modal placeholder */}
        {/* Polished Quote Detail Modal */}
        <QuoteDetailModal
          open={showViewModal}
          onClose={() => setShowViewModal(false)}
          quote={selectedQuote}
          isAdmin={true}
        >
          {/* Admin/ops actions */}
          {selectedQuote && (
            <div className="mt-4 space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1">Response/Notes</label>
                <textarea
                  className="form-input w-full"
                  rows={2}
                  value={adminResponse}
                  onChange={e => setAdminResponse(e.target.value)}
                  disabled={actionLoading}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  className="btn-outline"
                  onClick={() => handleQuoteAction('accepted')}
                  disabled={actionLoading}
                >Accept</button>
                <button
                  className="btn-outline"
                  onClick={() => handleQuoteAction('rejected')}
                  disabled={actionLoading}
                >Reject</button>
                <button
                  className="btn-primary"
                  onClick={() => handleQuoteAction('respond')}
                  disabled={actionLoading || !adminResponse}
                >Add Response</button>
                <button
                  className="btn-secondary"
                  onClick={() => setAIModalOpen(true)}
                  disabled={actionLoading}
                >Generate AI Itinerary</button>
              </div>
            </div>
          )}
          {/* AI Itinerary Generator Modal */}
          {aiModalOpen && (
            <AIItineraryGenerator
              open={aiModalOpen}
              onClose={() => setAIModalOpen(false)}
              defaultDestination={selectedQuote?.destination || ''}
              defaultDates={selectedQuote?.travelDates || {}}
              defaultPreferences={selectedQuote?.requirements || ''}
              onItineraryGenerated={handleAttachItinerary}
            />
          )}
        </QuoteDetailModal>
        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    </RequireAuth>
  );
};

export default QuotesAdmin;
