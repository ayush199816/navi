import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Trash2, 
  Save, 
  Edit,
  Eye,
  X,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Tag,
  FileText,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import axios from 'axios';

const CalculatorSightseeingManagement = () => {
  const [sightseeings, setSightseeings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSightseeing, setEditingSightseeing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSightseeing, setViewingSightseeing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    duration: '',
    adultPrice: '',
    childPrice: '',
    currency: 'INR',
    category: 'other',
    inclusions: [],
    exclusions: [],
    notes: '',
    picture: ''
  });

  const categories = [
    { value: 'adventure', label: 'Adventure' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'religious', label: 'Religious' },
    { value: 'nature', label: 'Nature' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'dining', label: 'Dining' },
    { value: 'other', label: 'Other' }
  ];

  const currencies = ['INR', 'USD', 'EUR', 'SGD', 'AED', 'THB', 'MYR', 'IDR', 'VND'];

  useEffect(() => {
    fetchSightseeings();
  }, []);

  const fetchSightseeings = async () => {
    try {
      const response = await axios.get('/api/calculator-sightseeing');
      setSightseeings(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch sightseeings');
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
        duration: parseInt(formData.duration),
        adultPrice: parseFloat(formData.adultPrice),
        childPrice: parseFloat(formData.childPrice)
      };

      if (editingSightseeing) {
        await axios.put(`/api/calculator-sightseeing/${editingSightseeing._id}`, submitData);
        toast.success('Sightseeing updated successfully');
      } else {
        await axios.post('/api/calculator-sightseeing', submitData);
        toast.success('Sightseeing created successfully');
      }
      
      resetForm();
      fetchSightseeings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save sightseeing');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      duration: '',
      adultPrice: '',
      childPrice: '',
      currency: 'INR',
      category: 'other',
      inclusions: [],
      exclusions: [],
      notes: '',
      picture: ''
    });
    setEditingSightseeing(null);
    setShowForm(false);
  };

  const handleEdit = (sightseeing) => {
    setEditingSightseeing(sightseeing);
    setFormData({
      name: sightseeing.name,
      description: sightseeing.description || '',
      location: sightseeing.location || '',
      duration: sightseeing.duration?.toString() || '',
      adultPrice: sightseeing.adultPrice?.toString() || '',
      childPrice: sightseeing.childPrice?.toString() || '',
      currency: sightseeing.currency,
      category: sightseeing.category,
      inclusions: sightseeing.inclusions || [],
      exclusions: sightseeing.exclusions || [],
      notes: sightseeing.notes || '',
      picture: sightseeing.picture || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sightseeing?')) {
      return;
    }

    try {
      await axios.delete(`/api/calculator-sightseeing/${id}`);
      toast.success('Sightseeing deleted successfully');
      fetchSightseeings();
    } catch (error) {
      toast.error('Failed to delete sightseeing');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await axios.patch(`/api/calculator-sightseeing/${id}/toggle`);
      toast.success('Status updated successfully');
      fetchSightseeings();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleView = (sightseeing) => {
    setViewingSightseeing(sightseeing);
    setShowViewModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Calculator Sightseeing Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Sightseeing
        </button>
      </div>

      {/* Sightseeings List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adult Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Child Price
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
              {sightseeings.map((sightseeing) => (
                <tr key={sightseeing._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {sightseeing.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      {sightseeing.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {sightseeing.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {sightseeing.duration} min
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sightseeing.currency} {sightseeing.adultPrice}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sightseeing.currency} {sightseeing.childPrice}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleToggleActive(sightseeing._id)}
                      className={`p-1 rounded ${sightseeing.isActive ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'}`}
                    >
                      {sightseeing.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(sightseeing)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(sightseeing)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(sightseeing._id)}
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
                  {editingSightseeing ? 'Edit Sightseeing' : 'Add Sightseeing'}
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
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adult Price *
                    </label>
                    <input
                      type="number"
                      name="adultPrice"
                      value={formData.adultPrice}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Child Price *
                    </label>
                    <input
                      type="number"
                      name="childPrice"
                      value={formData.childPrice}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
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
                      Inclusions (comma-separated)
                    </label>
                    <textarea
                      name="inclusions"
                      value={formData.inclusions.join(', ')}
                      onChange={(e) => handleArrayInput('inclusions', e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Guide, Tickets, Transport..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exclusions (comma-separated)
                    </label>
                    <textarea
                      name="exclusions"
                      value={formData.exclusions.join(', ')}
                      onChange={(e) => handleArrayInput('exclusions', e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Meals, Personal expenses..."
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
                    {loading ? 'Saving...' : (editingSightseeing ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingSightseeing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{viewingSightseeing.name}</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {viewingSightseeing.picture && (
                  <div>
                    <img 
                      src={viewingSightseeing.picture} 
                      alt={viewingSightseeing.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className="text-gray-500" />
                    <span className="font-medium">Location:</span>
                    <span>{viewingSightseeing.location || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-gray-500" />
                    <span className="font-medium">Duration:</span>
                    <span>{viewingSightseeing.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag size={20} className="text-gray-500" />
                    <span className="font-medium">Category:</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {viewingSightseeing.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} className="text-gray-500" />
                    <span className="font-medium">Adult Price:</span>
                    <span>{viewingSightseeing.currency} {viewingSightseeing.adultPrice}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-gray-500" />
                    <span className="font-medium">Child Price:</span>
                    <span>{viewingSightseeing.currency} {viewingSightseeing.childPrice}</span>
                  </div>
                </div>

                {viewingSightseeing.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <FileText size={20} />
                      Description
                    </h3>
                    <p className="text-gray-600">{viewingSightseeing.description}</p>
                  </div>
                )}

                {viewingSightseeing.inclusions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Inclusions</h3>
                    <ul className="list-disc list-inside text-gray-600">
                      {viewingSightseeing.inclusions.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {viewingSightseeing.exclusions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Exclusions</h3>
                    <ul className="list-disc list-inside text-gray-600">
                      {viewingSightseeing.exclusions.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {viewingSightseeing.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Notes</h3>
                    <p className="text-gray-600">{viewingSightseeing.notes}</p>
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

export default CalculatorSightseeingManagement;
