import React, { useState } from 'react';
import axios from 'axios';

const defaultTraveler = { name: '', age: '', gender: 'male', idType: 'passport', idNumber: '' };

const BookPackageModal = ({ open, onClose, pkg, onSuccess }) => {
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  const [travelDates, setTravelDates] = useState({ startDate: '', endDate: '' });
  const [travelers, setTravelers] = useState([{ ...defaultTraveler }]);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open || !pkg) return null;

  const handleTravelerChange = (idx, field, value) => {
    setTravelers(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const handleAddTraveler = () => setTravelers(prev => [...prev, { ...defaultTraveler }]);
  const handleRemoveTraveler = idx => setTravelers(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    // Validate required fields
    if (!customer.name || !customer.email || !customer.phone || !travelDates.startDate || !travelDates.endDate) {
      setError('Please fill all required fields.');
      setSubmitting(false);
      return;
    }
    if (travelers.some(t => !t.name || !t.age || !t.gender)) {
      setError('Please fill all traveler details.');
      setSubmitting(false);
      return;
    }
    try {
      const payload = {
        package: pkg._id,
        customerDetails: customer,
        travelDates,
        travelers: travelers.map(t => ({ ...t, age: Number(t.age) })),
        totalAmount: pkg.agentPrice,
        agentCommission: 0, // You can adjust logic here
        specialRequirements,
      };
      const res = await axios.post('/api/bookings', payload);
      onSuccess(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book package');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl overflow-y-auto max-h-[95vh]">
        <h3 className="text-lg font-bold mb-2">Book Package: {pkg.name}</h3>
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
              <label className="block text-sm mb-1">Address</label>
              <input className="form-input w-full" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} />
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
          <div className="mt-4">
            <label className="block text-sm mb-1">Travelers</label>
            {travelers.map((trav, idx) => (
              <div key={idx} className="border rounded p-2 mb-2">
                <div className="flex gap-2 mb-1">
                  <input className="form-input flex-1" placeholder="Name" value={trav.name} onChange={e => handleTravelerChange(idx, 'name', e.target.value)} required />
                  <input className="form-input w-20" type="number" placeholder="Age" min="0" value={trav.age} onChange={e => handleTravelerChange(idx, 'age', e.target.value)} required />
                  <select className="form-input w-28" value={trav.gender} onChange={e => handleTravelerChange(idx, 'gender', e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <button type="button" className="text-red-500" onClick={() => handleRemoveTraveler(idx)}>&times;</button>
                </div>
                <div className="flex gap-2">
                  <select className="form-input w-40" value={trav.idType} onChange={e => handleTravelerChange(idx, 'idType', e.target.value)}>
                    <option value="passport">Passport</option>
                    <option value="aadhar">Aadhar</option>
                    <option value="driving_license">Driving License</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="other">Other</option>
                  </select>
                  <input className="form-input flex-1" placeholder="ID Number" value={trav.idNumber} onChange={e => handleTravelerChange(idx, 'idNumber', e.target.value)} />
                </div>
              </div>
            ))}
            <button type="button" className="btn-outline mt-1" onClick={handleAddTraveler}>+ Add Traveler</button>
          </div>
          <div className="mt-4">
            <label className="block text-sm mb-1">Special Requirements</label>
            <textarea className="form-input w-full" rows={2} value={specialRequirements} onChange={e => setSpecialRequirements(e.target.value)} />
          </div>
          <div className="flex justify-end mt-6 space-x-2">
            <button type="button" className="btn-outline" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Booking...' : 'Book Package'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookPackageModal;
