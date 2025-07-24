import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RequireAuth from '../auth/RequireAuth';

const WalletsAdmin = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [txnPage, setTxnPage] = useState(1);
  const [txnTotalPages, setTxnTotalPages] = useState(1);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [newCredit, setNewCredit] = useState('');
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [txnType, setTxnType] = useState('credit');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnDesc, setTxnDesc] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const pageSize = 10;

  useEffect(() => {
    fetchWallets();
    // eslint-disable-next-line
  }, [page, search]);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/wallet?page=${page}&limit=${pageSize}&search=${encodeURIComponent(search)}`);
      setWallets(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch wallets');
    }
    setLoading(false);
  };

  const openTransactions = async (wallet) => {
    setSelectedWallet(wallet);
    setShowTransactions(true);
    fetchTransactions(wallet.user._id, 1);
  };

  const fetchTransactions = async (userId, pageNum = 1) => {
    try {
      const res = await axios.get(`/api/wallet/${userId}/transactions?page=${pageNum}&limit=10`);
      setTransactions(res.data.data);
      setTxnTotalPages(res.data.pagination.totalPages);
      setTxnPage(pageNum);
    } catch (err) {
      setTransactions([]);
    }
  };

  const openCreditModal = (wallet) => {
    setSelectedWallet(wallet);
    setNewCredit(wallet.creditLimit);
    setShowCreditModal(true);
  };

  const handleUpdateCredit = async () => {
    try {
      await axios.put(`/api/wallet/${selectedWallet.user._id}/credit-limit`, { creditLimit: Number(newCredit) });
      setShowCreditModal(false);
      fetchWallets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update credit limit');
    }
  };

  const openTxnModal = (wallet) => {
    setSelectedWallet(wallet);
    setTxnType('credit');
    setTxnAmount('');
    setTxnDesc('');
    setTxnRef('');
    setShowTxnModal(true);
  };

  const handleAddTransaction = async () => {
    try {
      await axios.post(`/api/wallet/${selectedWallet.user._id}/transaction`, {
        type: txnType,
        amount: Number(txnAmount),
        description: txnDesc,
        reference: txnRef
      });
      setShowTxnModal(false);
      fetchWallets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add transaction');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <RequireAuth allowedRoles={['admin', 'sales']}>
      <div className="max-w-5xl mx-auto p-8">
        <h2 className="text-2xl font-bold mb-6">Agent Wallets</h2>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <input
            className="form-input mb-2 sm:mb-0 sm:w-1/3"
            type="text"
            placeholder="Search by agent name, email, or company"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Agent</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Company</th>
                <th className="px-4 py-2 border">Balance</th>
                <th className="px-4 py-2 border">Credit Limit</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {wallets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">No wallets found.</td>
                </tr>
              ) : (
                wallets.map((wallet, idx) => (
                  <tr key={wallet._id}>
                    <td className="px-4 py-2 border">{wallet.user?.name}</td>
                    <td className="px-4 py-2 border">{wallet.user?.email}</td>
                    <td className="px-4 py-2 border">{wallet.user?.companyName || '-'}</td>
                    <td className="px-4 py-2 border font-semibold">₹{wallet.balance.toLocaleString()}</td>
                    <td className="px-4 py-2 border">₹{wallet.creditLimit.toLocaleString()}</td>
                    <td className="px-4 py-2 border space-x-2">
                      <button className="btn-outline px-2 py-1" onClick={() => openTransactions(wallet)}>View Txns</button>
                      <button className="btn-outline px-2 py-1" onClick={() => openCreditModal(wallet)}>Update Credit</button>
                      <button className="btn-outline px-2 py-1" onClick={() => openTxnModal(wallet)}>Add Txn</button>
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

        {/* Transactions Modal */}
        {showTransactions && selectedWallet && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
              <h3 className="text-lg font-bold mb-2">Transactions for {selectedWallet.user?.name}</h3>
              <div className="overflow-x-auto mb-4">
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
              {/* Pagination for transactions */}
              {txnTotalPages > 1 && (
                <div className="flex justify-center mt-2 space-x-2">
                  <button
                    className="btn-outline"
                    onClick={() => fetchTransactions(selectedWallet.user._id, txnPage - 1)}
                    disabled={txnPage === 1}
                  >
                    Prev
                  </button>
                  <span className="px-2">Page {txnPage} of {txnTotalPages}</span>
                  <button
                    className="btn-outline"
                    onClick={() => fetchTransactions(selectedWallet.user._id, txnPage + 1)}
                    disabled={txnPage === txnTotalPages}
                  >
                    Next
                  </button>
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button className="btn-outline" onClick={() => setShowTransactions(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Credit Limit Modal */}
        {showCreditModal && selectedWallet && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-bold mb-2">Update Credit Limit for {selectedWallet.user?.name}</h3>
              <input
                className="form-input mb-4 w-full"
                type="number"
                min="0"
                value={newCredit}
                onChange={e => setNewCredit(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <button className="btn-outline" onClick={() => setShowCreditModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleUpdateCredit}>Update</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Transaction Modal */}
        {showTxnModal && selectedWallet && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-bold mb-2">Add Transaction for {selectedWallet.user?.name}</h3>
              <div className="mb-2">
                <label className="block text-sm mb-1">Type</label>
                <select className="form-input w-full" value={txnType} onChange={e => setTxnType(e.target.value)}>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm mb-1">Amount</label>
                <input className="form-input w-full" type="number" min="1" value={txnAmount} onChange={e => setTxnAmount(e.target.value)} />
              </div>
              <div className="mb-2">
                <label className="block text-sm mb-1">Description</label>
                <input className="form-input w-full" type="text" value={txnDesc} onChange={e => setTxnDesc(e.target.value)} />
              </div>
              <div className="mb-4">
                <label className="block text-sm mb-1">Reference (optional)</label>
                <input className="form-input w-full" type="text" value={txnRef} onChange={e => setTxnRef(e.target.value)} />
              </div>
              <div className="flex justify-end space-x-2">
                <button className="btn-outline" onClick={() => setShowTxnModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleAddTransaction}>Add</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
};

export default WalletsAdmin;
