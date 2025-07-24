import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import RequireAuth from '../auth/RequireAuth';

const AccountsAgentApprovals = () => {
  const { user } = useSelector((state) => state.auth);
  const [pendingAgents, setPendingAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionModal, setRejectionModal] = useState({ open: false, agentId: null });
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingAgents();
    // eslint-disable-next-line
  }, []);

  const fetchPendingAgents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users/pending-approvals');
      setPendingAgents(res.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending agents');
    }
    setLoading(false);
  };

  const handleApprove = async (agentId) => {
    setActionLoading(true);
    try {
      await axios.put(`/api/users/${agentId}/approval`, { isApproved: true });
      fetchPendingAgents();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    }
    setActionLoading(false);
  };

  const openRejectModal = (agentId) => {
    setRejectionModal({ open: true, agentId });
    setRejectionReason('');
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await axios.put(`/api/users/${rejectionModal.agentId}/approval`, {
        isApproved: false,
        rejectionReason
      });
      setRejectionModal({ open: false, agentId: null });
      fetchPendingAgents();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    }
    setActionLoading(false);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <RequireAuth allowedRoles={['accounts', 'admin']}>
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Pending Agent Approvals</h2>
        {pendingAgents.length === 0 ? (
          <div className="text-gray-500">No agents pending approval.</div>
        ) : (
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Phone</th>
                <th className="px-4 py-2 border">Agency</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingAgents.map((agent) => (
                <tr key={agent._id}>
                  <td className="px-4 py-2 border">{agent.name}</td>
                  <td className="px-4 py-2 border">{agent.email}</td>
                  <td className="px-4 py-2 border">{agent.phone}</td>
                  <td className="px-4 py-2 border">{agent.companyName || agent.agencyName}</td>
                  <td className="px-4 py-2 border space-x-2">
                    <button
                      className="btn-primary px-3 py-1"
                      disabled={actionLoading}
                      onClick={() => handleApprove(agent._id)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-outline px-3 py-1"
                      disabled={actionLoading}
                      onClick={() => openRejectModal(agent._id)}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Rejection Modal */}
        {rejectionModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-bold mb-2">Reject Agent</h3>
              <textarea
                className="w-full border rounded p-2 mb-4"
                rows={3}
                placeholder="Enter rejection reason"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <button
                  className="btn-outline"
                  onClick={() => setRejectionModal({ open: false, agentId: null })}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
};

export default AccountsAgentApprovals;
