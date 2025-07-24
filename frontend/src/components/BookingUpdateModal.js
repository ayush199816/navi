import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateBooking } from '../redux/slices/bookingSlice';

const BookingUpdateModal = ({ open, onClose, booking }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    travelers: [],
    specialRequirements: '',
    bookingStatus: '',
    suppliers: []
  });
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (booking) {
      setFormData({
        travelers: booking.travelers || [],
        specialRequirements: booking.specialRequirements || '',
        bookingStatus: booking.bookingStatus || '',
        suppliers: booking.suppliers ? booking.suppliers.map(s => s._id || s) : []
      });
    }
  }, [booking]);

  // Fetch suppliers on mount
  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const res = await window.axios ? window.axios.get('/api/suppliers') : (await import('axios')).default.get('/api/suppliers');
        setSuppliers(res.data || []);
      } catch (err) {
        setSuppliers([]);
      }
    }
    fetchSuppliers();
  }, []);

  // Always render the modal, but hide its content if not open or booking is missing
  if (!open || !booking) {
    return <div style={{ display: 'none' }}></div>;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleStatusChange = (e) => {
    setFormData({
      ...formData,
      bookingStatus: e.target.value
    });
  };

  const handleSupplierChange = (e) => {
    const value = e.target.value;
    let newSuppliers = [...formData.suppliers];
    if (e.target.checked) {
      if (!newSuppliers.includes(value)) newSuppliers.push(value);
    } else {
      newSuppliers = newSuppliers.filter(id => id !== value);
    }
    setFormData({
      ...formData,
      suppliers: newSuppliers
    });
  };



  const handleTravelerChange = (index, field, value) => {
    const updatedTravelers = [...formData.travelers];
    updatedTravelers[index] = {
      ...updatedTravelers[index],
      [field]: value
    };
    setFormData({
      ...formData,
      travelers: updatedTravelers
    });
  };

  const addTraveler = () => {
    setFormData({
      ...formData,
      travelers: [
        ...formData.travelers,
        { name: '', age: 30, gender: 'other', idType: 'passport', idNumber: '' }
      ]
    });
  };

  const removeTraveler = (index) => {
    const updatedTravelers = [...formData.travelers];
    updatedTravelers.splice(index, 1);
    setFormData({
      ...formData,
      travelers: updatedTravelers
    });
  };

  const handleSubmit = async (e) => {
    console.log('Booking update form submitted'); // DEBUG
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validation: If status is booked/completed, require at least one supplier
    if (["booked", "completed"].includes(formData.bookingStatus) && (!formData.suppliers || formData.suppliers.length === 0)) {
      setError('At least one supplier must be added before setting status to booked or completed.');
      setLoading(false);
      return;
    }
    try {
      await dispatch(updateBooking({ 
        id: booking._id, 
        bookingData: {
          ...formData,
          bookingStatus: formData.bookingStatus
        }
      })).unwrap();
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl overflow-y-auto max-h-[95vh]">
  <div style={{color: 'red', fontWeight: 'bold', fontSize: '18px', marginBottom: '10px'}}>DEBUG: BookingUpdateModal.js is rendering!</div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Update Booking Details</h3>
          <button className="btn-outline px-2 py-1" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Booking updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Booking Status */}
          <div className="mb-4">
            <label className="block font-semibold mb-2">Booking Status</label>
            <select
              name="bookingStatus"
              value={formData.bookingStatus}
              onChange={handleStatusChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select status</option>
              <option value="pending">Pending</option>
              <option value="booked">Booked</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Supplier Selection */}
          <div className="mb-4">
            <label className="block font-semibold mb-2">Suppliers (at least one required for Booked/Completed)</label>
            <div className="flex flex-wrap gap-2">
              {suppliers && suppliers.length > 0 && suppliers.map(supplier => (
                <label key={supplier._id} className="flex items-center space-x-2 border p-2 rounded">
                  <input
                    type="checkbox"
                    value={supplier._id}
                    checked={formData.suppliers.includes(supplier._id)}
                    onChange={handleSupplierChange}
                  />
                  <span>{supplier.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Travelers</h4>
            <div className="space-y-4">
              {formData.travelers.map((traveler, index) => (
                <div key={index} className="border p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-medium">Traveler #{index + 1}</h5>
                    <button 
                      type="button" 
                      className="text-red-500"
                      onClick={() => removeTraveler(index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={traveler.name || ''}
                        onChange={(e) => handleTravelerChange(index, 'name', e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Age</label>
                      <input
                        type="number"
                        value={traveler.age || ''}
                        onChange={(e) => handleTravelerChange(index, 'age', parseInt(e.target.value))}
                        className="w-full p-2 border rounded"
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gender</label>
                      <select
                        value={traveler.gender || 'other'}
                        onChange={(e) => handleTravelerChange(index, 'gender', e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">ID Type</label>
                      <select
                        value={traveler.idType || 'passport'}
                        onChange={(e) => handleTravelerChange(index, 'idType', e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="passport">Passport</option>
                        <option value="aadhar">Aadhar</option>
                        <option value="driving_license">Driving License</option>
                        <option value="voter_id">Voter ID</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-1">ID Number</label>
                      <input
                        type="text"
                        value={traveler.idNumber || ''}
                        onChange={(e) => handleTravelerChange(index, 'idNumber', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addTraveler}
                className="btn-outline w-full"
              >
                + Add Traveler
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-2">Special Requirements</label>
            <textarea
              name="specialRequirements"
              value={formData.specialRequirements}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows="3"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={() => { console.log('Cancel button clicked'); onClose(); }}
              className="btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              onClick={() => console.log('Save button clicked')}
            >
              {loading ? 'Updating...' : 'Update Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

console.log('BookingUpdateModal mounted'); // DEBUG
export default BookingUpdateModal;
