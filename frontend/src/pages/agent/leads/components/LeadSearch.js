import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { setFilters, fetchLeads } from '../../../../redux/slices/leadSlice';

const LeadSearch = ({ currentFilters = {}, onSearch }) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize search term from currentFilters if it exists
  useEffect(() => {
    if (currentFilters?.search) {
      setSearchTerm(currentFilters.search);
    }
  }, [currentFilters]);

  const handleSearch = (e) => {
    e.preventDefault();
    const newFilters = { ...currentFilters, search: searchTerm };
    dispatch(setFilters(newFilters));
    dispatch(fetchLeads({ ...newFilters, page: 1 }));
    if (onSearch) onSearch();
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="flex rounded-md shadow-sm">
        <div className="relative flex-grow focus-within:z-10">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            name="search"
            id="search"
            className="form-input block w-full rounded-none rounded-l-md pl-10 sm:text-sm border-gray-300"
            placeholder="Search leads by name, email, or destination"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default LeadSearch;
