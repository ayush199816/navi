import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className = ''
}) => {
  const pageNumbers = [];
  const maxVisiblePages = 5; // Maximum number of page buttons to show at once
  let startPage, endPage;

  if (totalPages <= maxVisiblePages) {
    // Less than maxVisiblePages: show all pages
    startPage = 1;
    endPage = totalPages;
  } else {
    // More than maxVisiblePages: calculate start and end pages
    const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
    const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;
    
    if (currentPage <= maxPagesBeforeCurrent) {
      // Near the beginning
      startPage = 1;
      endPage = maxVisiblePages;
    } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
      // Near the end
      startPage = totalPages - maxVisiblePages + 1;
      endPage = totalPages;
    } else {
      // Somewhere in the middle
      startPage = currentPage - maxPagesBeforeCurrent;
      endPage = currentPage + maxPagesAfterCurrent;
    }
  }

  // Generate page numbers
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className={`flex items-center justify-between px-4 py-3 sm:px-6 ${className}`}>
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
            currentPage === totalPages 
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
            Showing <span className="font-medium">
              {Math.min((currentPage - 1) * 10 + 1, totalPages * 10)}
            </span> to <span className="font-medium">
              {Math.min(currentPage * 10, totalPages * 10)}
            </span> of <span className="font-medium">
              {totalPages * 10}
            </span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === 1 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* First page */}
            {startPage > 1 && (
              <>
                <button
                  onClick={() => onPageChange(1)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1 
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  1
                </button>
                {startPage > 2 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                )}
              </>
            )}

            {/* Page numbers */}
            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => onPageChange(number)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  currentPage === number
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {number}
              </button>
            ))}

            {/* Last page */}
            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                )}
                <button
                  onClick={() => onPageChange(totalPages)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages 
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === totalPages 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
