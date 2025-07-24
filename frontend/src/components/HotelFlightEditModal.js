import React, { useState, useEffect } from 'react';
import { XMarkIcon as XIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const HotelFlightEditModal = ({ open, onClose, booking, onUpdate }) => {
  const [formData, setFormData] = useState({
    hotelDetails: [],
    flightDetails: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('hotels'); // 'hotels' or 'flights'

  useEffect(() => {
    if (booking) {
      setFormData({
        hotelDetails: booking.hotelDetails || [],
        flightDetails: booking.flightDetails || []
      });
    }
  }, [booking]);

  // Always render the modal, but hide its content if not open or booking is missing
  if (!open || !booking) {
    return <div style={{ display: 'none' }}></div>;
  }

  const handleHotelChange = (index, field, value) => {
    const updatedHotels = [...formData.hotelDetails];
    updatedHotels[index] = {
      ...updatedHotels[index],
      [field]: value
    };
    setFormData({
      ...formData,
      hotelDetails: updatedHotels
    });
  };

  const handleFlightChange = (index, field, value) => {
    const updatedFlights = [...formData.flightDetails];
    updatedFlights[index] = {
      ...updatedFlights[index],
      [field]: value
    };
    setFormData({
      ...formData,
      flightDetails: updatedFlights
    });
  };

  const addHotel = () => {
    setFormData({
      ...formData,
      hotelDetails: [
        ...formData.hotelDetails,
        { 
          name: '', 
          checkIn: '', 
          checkOut: '', 
          confirmationNumber: '' 
        }
      ]
    });
  };

  const addFlight = () => {
    setFormData({
      ...formData,
      flightDetails: [
        ...formData.flightDetails,
        { 
          airportName: '', 
          flightNumber: '', 
          travelDate: '', 
          departureTime: '', 
          arrivalTime: '' 
        }
      ]
    });
  };

  const removeHotel = (index) => {
    const updatedHotels = [...formData.hotelDetails];
    updatedHotels.splice(index, 1);
    setFormData({
      ...formData,
      hotelDetails: updatedHotels
    });
  };

  const removeFlight = (index) => {
    const updatedFlights = [...formData.flightDetails];
    updatedFlights.splice(index, 1);
    setFormData({
      ...formData,
      flightDetails: updatedFlights
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.put(`/api/bookings/${booking._id}`, {
        hotelDetails: formData.hotelDetails,
        flightDetails: formData.flightDetails
      });

      if (response.data.success) {
        setSuccess(true);
        
        // Call the onUpdate callback with the updated booking data
        if (onUpdate) {
          onUpdate(response.data.data);
        }
        
        // Close the modal after a short delay
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update booking details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-[95vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Edit Hotel & Flight Details</h3>
          <button className="btn-outline px-2 py-1" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Details updated successfully!
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b mb-4">
          <button 
            className={`py-2 px-4 font-medium ${activeTab === 'hotels' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('hotels')}
          >
            Hotel Details
          </button>
          <button 
            className={`py-2 px-4 font-medium ${activeTab === 'flights' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('flights')}
          >
            Flight Details
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Hotel Details Tab */}
          {activeTab === 'hotels' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">Hotel Details</h4>
                <button
                  type="button"
                  onClick={addHotel}
                  className="flex items-center text-primary-600 hover:text-primary-800"
                >
                  <PlusIcon className="h-4 w-4 mr-1" /> Add Hotel
                </button>
              </div>
              
              {formData.hotelDetails.length === 0 ? (
                <p className="text-gray-500 italic mb-4">No hotel details added yet. Click "Add Hotel" to add one.</p>
              ) : (
                <div className="space-y-6 mb-4">
                  {formData.hotelDetails.map((hotel, index) => (
                    <div key={index} className="mb-6 pb-6 border-b last:border-b-0">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Hotel #{index + 1}</h4>
                        <button 
                          type="button"
                          onClick={() => removeHotel(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Hotel Name</label>
                          <input
                            type="text"
                            value={hotel.name || ''}
                            onChange={(e) => handleHotelChange(index, 'name', e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Check-in Date</label>
                          <input
                            type="date"
                            value={hotel.checkIn ? new Date(hotel.checkIn).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleHotelChange(index, 'checkIn', e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Check-out Date</label>
                          <input
                            type="date"
                            value={hotel.checkOut ? new Date(hotel.checkOut).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleHotelChange(index, 'checkOut', e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Confirmation Number</label>
                          <input
                            type="text"
                            value={hotel.confirmationNumber || ''}
                            onChange={(e) => handleHotelChange(index, 'confirmationNumber', e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Flight Details Tab */}
          {activeTab === 'flights' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">Flight Details</h4>
                <button
                  type="button"
                  onClick={addFlight}
                  className="flex items-center text-primary-600 hover:text-primary-800"
                >
                  <PlusIcon className="h-4 w-4 mr-1" /> Add Flight
                </button>
              </div>
              
              {formData.flightDetails.length === 0 ? (
                <p className="text-gray-500 italic mb-4">No flight details added yet. Click "Add Flight" to add one.</p>
              ) : (
                <div className="space-y-6 mb-4">
                  {formData.flightDetails.map((flight, index) => (
                    <div key={index} className="mb-6 pb-6 border-b last:border-b-0">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Flight #{index + 1}</h4>
                        <button 
                          type="button"
                          onClick={() => removeFlight(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Airport Name</label>
                          <input
                            type="text"
                            value={flight.airportName || ''}
                            onChange={(e) => handleFlightChange(index, 'airportName', e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Flight Number</label>
                          <input
                            type="text"
                            value={flight.flightNumber || ''}
                            onChange={(e) => handleFlightChange(index, 'flightNumber', e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Date of Travel</label>
                          <input
                            type="date"
                            value={flight.travelDate ? new Date(flight.travelDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleFlightChange(index, 'travelDate', e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Departure Time</label>
                          <input
                            type="time"
                            value={flight.departureTime ? flight.departureTime.toString().slice(0, 5) : ''}
                            onChange={(e) => handleFlightChange(index, 'departureTime', e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Arrival Time</label>
                          <input
                            type="time"
                            value={flight.arrivalTime ? flight.arrivalTime.toString().slice(0, 5) : ''}
                            onChange={(e) => handleFlightChange(index, 'arrivalTime', e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HotelFlightEditModal;
