import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// Components
import Spinner from '../../components/common/Spinner';
import SimpleModal from '../../components/common/SimpleModal';

const AddSeller = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'delete'
  const [currentSeller, setCurrentSeller] = useState(null);
  const { token } = useSelector(state => state.auth);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    pocName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    destination: '',
    services: {
      hotel: false,
      sightseeing: false,
      transfers: false
    },
    commissionRate: 0
  });
  
  // Fetch sellers on component mount
  useEffect(() => {
    fetchSellers();
  }, []);
  
  // Fetch all sellers
  const fetchSellers = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const res = await axios.get('/api/sellers', config);
      setSellers(res.data.data);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast.error('Failed to fetch sellers');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('service-')) {
      const serviceName = name.replace('service-', '');
      setFormData({
        ...formData,
        services: {
          ...formData.services,
          [serviceName]: checked
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  // Open modal for adding a new seller
  const openAddModal = () => {
    setFormData({
      name: '',
      pocName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      destination: '',
      services: {
        hotel: false,
        sightseeing: false,
        transfers: false
      },
      commissionRate: 0
    });
    setModalType('add');
    setShowModal(true);
  };
  
  // Open modal for editing a seller
  const openEditModal = (seller) => {
    setCurrentSeller(seller);
    setFormData({
      name: seller.name,
      pocName: seller.pocName || '',
      email: seller.email,
      phone: seller.phone,
      address: seller.address,
      city: seller.city,
      state: seller.state,
      country: seller.country,
      zipCode: seller.zipCode,
      destination: seller.destination || '',
      services: {
        hotel: seller.services?.hotel || false,
        sightseeing: seller.services?.sightseeing || false,
        transfers: seller.services?.transfers || false
      },
      commissionRate: seller.commissionRate
    });
    setModalType('edit');
    setShowModal(true);
  };
  
  // Open modal for deleting a seller
  const openDeleteModal = (seller) => {
    setCurrentSeller(seller);
    setModalType('delete');
    setShowModal(true);
  };
  
  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setCurrentSeller(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };
      
      if (modalType === 'add') {
        await axios.post('/api/sellers', formData, config);
        toast.success('Seller added successfully');
      } else if (modalType === 'edit') {
        await axios.put(`/api/sellers/${currentSeller._id}`, formData, config);
        toast.success('Seller updated successfully');
      }
      
      closeModal();
      fetchSellers();
    } catch (error) {
      console.error('Error submitting seller form:', error);
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };
  
  // Handle seller deletion
  const handleDelete = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      await axios.delete(`/api/sellers/${currentSeller._id}`, config);
      toast.success('Seller deleted successfully');
      closeModal();
      fetchSellers();
    } catch (error) {
      console.error('Error deleting seller:', error);
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };
  
  // Render form modal content
  const renderFormModal = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Seller Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div>
        <label htmlFor="pocName" className="block text-sm font-medium text-gray-700">
          Point of Contact (POC)
        </label>
        <input
          type="text"
          name="pocName"
          id="pocName"
          value={formData.pocName}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={modalType === 'edit'}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          type="text"
          name="phone"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          type="text"
          name="address"
          id="address"
          value={formData.address}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            type="text"
            name="city"
            id="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
            State
          </label>
          <input
            type="text"
            name="state"
            id="state"
            value={formData.state}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700">
            Country
          </label>
          <input
            type="text"
            name="country"
            id="country"
            value={formData.country}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
            Zip Code
          </label>
          <input
            type="text"
            name="zipCode"
            id="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
          Destination
        </label>
        <input
          type="text"
          name="destination"
          id="destination"
          value={formData.destination}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Services Offered
        </label>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="service-hotel"
              name="service-hotel"
              checked={formData.services.hotel}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="service-hotel" className="ml-2 block text-sm text-gray-700">
              Hotel
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="service-sightseeing"
              name="service-sightseeing"
              checked={formData.services.sightseeing}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="service-sightseeing" className="ml-2 block text-sm text-gray-700">
              Sightseeing
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="service-transfers"
              name="service-transfers"
              checked={formData.services.transfers}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="service-transfers" className="ml-2 block text-sm text-gray-700">
              Transfers
            </label>
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700">
          Commission Rate (%)
        </label>
        <input
          type="number"
          name="commissionRate"
          id="commissionRate"
          min="0"
          max="100"
          step="0.01"
          value={formData.commissionRate}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={closeModal}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-primary-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {modalType === 'add' ? 'Add Seller' : 'Update Seller'}
        </button>
      </div>
    </form>
  );
  
  // Render delete confirmation modal content
  const renderDeleteModal = () => (
    <div className="text-center">
      <p className="mb-4">Are you sure you want to delete this seller?</p>
      <p className="mb-4 font-semibold">{currentSeller?.name}</p>
      <div className="flex justify-center space-x-3">
        <button
          type="button"
          onClick={closeModal}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  );
  
  // Get modal title based on modal type
  const getModalTitle = () => {
    switch (modalType) {
      case 'add':
        return 'Add New Seller';
      case 'edit':
        return 'Edit Seller';
      case 'delete':
        return 'Delete Seller';
      default:
        return '';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Seller Management</h1>
        <button
          onClick={openAddModal}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Seller
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {sellers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No sellers found. Add your first seller!</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    POC
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sellers.map((seller) => (
                  <tr key={seller._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {seller.sellerId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {seller.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {seller.pocName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {seller.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {seller.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {seller.destination || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col space-y-1">
                        {seller.services?.hotel && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Hotel</span>}
                        {seller.services?.sightseeing && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Sightseeing</span>}
                        {seller.services?.transfers && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Transfers</span>}
                        {!seller.services?.hotel && !seller.services?.sightseeing && !seller.services?.transfers && '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {seller.commissionRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        seller.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {seller.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(seller)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(seller)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {/* Modal */}
      <SimpleModal
        isOpen={showModal}
        onClose={closeModal}
        title={getModalTitle()}
      >
        {modalType === 'delete' ? renderDeleteModal() : renderFormModal()}
      </SimpleModal>
    </div>
  );
};

export default AddSeller;
