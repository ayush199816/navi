import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  fetchGuestSightseeings, 
  deleteGuestSightseeing,
  clearGuestSightseeingState,
  getGuestSightseeingById
} from '../../redux/slices/guestSightseeingSlice';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import SearchBox from '../../components/common/SearchBox';
import GuestSightseeingForm from './GuestSightseeingForm';

const GuestSightseeings = () => {
  console.log('GuestSightseeings component rendered');
  const dispatch = useDispatch();
  const store = useStore();
  const guestSightseeingsState = useSelector((state) => state.guestSightseeings);
  const { sightseeings = [], loading, error, success, total = 0, page = 1, pages = 1 } = guestSightseeingsState;
  
  // Debug log
  useEffect(() => {
    console.log('Redux State:', {
      sightseeings,
      loading,
      error,
      success,
      total,
      page,
      pages
    });
    
    if (error) {
      console.error('Error in Redux state:', error);
    }
  }, [sightseeings, loading, error, success, total, page, pages]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sightseeingToDelete, setSightseeingToDelete] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    sort: 'createdAt:desc'
  });
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSightseeing, setEditingSightseeing] = useState(null);

  useEffect(() => {
    const params = {
      page: currentPage,
      ...filters
    };
    
    console.log('Fetching guest sightseeings with params:', params);
    const promise = dispatch(fetchGuestSightseeings(params));
    
    promise.unwrap()
      .then(data => console.log('Fetched data:', data))
      .catch(err => console.error('Error fetching data:', err));
    
    return () => {
      dispatch(clearGuestSightseeingState());
    };
  }, [dispatch, currentPage, filters]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
    
    if (success) {
      toast.success('Operation completed successfully');
    }
  }, [error, success]);

  const handleSearch = (searchValue) => {
    // If searchValue is an event object (from form submission), prevent default
    if (searchValue && typeof searchValue.preventDefault === 'function') {
      searchValue.preventDefault();
      // Use the current searchTerm state
      searchValue = searchTerm;
    }
    
    setFilters(prev => ({
      ...prev,
      search: typeof searchValue === 'string' ? searchValue : ''
    }));
    setCurrentPage(1);
  };

  const handleEditClick = async (sightseeing) => {
    try {
      // First, fetch the full sightseeing details
      const response = await api.get(`/guest-sightseeing/${sightseeing._id}`);
      const fullSightseeing = response.data.data;
      
      // Log the full data for debugging
      console.log('Full sightseeing data:', fullSightseeing);
      
      // Create a clean copy of the full sightseeing data
      const sightseeingData = { ...fullSightseeing };
      
      // Only set defaults for fields that are actually undefined or null
      const editingData = {
        ...sightseeingData,
        // Only set default if the field is not present at all
        ...(sightseeingData.duration === undefined && { duration: 'Not specified' }),
        ...(sightseeingData.inclusions === undefined || 
           !Array.isArray(sightseeingData.inclusions) || 
           sightseeingData.inclusions.length === 0 ? { 
             inclusions: ['No inclusions specified'] 
           } : { inclusions: sightseeingData.inclusions }),
        ...(sightseeingData.keywords === undefined || !Array.isArray(sightseeingData.keywords) ? { 
          keywords: [] 
        } : { keywords: sightseeingData.keywords }),
        // Use the aboutTour field from the full data
        ...(sightseeingData.highlights === undefined || 
           !Array.isArray(sightseeingData.highlights) || 
           sightseeingData.highlights.length === 0 ? {
             highlights: ['No highlights available']
           } : { highlights: sightseeingData.highlights }),
        ...(sightseeingData.meetingPoint === undefined && { 
          meetingPoint: 'To be advised upon booking' 
        }),
        ...(sightseeingData.whatToBring === undefined || 
           !Array.isArray(sightseeingData.whatToBring) || 
           sightseeingData.whatToBring.length === 0 ? {
             whatToBring: ['Comfortable walking shoes', 'camera', 'weather-appropriate clothing']
           } : { whatToBring: sightseeingData.whatToBring }),
        ...(sightseeingData.priceCurrency === undefined && { priceCurrency: 'USD' }),
        ...(sightseeingData.offerPriceCurrency === undefined && { offerPriceCurrency: 'USD' }),
        ...(sightseeingData.isActive === undefined && { isActive: true })
      };
      
      console.log('Setting editing sightseeing data:', editingData);
      setEditingSightseeing(editingData);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error preparing edit form:', error);
      toast.error('Failed to prepare edit form');
    }
  };

  const handleDeleteClick = (sightseeing) => {
    setSightseeingToDelete(sightseeing);
    setShowDeleteModal(true);
  };
  
  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingSightseeing(null);
    // Force a full page refresh to ensure the list is updated
    window.location.reload();
  };

  const handleDeleteConfirm = () => {
    if (sightseeingToDelete) {
      dispatch(deleteGuestSightseeing(sightseeingToDelete._id));
      setShowDeleteModal(false);
      setSightseeingToDelete(null);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading && !sightseeings.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  console.log('Rendering with sightseeings:', sightseeings);
  
  return (
    <div className="container mx-auto px-4 py-8">
      {console.log('In JSX - sightseeings:', sightseeings)}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guest Sightseeings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all guest sightseeing options
          </p>
        </div>
        <Link
          to="/admin/guest-sightseeings/new"
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add New Sightseeing
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="w-full md:w-1/3">
              <SearchBox
                placeholder="Search sightseeings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSubmit={handleSearch}
              />
            </div>
            <div className="flex items-center space-x-2">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filters.country}
                onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
              >
                <option value="">All Countries</option>
                {[...new Set(sightseeings.map(s => s.country))].map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filters.sort}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
              >
                <option value="createdAt:desc">Newest First</option>
                <option value="createdAt:asc">Oldest First</option>
                <option value="name:asc">Name (A-Z)</option>
                <option value="name:desc">Name (Z-A)</option>
                <option value="price:asc">Price (Low to High)</option>
                <option value="price:desc">Price (High to Low)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Offer Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sightseeings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No sightseeings found
                  </td>
                </tr>
              ) : (
                sightseeings.map((sightseeing) => (
                  <tr key={sightseeing._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{sightseeing.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {sightseeing.description?.substring(0, 50)}{sightseeing.description?.length > 50 ? '...' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sightseeing.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${sightseeing.price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sightseeing.offerPrice ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          ${sightseeing.offerPrice.toFixed(2)}
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        sightseeing.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sightseeing.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(sightseeing.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditClick(sightseeing)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(sightseeing)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {pages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(Math.min(pages, currentPage + 1))}
                disabled={currentPage === pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, total)}
                  </span>{' '}
                  of <span className="font-medium">{total}</span> results
                </p>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={pages}
                onPageChange={handlePageChange}
                className="mt-0"
              />
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Sightseeing"
        message="Are you sure you want to delete this sightseeing? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />
      
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 p-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingSightseeing?._id ? 'Edit' : 'Add'} Guest Sightseeing
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSightseeing(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <GuestSightseeingForm 
                sightseeing={editingSightseeing} 
                onSuccess={() => {
                  handleEditSuccess();
                  // Close the modal
                  setShowEditModal(false);
                  // Refresh the list
                  dispatch(fetchGuestSightseeings({
                    page: currentPage,
                    ...filters
                  }));
                }}
                onCancel={() => setShowEditModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestSightseeings;
