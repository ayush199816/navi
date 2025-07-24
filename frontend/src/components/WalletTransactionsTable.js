import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const WalletTransactionsTable = ({ userId, isAdmin = false }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/wallets/${userId}/transactions`, {
          params: { page, limit: 10 }
        });
        
        if (response.data.success) {
          setTransactions(response.data.data);
          setTotalPages(response.data.pagination.totalPages || 1);
        }
      } catch (err) {
        console.error('Error fetching wallet transactions:', err);
        setError(err.response?.data?.message || 'Failed to load transactions');
        toast.error('Failed to load wallet transactions');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchTransactions();
    }
  }, [userId, page]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
  };

  if (loading) {
    return <div className="text-center py-4">Loading transactions...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (!transactions || transactions.length === 0) {
    return <div className="text-center py-4">No transactions found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            {isAdmin && (
              <>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROE
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Passenger
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Travel Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claim Date
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction._id} className="hover:bg-gray-50">
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                {formatDate(transaction.date)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  transaction.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {transaction.type}
                </span>
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                  ₹{transaction.amount.toLocaleString()}
                </span>
              </td>
              <td className="px-4 py-2 text-sm text-gray-900">
                {transaction.description}
              </td>
              {isAdmin && (
                <>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {transaction.reference || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {transaction.originalAmount ? `₹${transaction.originalAmount.toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {transaction.rateOfExchange || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {transaction.leadPaxName || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {transaction.travelDate ? formatDate(transaction.travelDate).split(',')[0] : 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {transaction.claimDate ? formatDate(transaction.claimDate).split(',')[0] : 'N/A'}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <button
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletTransactionsTable;
