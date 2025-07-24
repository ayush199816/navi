import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  CurrencyRupeeIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { openModal } from '../../../redux/slices/uiSlice';
import { 
  fetchWalletDetails, 
  fetchTransactions, 
  setFilters, 
  resetFilters 
} from '../../../redux/slices/walletSlice';
import WalletSummary from './components/WalletSummary';
import TransactionList from './components/TransactionList';

const MyWallet = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { 
    wallet, 
    transactions, 
    pagination, 
    filters,
    loading 
  } = useSelector(state => state.wallet);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchWalletDetails());
    dispatch(fetchTransactions({ page: currentPage, filters }));
  }, [dispatch, currentPage]);

  // Refresh wallet data
  const refreshWalletData = () => {
    dispatch(fetchWalletDetails());
  };

  // Refresh transaction data
  const refreshTransactions = () => {
    dispatch(fetchTransactions({ page: currentPage, filters }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    dispatch(setFilters({ ...filters, [name]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    dispatch(fetchTransactions({ page, filters }));
  };

  const handleAddFunds = () => {
    dispatch(openModal({
      modalType: 'ADD_FUNDS',
      modalData: {
        onSuccess: refreshWalletData
      }
    }));
  };

  const handleWithdrawFunds = () => {
    dispatch(openModal({
      modalType: 'WITHDRAW_FUNDS',
      modalData: {
        maxAmount: wallet.balance,
        onSuccess: refreshWalletData
      }
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Wallet</h1>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleAddFunds}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Funds
          </button>
          <button
            type="button"
            onClick={handleWithdrawFunds}
            className="btn-outline flex items-center"
          >
            <ArrowDownIcon className="h-5 w-5 mr-2" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Wallet Summary */}
      <WalletSummary wallet={wallet} loading={loading} />

      {/* Transaction Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4 mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h2>
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-auto">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="booking">Bookings</option>
              <option value="refund">Refunds</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto">
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              id="dateRange"
              name="dateRange"
              value={filters.dateRange}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto">
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sortBy"
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="form-input"
            >
              <option value="date:desc">Newest First</option>
              <option value="date:asc">Oldest First</option>
              <option value="amount:desc">Amount (High to Low)</option>
              <option value="amount:asc">Amount (Low to High)</option>
            </select>
          </div>
          
          <div className="w-full sm:w-auto flex items-end">
            <button
              type="button"
              onClick={refreshTransactions}
              className="btn-outline flex items-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <TransactionList 
        transactions={transactions} 
        loading={loading} 
        pagination={pagination}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default MyWallet;
