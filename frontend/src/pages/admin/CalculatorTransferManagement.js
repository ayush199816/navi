import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Trash2, 
  Save, 
  Edit,
  Eye,
  X,
  Clock,
  DollarSign,
  Users,
  Car,
  Route,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import axios from 'axios';

const CalculatorTransferManagement = () => {
  const [transfers, setTransfers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingTransfer, setViewingTransfer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    transferType: 'SIC',
    vehicleType: 'sedan',
    fromLocation: '',
    toLocation: '',
    distance: '',
    duration: '',
    price: '',
    currency: 'INR',
    maxPassengers: '',
    includes: [],
    excludes: [],
    notes: '',
    picture: ''
  });

  const transferTypes = [
    { value: 'SIC', label: 'SIC (Seat in Coach)' },
    { value: 'PVT', label: 'Private' },
    { value: 'SHARED', label: 'Shared' },
    { value: 'PRIVATE', label: 'Private (Alternative)' }
  ];

  const vehicleTypes = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'van', label: 'Van' },
    { value: 'bus', label: 'Bus' },
    { value: 'coach', label: 'Coach' },
    { value: 'other', label: 'Other' }
  ];

  const currencies = ['INR', 'USD', 'EUR', 'SGD', 'AED', 'THB', 'MYR', 'IDR', 'VND'];

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const response = await axios.get('/api/calculator-transfer');
      setTransfers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch transfers');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayInput = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [field]: items
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        distance: formData.distance ? parseFloat(formData.distance) : undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        price: parseFloat(formData.price),
        maxPassengers: parseInt(formData.maxPassengers)
      };

      if (editingTransfer) {
        await axios.put(`/api/calculator-transfer/${editingTransfer._id}`, submitData);
        toast.success('Transfer updated successfully');
      } else {
        await axios.post('/api/calculator-transfer', submitData);
        toast.success('Transfer created successfully');
      }
      
      resetForm();
      fetchTransfers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save transfer');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      transferType: 'SIC',
      vehicleType: 'sedan',
      fromLocation: '',
      toLocation: '',
      distance: '',
      duration: '',
      price: '',
      currency: 'INR',
      maxPassengers: '',
      includes: [],
      excludes: [],
      notes: '',
      picture: ''
    });
    setEditingTransfer(null);
    setShowForm(false);
  };

  const handleEdit = (transfer) => {
    setEditingTransfer(transfer);
    setFormData({
      name: transfer.name,
      description: transfer.description || '',
      transferType: transfer.transferType,
      vehicleType: transfer.vehicleType,
      fromLocation: transfer.fromLocation,
      toLocation: transfer.toLocation,
      distance: transfer.distance?.toString() || '',
      duration: transfer.duration?.toString() || '',
      price: transfer.price?.toString() || '',
      currency: transfer.currency,
      maxPassengers: transfer.maxPassengers?.toString() || '',
      includes: transfer.includes || [],
      excludes: transfer.excludes || [],
      notes: transfer.notes || '',
      picture: transfer.picture || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transfer?')) {
      return;
    }

    try {
      await axios.delete(`/api/calculator-transfer/${id}`);
      toast.success('Transfer deleted successfully');
      fetchTransfers();
    } catch (error) {
      toast.error('Failed to delete transfer');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await axios.patch(`/api/calculator-transfer/${id}/toggle`);
      toast.success('Status updated successfully');
      fetchTransfers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleView = (transfer) => {
    setViewingTransfer(transfer);
    setShowViewModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Calculator Transfer Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Transfer
        </button>
      </div>

      {/* Transfers List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Passengers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transfers.map((transfer) => (
                <tr key={transfer._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transfer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Route size={14} />
                      {transfer.fromLocation} → {transfer.toLocation}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {transfer.transferType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Car size={14} />
                      {transfer.vehicleType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {transfer.duration ? `${transfer.duration} min` : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transfer.currency} {transfer.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      {transfer.maxPassengers}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleToggleActive(transfer._id)}
                      className={`p-1 rounded ${transfer.isActive ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                    >
                      {transfer.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(transfer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(transfer)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(transfer._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingTransfer ? 'Edit Transfer' : 'Add Transfer'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transfer Type *
                    </label>
                    <select
                      name="transferType"
                      value={formData.transferType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {transferTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Location *
                    </label>
                    <input
                      type="text"
                      name="fromLocation"
                      value={formData.fromLocation}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Location *
                    </label>
                    <input
                      type="text"
                      name="toLocation"
                      value={formData.toLocation}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Type
                    </label>
                    <select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {vehicleTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      name="distance"
                      value={formData.distance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Passengers *
                    </label>
                    <input
                      type="number"
                      name="maxPassengers"
                      value={formData.maxPassengers}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {currencies.map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Picture URL
                    </label>
                    <input
                      type="text"
                      name="picture"
                      value={formData.picture}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Includes (comma-separated)
                    </label>
                    <textarea
                      name="includes"
                      value={formData.includes.join(', ')}
                      onChange={(e) => handleArrayInput('includes', e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Driver, Fuel, Insurance..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Excludes (comma-separated)
                    </label>
                    <textarea
                      name="excludes"
                      value={formData.excludes.join(', ')}
                      onChange={(e) => handleArrayInput('exclusions', e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tolls, Parking, Tips..."
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save size={20} />
                    {loading ? 'Saving...' : (editingTransfer ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{viewingTransfer.name}</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {viewingTransfer.picture && (
                  <div>
                    <img 
                      src={viewingTransfer.picture} 
                      alt={viewingTransfer.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Route size={20} className="text-gray-500" />
                    <span className="font-medium">Route:</span>
                    <span>{viewingTransfer.fromLocation} → {viewingTransfer.toLocation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car size={20} className="text-gray-500" />
                    <span className="font-medium">Type:</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {viewingTransfer.transferType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car size={20} className="text-gray-500" />
                    <span className="font-medium">Vehicle:</span>
                    <span>{viewingTransfer.vehicleType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-gray-500" />
                    <span className="font-medium">Duration:</span>
                    <span>{viewingTransfer.duration ? `${viewingTransfer.duration} minutes` : 'N/A'}</span>
                  </div>
                  {viewingTransfer.distance && (
                    <div className="flex items-center gap-2">
                      <Route size={20} className="text-gray-500" />
                      <span className="font-medium">Distance:</span>
                      <span>{viewingTransfer.distance} km</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} className="text-gray-500" />
                    <span className="font-medium">Price:</span>
                    <span>{viewingTransfer.currency} {viewingTransfer.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-gray-500" />
                    <span className="font-medium">Max Passengers:</span>
                    <span>{viewingTransfer.maxPassengers}</span>
                  </div>
                </div>

                {viewingTransfer.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-600">{viewingTransfer.description}</p>
                  </div>
                )}

                {viewingTransfer.includes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Includes</h3>
                    <ul className="list-disc list-inside text-gray-600">
                      {viewingTransfer.includes.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {viewingTransfer.excludes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Excludes</h3>
                    <ul className="list-disc list-inside text-gray-600">
                      {viewingTransfer.excludes.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {viewingTransfer.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Notes</h3>
                    <p className="text-gray-600">{viewingTransfer.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculatorTransferManagement;
