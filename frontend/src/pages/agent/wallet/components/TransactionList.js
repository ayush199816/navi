import React from 'react';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  ShoppingBagIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const TransactionList = ({ transactions, loading, pagination, currentPage, onPageChange }) => {
  // Status badge component
  const StatusBadge = ({ status }) => {
    let badgeClass = '';
    let icon = null;
    
    switch (status) {
      case 'pending':
        badgeClass = 'bg-yellow-100 text-yellow-800';
        icon = <ClockIcon className="h-4 w-4 mr-1" />;
        break;
      case 'completed':
        badgeClass = 'bg-green-100 text-green-800';
        icon = <CheckCircleIcon className="h-4 w-4 mr-1" />;
        break;
      case 'failed':
        badgeClass = 'bg-red-100 text-red-800';
        icon = <XCircleIcon className="h-4 w-4 mr-1" />;
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800';
        icon = <ClockIcon className="h-4 w-4 mr-1" />;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Transaction type icon component
  const TransactionTypeIcon = ({ type }) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpIcon className="h-5 w-5 text-green-500" />;
      case 'withdrawal':
        return <ArrowDownIcon className="h-5 w-5 text-red-500" />;
      case 'booking':
        return <ShoppingBagIcon className="h-5 w-5 text-blue-500" />;
      case 'refund':
        return <ArrowPathIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <ArrowPathIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="animate-pulse p-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex space-x-4 py-3 border-b border-gray-200">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <ArrowPathIcon className="h-12 w-12 text-gray-400 mx-auto" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No transactions found</h3>
        <p className="mt-1 text-gray-500">
          You don't have any transactions matching your filters. Try changing your filters or add funds to your wallet.
        </p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      case 'booking':
        return 'Booking Payment';
      case 'refund':
        return 'Refund';
      default:
        return 'Transaction';
    }
  };

  return (
    <div>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <li key={transaction._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <TransactionTypeIcon type={transaction.type} />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {getTransactionTypeLabel(transaction.type)}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <StatusBadge status={transaction.status} />
                  </div>
                </div>
                
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <span className="truncate">
                        {transaction.description}
                        {transaction.reference && ` • Ref: ${transaction.reference}`}
                      </span>
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm sm:mt-0">
                    <p className={`font-medium ${
                      transaction.type === 'deposit' || transaction.type === 'refund' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}
                      ₹{transaction.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  {formatDate(transaction.createdAt)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === pagination.pages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === pagination.pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * 10, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {[...Array(pagination.pages)].map((_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === pagination.pages
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
