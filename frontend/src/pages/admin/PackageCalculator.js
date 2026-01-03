import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Trash2, 
  Save, 
  Calculator, 
  DollarSign, 
  Users, 
  Car,
  Eye,
  Edit,
  X
} from 'lucide-react';
import axios from 'axios';
import { convertCurrency, getExchangeRate } from '../../utils/currencyConverter';

const PackageCalculator = () => {
  const [calculators, setCalculators] = useState([]);
  const [sightseeings, setSightseeings] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCalculator, setEditingCalculator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCalculator, setViewingCalculator] = useState(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [previousCurrency, setPreviousCurrency] = useState('INR');
  const [formData, setFormData] = useState({
    name: '',
    adults: 0,
    children: 0,
    adultSightseeings: [],
    childSightseeings: [],
    transfers: [],
    hotelPrices: [],
    currency: 'INR',
    notes: ''
  });

  useEffect(() => {
    fetchCalculators();
    fetchSightseeings();
    fetchTransfers();
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    setLoadingRates(true);
    try {
      // Test if we can fetch rates (now returns boolean)
      const success = await getExchangeRate('THB', 'INR');
      if (!success) {
        console.warn('Exchange rate test failed');
      }
    } catch (error) {
      console.error('Failed to test exchange rates:', error);
      toast.error('Failed to initialize exchange rates');
    } finally {
      setLoadingRates(false);
    }
  };

  const convertAllPrices = async (fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return;

    setLoading(true);
    try {
      const updatedFormData = { ...formData };

      // Convert adult sightseeing prices
      updatedFormData.adultSightseeings = await Promise.all(
        formData.adultSightseeings.map(async (item) => ({
          ...item,
          adultPrice: await convertCurrency(item.adultPrice, fromCurrency, toCurrency)
        }))
      );

      // Convert child sightseeing prices
      updatedFormData.childSightseeings = await Promise.all(
        formData.childSightseeings.map(async (item) => ({
          ...item,
          childPrice: await convertCurrency(item.childPrice, fromCurrency, toCurrency)
        }))
      );

      // Convert transfer prices
      updatedFormData.transfers = await Promise.all(
        formData.transfers.map(async (item) => ({
          ...item,
          transferPrice: await convertCurrency(item.transferPrice, fromCurrency, toCurrency)
        }))
      );

      // Convert hotel prices
      updatedFormData.hotelPrices = await Promise.all(
        formData.hotelPrices.map(async (item) => ({
          ...item,
          price: await convertCurrency(item.price, fromCurrency, toCurrency)
        }))
      );

      setFormData(updatedFormData);
      toast.success(`Prices converted from ${fromCurrency} to ${toCurrency}`);
    } catch (error) {
      console.error('Currency conversion failed:', error);
      toast.error('Failed to convert prices');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    const oldCurrency = formData.currency;
    
    // Update the currency field first
    setFormData(prev => ({ ...prev, currency: newCurrency }));
    
    if (oldCurrency !== newCurrency) {
      await convertAllPrices(oldCurrency, newCurrency);
      setPreviousCurrency(oldCurrency);
    }
  };

  const fetchCalculators = async () => {
    try {
      const response = await axios.get('/api/package-calculator');
      setCalculators(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch calculators');
    }
  };

  const fetchSightseeings = async () => {
    try {
      const response = await axios.get('/api/package-calculator/sightseeings');
      setSightseeings(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch sightseeings');
    }
  };

  const fetchTransfers = async () => {
    try {
      const response = await axios.get('/api/package-calculator/transfers');
      setTransfers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch transfers');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Don't handle currency changes here - use handleCurrencyChange instead
    if (name === 'currency') return;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addAdultSightseeing = () => {
    setFormData(prev => ({
      ...prev,
      adultSightseeings: [...prev.adultSightseeings, {
        sightseeingId: '',
        quantity: 1, // Keep for backward compatibility
        adultPrice: 0
      }]
    }));
  };

  const addChildSightseeing = () => {
    setFormData(prev => ({
      ...prev,
      childSightseeings: [...prev.childSightseeings, {
        sightseeingId: '',
        quantity: 1, // Keep for backward compatibility
        childPrice: 0
      }]
    }));
  };

  const addTransfer = () => {
    setFormData(prev => ({
      ...prev,
      transfers: [...prev.transfers, {
        transferId: '',
        quantity: 1, // Keep for backward compatibility
        transferPrice: 0
      }]
    }));
  };

  const addHotel = () => {
    setFormData(prev => ({
      ...prev,
      hotelPrices: [...prev.hotelPrices, {
        hotelName: '',
        price: 0,
        quantity: 1 // Keep for backward compatibility
      }]
    }));
  };

  const updateAdultSightseeing = async (index, field, value) => {
    const updated = [...formData.adultSightseeings];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-populate and convert price when sightseeing is selected
    if (field === 'sightseeingId') {
      const selectedSightseeing = sightseeings.find(s => s._id === value);
      if (selectedSightseeing) {
        // Convert the price from sightseeing currency to form currency
        const convertedPrice = await convertCurrency(
          selectedSightseeing.adultPrice, 
          selectedSightseeing.currency, 
          formData.currency
        );
        updated[index].adultPrice = convertedPrice;
      }
    }
    
    setFormData(prev => ({ ...prev, adultSightseeings: updated }));
  };

  const updateChildSightseeing = async (index, field, value) => {
    const updated = [...formData.childSightseeings];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-populate and convert price when sightseeing is selected
    if (field === 'sightseeingId') {
      const selectedSightseeing = sightseeings.find(s => s._id === value);
      if (selectedSightseeing) {
        // Convert the price from sightseeing currency to form currency
        const convertedPrice = await convertCurrency(
          selectedSightseeing.childPrice, 
          selectedSightseeing.currency, 
          formData.currency
        );
        updated[index].childPrice = convertedPrice;
      }
    }
    
    setFormData(prev => ({ ...prev, childSightseeings: updated }));
  };

  const updateTransfer = async (index, field, value) => {
    const updated = [...formData.transfers];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-populate and convert price when transfer is selected
    if (field === 'transferId') {
      const selectedTransfer = transfers.find(t => t._id === value);
      if (selectedTransfer) {
        // Convert the price from transfer currency to form currency
        const convertedPrice = await convertCurrency(
          selectedTransfer.price, 
          selectedTransfer.currency, 
          formData.currency
        );
        updated[index].transferPrice = convertedPrice;
      }
    }
    
    setFormData(prev => ({ ...prev, transfers: updated }));
  };

  const updateHotel = (index, field, value) => {
    const updated = [...formData.hotelPrices];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, hotelPrices: updated }));
  };

  const removeAdultSightseeing = (index) => {
    setFormData(prev => ({
      ...prev,
      adultSightseeings: prev.adultSightseeings.filter((_, i) => i !== index)
    }));
  };

  const removeChildSightseeing = (index) => {
    setFormData(prev => ({
      ...prev,
      childSightseeings: prev.childSightseeings.filter((_, i) => i !== index)
    }));
  };

  const removeTransfer = (index) => {
    setFormData(prev => ({
      ...prev,
      transfers: prev.transfers.filter((_, i) => i !== index)
    }));
  };

  const removeHotel = (index) => {
    setFormData(prev => ({
      ...prev,
      hotelPrices: prev.hotelPrices.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const adultsCount = parseInt(formData.adults || 0);
    const childrenCount = parseInt(formData.children || 0);
    
    // Calculate sightseeing costs (multiply by number of adults/children)
    const adultTotal = formData.adultSightseeings.reduce((sum, item) => 
      sum + (parseFloat(item.adultPrice || 0) * (item.quantity || 1)), 0
    ) * adultsCount;
    const childTotal = formData.childSightseeings.reduce((sum, item) => 
      sum + (parseFloat(item.childPrice || 0) * (item.quantity || 1)), 0
    ) * childrenCount;
    const transferTotal = formData.transfers.reduce((sum, item) => 
      sum + (parseFloat(item.transferPrice || 0) * (item.quantity || 1)), 0
    );
    const hotelTotal = formData.hotelPrices.reduce((sum, item) => 
      sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0
    );
    
    // Calculate visa fees
    const totalPeople = adultsCount + childrenCount;
    const visaSightseeingFees = totalPeople * 1500;
    const visaHotelFees = totalPeople * 500;
    const visaTotal = visaSightseeingFees + visaHotelFees;
    
    const grandTotal = adultTotal + childTotal + transferTotal + hotelTotal + visaTotal;
    
    return {
      adultTotal,
      childTotal,
      transferTotal,
      hotelTotal,
      visaTotal,
      visaSightseeingFees,
      visaHotelFees,
      grandTotal
    };
  };

  const getTransferName = (transferId) => {
    const transfer = transfers.find(t => t._id === transferId);
    return transfer ? `${transfer.name} (${transfer.fromLocation} to ${transfer.toLocation})` : 'Unknown';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCalculator) {
        await axios.put(`/api/package-calculator/${editingCalculator._id}`, formData);
        toast.success('Calculator updated successfully');
      } else {
        await axios.post('/api/package-calculator', formData);
        toast.success('Calculator created successfully');
      }
      
      resetForm();
      fetchCalculators();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save calculator');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      adults: 0,
      children: 0,
      adultSightseeings: [],
      childSightseeings: [],
      transfers: [],
      hotelPrices: [],
      currency: 'INR',
      notes: ''
    });
    setEditingCalculator(null);
    setShowForm(false);
  };

  const handleEdit = (calculator) => {
    setEditingCalculator(calculator);
    setFormData({
      name: calculator.name,
      adults: calculator.adults || 0,
      children: calculator.children || 0,
      adultSightseeings: calculator.adultSightseeings,
      childSightseeings: calculator.childSightseeings,
      transfers: calculator.transfers,
      hotelPrices: calculator.hotelPrices || [],
      currency: calculator.currency,
      notes: calculator.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this calculator?')) {
      return;
    }

    try {
      await axios.delete(`/api/package-calculator/${id}`);
      toast.success('Calculator deleted successfully');
      fetchCalculators();
    } catch (error) {
      toast.error('Failed to delete calculator');
    }
  };

  const handleView = (calculator) => {
    setViewingCalculator(calculator);
    setShowViewModal(true);
  };

  const getSightseeingName = (sightseeingId) => {
    const sightseeing = sightseeings.find(s => s._id === sightseeingId);
    return sightseeing ? sightseeing.name : 'Unknown';
  };

  const calculateViewModalVisaTotals = (calculator) => {
    const totalPeople = parseInt(calculator.adults || 0) + parseInt(calculator.children || 0);
    const visaSightseeingFees = totalPeople * 1500;
    const visaHotelFees = totalPeople * 500;
    const visaTotal = visaSightseeingFees + visaHotelFees;
    
    return {
      totalPeople,
      visaSightseeingFees,
      visaHotelFees,
      visaTotal
    };
  };

  const totals = calculateTotals();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Package Cost Calculator</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          New Calculator
        </button>
      </div>

      {/* Calculators List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adult Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Child Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transfers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hotels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grand Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {calculators.map((calculator) => (
                <tr key={calculator._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {calculator.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculator.adultSightseeings.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculator.childSightseeings.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculator.transfers.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculator.hotelPrices ? calculator.hotelPrices.length : 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {calculator.currency} {calculator.grandTotal.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(calculator)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(calculator)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(calculator._id)}
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
                  {editingCalculator ? 'Edit Calculator' : 'Create Calculator'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calculator Name
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
                      Number of Adults
                    </label>
                    <input
                      type="number"
                      name="adults"
                      value={formData.adults}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Children
                    </label>
                    <input
                      type="number"
                      name="children"
                      value={formData.children}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                      {loadingRates && <span className="ml-2 text-xs text-gray-500">Loading rates...</span>}
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleCurrencyChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="INR">INR</option>
                      <option value="THB">THB</option>
                    </select>
                    {previousCurrency !== formData.currency && (
                      <div className="mt-1 text-xs text-blue-600">
                        <p>Converted from {previousCurrency} to {formData.currency}</p>
                        <p className="text-gray-500">All prices have been automatically updated</p>
                      </div>
                    )}
                    {loading && (
                      <p className="mt-1 text-xs text-orange-600">
                        Converting prices...
                      </p>
                    )}
                  </div>
                </div>

                {/* Adult Sightseeings */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users size={20} />
                      Adult Sightseeings
                    </h3>
                    <button
                      type="button"
                      onClick={addAdultSightseeing}
                      className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-700"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                  {formData.adultSightseeings.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={item.sightseeingId}
                        onChange={(e) => updateAdultSightseeing(index, 'sightseeingId', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Sightseeing</option>
                        {sightseeings.map(sightseeing => (
                          <option key={sightseeing._id} value={sightseeing._id}>
                            {sightseeing.name} - Adult: {sightseeing.currency} {sightseeing.adultPrice}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.adultPrice}
                        onChange={(e) => updateAdultSightseeing(index, 'adultPrice', parseFloat(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeAdultSightseeing(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Child Sightseeings */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users size={20} />
                      Child Sightseeings
                    </h3>
                    <button
                      type="button"
                      onClick={addChildSightseeing}
                      className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-700"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                  {formData.childSightseeings.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={item.sightseeingId}
                        onChange={(e) => updateChildSightseeing(index, 'sightseeingId', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Sightseeing</option>
                        {sightseeings.map(sightseeing => (
                          <option key={sightseeing._id} value={sightseeing._id}>
                            {sightseeing.name} - Child: {sightseeing.currency} {sightseeing.childPrice}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.childPrice}
                        onChange={(e) => updateChildSightseeing(index, 'childPrice', parseFloat(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeChildSightseeing(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Transfers */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Car size={20} />
                      Transfers
                    </h3>
                    <button
                      type="button"
                      onClick={addTransfer}
                      className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-700"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                  {formData.transfers.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={item.transferId}
                        onChange={(e) => updateTransfer(index, 'transferId', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Transfer</option>
                        {transfers.map(transfer => (
                          <option key={transfer._id} value={transfer._id}>
                            {transfer.name} ({transfer.transferType}) - {transfer.fromLocation} to {transfer.toLocation} - {transfer.currency} {transfer.price}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.transferPrice}
                        onChange={(e) => updateTransfer(index, 'transferPrice', parseFloat(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeTransfer(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Hotel Prices */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <DollarSign size={20} />
                      Hotel Prices
                    </h3>
                    <button
                      type="button"
                      onClick={addHotel}
                      className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-700"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                  {formData.hotelPrices.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={item.hotelName}
                        onChange={(e) => updateHotel(index, 'hotelName', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Hotel Name"
                        required
                      />
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateHotel(index, 'price', parseFloat(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="Price per person"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeHotel(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Notes */}
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

                {/* Totals Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Calculator size={20} />
                    Cost Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Adult Total</p>
                      <p className="text-lg font-semibold">{formData.currency} {totals.adultTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Child Total</p>
                      <p className="text-lg font-semibold">{formData.currency} {totals.childTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Transfer Total</p>
                      <p className="text-lg font-semibold">{formData.currency} {totals.transferTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Hotel Total</p>
                      <p className="text-lg font-semibold">{formData.currency} {totals.hotelTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Visa Total</p>
                      <p className="text-lg font-semibold text-green-600">{formData.currency} {totals.visaTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Grand Total</p>
                      <p className="text-xl font-bold text-blue-600">{formData.currency} {totals.grandTotal.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Visa Breakdown */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-md font-semibold mb-2 text-green-700">Visa Section Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total People: {parseInt(formData.adults || 0) + parseInt(formData.children || 0)}</p>
                        <p className="text-gray-600">Adults: {formData.adults || 0}</p>
                        <p className="text-gray-600">Children: {formData.children || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Sightseeing Visa: {formData.currency} {totals.visaSightseeingFees.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">({parseInt(formData.adults || 0) + parseInt(formData.children || 0)} × 1500)</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Hotel Visa: {formData.currency} {totals.visaHotelFees.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">({parseInt(formData.adults || 0) + parseInt(formData.children || 0)} × 500)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
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
                    {loading ? 'Saving...' : (editingCalculator ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{viewingCalculator.name}</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Adult Sightseeings */}
                {viewingCalculator.adultSightseeings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Users size={20} />
                      Adult Sightseeings
                    </h3>
                    <div className="space-y-2">
                      {viewingCalculator.adultSightseeings.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span>{getSightseeingName(item.sightseeingId)}</span>
                          <div className="flex items-center gap-4">
                            <span>Qty: {item.quantity}</span>
                            <span className="font-semibold">{viewingCalculator.currency} {item.adultPrice.toFixed(2)}</span>
                            <span className="font-bold">{viewingCalculator.currency} {(item.adultPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Child Sightseeings */}
                {viewingCalculator.childSightseeings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Users size={20} />
                      Child Sightseeings
                    </h3>
                    <div className="space-y-2">
                      {viewingCalculator.childSightseeings.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span>{getSightseeingName(item.sightseeingId)}</span>
                          <div className="flex items-center gap-4">
                            <span>Qty: {item.quantity}</span>
                            <span className="font-semibold">{viewingCalculator.currency} {item.childPrice.toFixed(2)}</span>
                            <span className="font-bold">{viewingCalculator.currency} {(item.childPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transfers */}
                {viewingCalculator.transfers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Car size={20} />
                      Transfers
                    </h3>
                    <div className="space-y-2">
                      {viewingCalculator.transfers.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span>{getTransferName(item.transferId)}</span>
                          <div className="flex items-center gap-4">
                            <span>Qty: {item.quantity}</span>
                            <span className="font-semibold">{viewingCalculator.currency} {item.transferPrice.toFixed(2)}</span>
                            <span className="font-bold">{viewingCalculator.currency} {(item.transferPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hotels */}
                {viewingCalculator.hotelPrices && viewingCalculator.hotelPrices.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <DollarSign size={20} />
                      Hotels
                    </h3>
                    <div className="space-y-2">
                      {viewingCalculator.hotelPrices.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span>{item.hotelName}</span>
                          <div className="flex items-center gap-4">
                            <span>Qty: {item.quantity}</span>
                            <span className="font-semibold">{viewingCalculator.currency} {item.price.toFixed(2)}</span>
                            <span className="font-bold">{viewingCalculator.currency} {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {viewingCalculator.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Notes</h3>
                    <p className="text-gray-600">{viewingCalculator.notes}</p>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <DollarSign size={20} />
                    Cost Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Adult Total</p>
                      <p className="text-lg font-semibold">{viewingCalculator.currency} {viewingCalculator.totalAdultCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Child Total</p>
                      <p className="text-lg font-semibold">{viewingCalculator.currency} {viewingCalculator.totalChildCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Transfer Total</p>
                      <p className="text-lg font-semibold">{viewingCalculator.currency} {viewingCalculator.totalTransferCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Hotel Total</p>
                      <p className="text-lg font-semibold">{viewingCalculator.currency} {viewingCalculator.totalHotelCost ? viewingCalculator.totalHotelCost.toFixed(2) : '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Visa Total</p>
                      <p className="text-lg font-semibold text-green-600">{viewingCalculator.currency} {calculateViewModalVisaTotals(viewingCalculator).visaTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Grand Total</p>
                      <p className="text-xl font-bold text-blue-600">{viewingCalculator.currency} {viewingCalculator.grandTotal.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Visa Breakdown */}
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <h4 className="text-md font-semibold mb-2 text-green-700">Visa Section Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total People: {calculateViewModalVisaTotals(viewingCalculator).totalPeople}</p>
                        <p className="text-gray-600">Adults: {viewingCalculator.adults || 0}</p>
                        <p className="text-gray-600">Children: {viewingCalculator.children || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Sightseeing Visa: {viewingCalculator.currency} {calculateViewModalVisaTotals(viewingCalculator).visaSightseeingFees.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">({calculateViewModalVisaTotals(viewingCalculator).totalPeople} × 1500)</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Hotel Visa: {viewingCalculator.currency} {calculateViewModalVisaTotals(viewingCalculator).visaHotelFees.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">({calculateViewModalVisaTotals(viewingCalculator).totalPeople} × 500)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageCalculator;
