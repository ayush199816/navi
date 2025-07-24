import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import RequireAuth from '../../components/RequireAuth';
import WalletTransactionsTable from '../../components/WalletTransactionsTable';

const WalletTransactions = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('all');

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get('/api/users?role=agent');
        if (response.data.success) {
          setAgents(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError(err.response?.data?.message || 'Failed to load agents');
        toast.error('Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  return (
    <RequireAuth allowedRoles={['admin', 'operations']}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Wallet Transactions</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <label htmlFor="agentFilter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Agent
          </label>
          <div className="flex space-x-4 items-center">
            <select
              id="agentFilter"
              className="mt-1 block w-full max-w-xs border border-gray-300 rounded-md shadow-sm py-2 px-3"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              <option value="all">All Agents</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
            <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
            <p className="mt-1 text-sm text-gray-500">
              Detailed view of all wallet transactions including claim payments
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <p>Loading transactions...</p>
            </div>
          ) : (
            <div className="px-4 py-5 sm:p-6">
              {selectedAgentId === 'all' ? (
                <div className="space-y-8">
                  {agents.map(agent => (
                    <div key={agent._id} className="border-b pb-6 last:border-b-0 last:pb-0">
                      <h4 className="font-medium text-lg mb-3">{agent.name}'s Transactions</h4>
                      <WalletTransactionsTable userId={agent._id} isAdmin={true} />
                    </div>
                  ))}
                </div>
              ) : (
                <WalletTransactionsTable userId={selectedAgentId} isAdmin={true} />
              )}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
};

export default WalletTransactions;
