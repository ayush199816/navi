import React, { useState } from 'react';
import axios from 'axios';

const defaultCustomer = { name: '', email: '', phone: '' };

const CreateQuoteModal = ({ open, onClose, onSuccess }) => {
  const [customer, setCustomer] = useState({ ...defaultCustomer });
  const [destination, setDestination] = useState('');
  const [travelDates, setTravelDates] = useState({ startDate: '', endDate: '' });
  const [numberOfTravelers, setNumberOfTravelers] = useState({ adults: 1, children: 0 });
  const [hotelRequired, setHotelRequired] = useState(false);
  const [flightBooked, setFlightBooked] = useState(false);
  const [requirements, setRequirements] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const handleRemoveImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    // Validation
    if (!customer.name || !customer.email || !customer.phone || !destination || !travelDates.startDate || !travelDates.endDate || numberOfTravelers.adults < 1) {
      setError('Please fill all required fields.');
      setSubmitting(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('customer', JSON.stringify({
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }));
      formData.append('destination', destination);
      formData.append('travelDates', JSON.stringify(travelDates));
      formData.append('numberOfTravelers', JSON.stringify(numberOfTravelers));
      formData.append('hotelRequired', hotelRequired);
      formData.append('flightBooked', flightBooked);
      formData.append('requirements', requirements);
      images.forEach(img => formData.append('images', img));
      //await axios.post('https://navi-1.onrender.com/api/quotes', formData, {
      await axios.post('http://localhost:5000/api/quotes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quote');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl overflow-y-auto max-h-[95vh]">
        <h3 className="text-lg font-bold mb-2">Request a New Quote</h3>
        {error && <div className="mb-2 text-red-600">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Customer Name *</label>
              <input className="form-input w-full" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Email *</label>
              <input className="form-input w-full" type="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Phone *</label>
              <input className="form-input w-full" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Destination *</label>
              <input className="form-input w-full" value={destination} onChange={e => setDestination(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm mb-1">Start Date *</label>
              <input className="form-input w-full" type="date" value={travelDates.startDate} onChange={e => setTravelDates({ ...travelDates, startDate: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm mb-1">End Date *</label>
              <input className="form-input w-full" type="date" value={travelDates.endDate} onChange={e => setTravelDates({ ...travelDates, endDate: e.target.value })} required />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm mb-1">Number of Adults *</label>
              <input 
                className="form-input w-full" 
                type="number" 
                min="1" 
                value={numberOfTravelers.adults} 
                onChange={e => setNumberOfTravelers({ ...numberOfTravelers, adults: parseInt(e.target.value) || 0 })} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Number of Children</label>
              <input 
                className="form-input w-full" 
                type="number" 
                min="0" 
                value={numberOfTravelers.children} 
                onChange={e => setNumberOfTravelers({ ...numberOfTravelers, children: parseInt(e.target.value) || 0 })} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center">
              <input 
                id="hotel-required" 
                type="checkbox" 
                className="form-checkbox h-4 w-4 mr-2" 
                checked={hotelRequired} 
                onChange={e => setHotelRequired(e.target.checked)} 
              />
              <label htmlFor="hotel-required" className="text-sm">Hotel Required</label>
            </div>
            <div className="flex items-center">
              <input 
                id="flight-booked" 
                type="checkbox" 
                className="form-checkbox h-4 w-4 mr-2" 
                checked={flightBooked} 
                onChange={e => setFlightBooked(e.target.checked)} 
              />
              <label htmlFor="flight-booked" className="text-sm">Flight Already Booked</label>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm mb-1">Requirements / Preferences</label>
            <textarea className="form-input w-full" rows={2} value={requirements} onChange={e => setRequirements(e.target.value)} />
          </div>

          {/* Image Upload */}
          <div className="mt-4">
            <label className="block text-sm mb-1">Upload Images (optional)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="form-input"
              disabled={submitting}
            />
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative inline-block">
                    <img
                      src={src}
                      alt={`preview-${idx}`}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full px-1 text-xs text-red-500"
                      onClick={() => handleRemoveImage(idx)}
                      tabIndex={-1}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6 space-x-2">
            <button type="button" className="btn-outline" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Request Quote'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuoteModal;
