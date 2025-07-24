import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const RaiseQuoteModal = ({ open, onClose, pkg, onSuccess }) => {
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    travelDate: '',
    numberOfTravelers: {
      adults: 1,
      children: 0
    },
    specialRequests: '',
    additionalServices: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!open || !pkg) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      numberOfTravelers: {
        ...prev.numberOfTravelers,
        [name]: Math.max(0, parseInt(value) || 0)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!form.customerName || !form.customerEmail || !form.customerPhone || !form.travelDate) {
        setError('Please fill all required fields');
        setSubmitting(false);
        return;
      }
      if (!form.numberOfTravelers || !form.numberOfTravelers.adults || form.numberOfTravelers.adults < 1) {
        setError('At least one adult traveler is required');
        setSubmitting(false);
        return;
      }

      // Create quote from package
      const quoteData = {
        packageId: pkg._id,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        travelDate: form.travelDate,
        numberOfTravelers: {
          adults: form.numberOfTravelers.adults,
          children: form.numberOfTravelers.children
        },
        specialRequests: form.specialRequests,
        additionalServices: form.additionalServices
      };

      const res = await axios.post('/api/quotes/from-package', quoteData);
      
      if (res.data.success) {
        toast.success('Quote created successfully!');
        onSuccess(res.data.data);
      }
    } catch (err) {
      console.error('Error creating quote:', err);
      setError(err.response?.data?.message || 'Failed to create quote');
    }
    
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Raise Quote for {pkg.name}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
          </div>
          
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          
          <div className="mb-4">
            <h4 className="font-semibold">Package Details</h4>
            <p><span className="font-medium">Destination:</span> {pkg.destination}</p>
            <p><span className="font-medium">Duration:</span> {pkg.duration} days</p>
            <p><span className="font-medium">Price:</span> ₹{pkg.offerPrice ? pkg.offerPrice.toLocaleString() : pkg.price.toLocaleString()}</p>
            {pkg.offerPrice && <p className="text-green-600">Special offer valid until: {new Date(pkg.endDate).toLocaleDateString()}</p>}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm mb-1">Customer Name *</label>
                <input 
                  className="form-input w-full" 
                  name="customerName" 
                  value={form.customerName} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Customer Email *</label>
                <input 
                  className="form-input w-full" 
                  name="customerEmail" 
                  type="email"
                  value={form.customerEmail} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm mb-1">Customer Phone *</label>
                <input 
                  className="form-input w-full" 
                  name="customerPhone" 
                  value={form.customerPhone} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Travel Date *</label>
                <input 
                  className="form-input w-full" 
                  name="travelDate" 
                  type="date"
                  value={form.travelDate} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm mb-1">Number of Adults</label>
                <input 
                  className="form-input w-full" 
                  name="adults" 
                  type="number"
                  min="1"
                  value={form.numberOfTravelers.adults} 
                  onChange={handleNumberChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Number of Children</label>
                <input 
                  className="form-input w-full" 
                  name="children" 
                  type="number"
                  min="0"
                  value={form.numberOfTravelers.children} 
                  onChange={handleNumberChange}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm mb-1">Special Requests</label>
              <textarea 
                className="form-input w-full" 
                name="specialRequests" 
                rows="3"
                value={form.specialRequests} 
                onChange={handleChange}
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                type="button" 
                className="btn-outline" 
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Raise Quote'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RaiseQuoteModal;
