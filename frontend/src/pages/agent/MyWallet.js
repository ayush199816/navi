import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import RequireAuth from '../../components/RequireAuth';

const MyWallet = () => {
  const { user } = useSelector((state) => state.auth);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchWallet();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (wallet) fetchTransactions();
    // eslint-disable-next-line
  }, [wallet, page]);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/wallets/my-wallet');
      setWallet(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch wallet');
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`/api/wallets/${wallet.user}/transactions?page=${page}&limit=${pageSize}`);
      setTransactions(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!wallet) return <div className="p-8 text-center">No wallet found.</div>;

  return (
    <RequireAuth allowedRoles={['agent']}>
      <div className="max-w-3xl mx-auto p-8">
        <h2 className="text-2xl font-bold mb-6">My Wallet</h2>
        <div className="bg-white rounded shadow p-6 mb-8 flex flex-col sm:flex-row sm:justify-between">
          <div>
            <div className="text-gray-500 text-sm">Wallet Balance</div>
            <div className="text-2xl font-bold text-primary-700">₹{wallet.balance.toLocaleString()}</div>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="text-gray-500 text-sm">Credit Limit</div>
            <div className="text-2xl font-bold text-blue-700">₹{wallet.creditLimit.toLocaleString()}</div>
          </div>
        </div>

        {/* Transaction Table */}
        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Type</th>
                <th className="px-4 py-2 border">Amount</th>
                <th className="px-4 py-2 border">Description</th>
                <th className="px-4 py-2 border">Reference</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">No transactions found.</td>
                </tr>
              ) : (
                transactions.map((txn, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 border">{new Date(txn.date).toLocaleDateString()}</td>
                    <td className={`px-4 py-2 border font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>{txn.type}</td>
                    <td className="px-4 py-2 border">₹{txn.amount.toLocaleString()}</td>
                    <td className="px-4 py-2 border">{txn.description}</td>
                    <td className="px-4 py-2 border">{txn.reference || '-'}</td>
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
      </div>
    </RequireAuth>
  );
};

export default MyWallet;
