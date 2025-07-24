import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const ClaimForm = ({ booking, onSuccess }) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState([
    { code: 'USD', name: 'US Dollar', rate: 1 },
    { code: 'EUR', name: 'Euro', rate: 0.91 },
    { code: 'GBP', name: 'British Pound', rate: 0.78 },
    { code: 'AED', name: 'UAE Dirham', rate: 3.67 },
    { code: 'INR', name: 'Indian Rupee', rate: 83.12 },
  ]);

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    rateOfExchange: 1,
    leadPaxName: booking?.customerDetails?.name || '',
    travelDate: booking?.travelDates?.startDate 
      ? format(new Date(booking.travelDates.startDate), 'yyyy-MM-dd')
      : '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Set lead passenger name and travel date from booking if available
    if (booking) {
      setFormData(prev => ({
        ...prev,
        leadPaxName: booking.customerDetails?.name || '',
        travelDate: booking.travelDates?.startDate 
          ? format(new Date(booking.travelDates.startDate), 'yyyy-MM-dd')
          : '',
      }));
    }
  }, [booking]);

  // Update rate of exchange when currency changes
  const handleCurrencyChange = (e) => {
    const selectedCurrency = e.target.value;
    const selectedRate = currencies.find(c => c.code === selectedCurrency)?.rate || 1;
    
    setFormData({
      ...formData,
      currency: selectedCurrency,
      rateOfExchange: selectedRate,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleNumberChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0';
    }
    
    if (!formData.rateOfExchange || formData.rateOfExchange <= 0) {
      newErrors.rateOfExchange = 'Rate of exchange is required and must be greater than 0';
    }
    
    if (!formData.leadPaxName) {
      newErrors.leadPaxName = 'Lead passenger name is required';
    }
    
    if (!formData.travelDate) {
      newErrors.travelDate = 'Travel date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('/api/claims', {
        bookingId: booking._id,
        amount: parseFloat(formData.amount),
        rateOfExchange: parseFloat(formData.rateOfExchange),
        currency: formData.currency,
        leadPaxName: formData.leadPaxName,
        travelDate: formData.travelDate,
        notes: formData.notes,
      });
      
      toast.success('Your claim has been submitted successfully');
      
      if (onSuccess) {
        onSuccess(response.data.data);
      }
    } catch (err) {
      console.error('Error submitting claim:', err);
      toast.error(err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  };

  // Calculate claimed amount (amount * rate of exchange)
  const claimedAmount = formData.amount && formData.rateOfExchange
    ? parseFloat(formData.amount) / parseFloat(formData.rateOfExchange)
    : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Submit Payment Claim</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.amount ? 'border-red-500' : ''}`}
            placeholder="Enter amount"
          />
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleCurrencyChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Rate of Exchange</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              name="rateOfExchange"
              value={formData.rateOfExchange}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.rateOfExchange ? 'border-red-500' : ''}`}
            />
            {errors.rateOfExchange && <p className="mt-1 text-sm text-red-600">{errors.rateOfExchange}</p>}
          </div>
        </div>
        
        <div className="p-3 bg-blue-50 rounded-md">
          <div className="flex justify-between items-center">
            <span>Claimed Amount (USD):</span>
            <span className="font-bold">${claimedAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Lead Passenger Name</label>
          <input
            type="text"
            name="leadPaxName"
            value={formData.leadPaxName}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.leadPaxName ? 'border-red-500' : ''}`}
            placeholder="Enter lead passenger name"
          />
          {errors.leadPaxName && <p className="mt-1 text-sm text-red-600">{errors.leadPaxName}</p>}
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Travel Date</label>
          <input
            type="date"
            name="travelDate"
            value={formData.travelDate}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.travelDate ? 'border-red-500' : ''}`}
          />
          {errors.travelDate && <p className="mt-1 text-sm text-red-600">{errors.travelDate}</p>}
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Add any additional notes or information"
          ></textarea>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? 'Submitting...' : 'Submit Claim'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClaimForm;
