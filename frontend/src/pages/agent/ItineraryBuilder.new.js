import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatPrice } from '../../utils/currencyFormatter';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Helper function to get dates between two dates
const getDatesBetween = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// Reusable Sightseeing Card Component
const SightseeingCard = ({ sightseeing, tripDays, isSightseeingInDay, toggleSightseeing }) => (
  <div className="p-3 border rounded bg-white hover:bg-gray-50 transition-colors">
    <div className="flex items-start">
      <div className="flex-1">
        <div className="font-medium">{sightseeing.name}</div>
        <div className="text-sm text-gray-600">{sightseeing.country}</div>
        {sightseeing.duration && (
          <div className="text-xs text-gray-500 mt-1">
            Duration: {sightseeing.duration}
          </div>
        )}
        {sightseeing.transferType && (
          <div className="text-xs text-gray-500">
            Type: {sightseeing.transferType}
          </div>
        )}
        <div className="mt-2">
          <label className="text-sm text-gray-700 block mb-1">Add to day:</label>
          <div className="flex flex-wrap gap-2">
            {tripDays.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggleSightseeing(sightseeing, index)}
                className={`px-2 py-1 text-xs rounded ${
                  isSightseeingInDay(sightseeing, index)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                Day {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="text-sm font-semibold">
        {formatPrice(sightseeing.sellingPrice, sightseeing.currency)}
      </div>
    </div>
  </div>
);

const ItineraryBuilder = () => {
  const [sightseeings, setSightseeings] = useState([]);
  const [filteredSightseeings, setFilteredSightseeings] = useState([]);
  const [itinerary, setItinerary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('My Itinerary');
  const [description, setDescription] = useState('');
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    pax: 1,
    arrivalDate: new Date(),
    departureDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    })(),
    specialRequirements: '',
    destination: '',
    country: ''
  });
  
  const navigate = useNavigate();
  
  // Calculate trip days
  const tripDays = getDatesBetween(
    formData.arrivalDate,
    formData.departureDate
  );
  
  // Filter activities and transfers
  const activities = sightseeings.filter(s => s.type !== 'transfer');
  const transfers = sightseeings.filter(s => s.type === 'transfer');
  
  // Check if a sightseeing is in a specific day
  const isSightseeingInDay = (sightseeing, dayIndex) => {
    const dayKey = `day${dayIndex + 1}`;
    return itinerary[dayKey]?.some(item => item._id === sightseeing._id);
  };
  
  // Toggle sightseeing in itinerary
  const toggleSightseeing = (sightseeing, dayIndex) => {
    const dayKey = `day${dayIndex + 1}`;
    setItinerary(prev => {
      const newItinerary = { ...prev };
      if (!newItinerary[dayKey]) {
        newItinerary[dayKey] = [];
      }
      
      const existingIndex = newItinerary[dayKey].findIndex(
        item => item._id === sightseeing._id
      );
      
      if (existingIndex >= 0) {
        // Remove if exists
        newItinerary[dayKey] = newItinerary[dayKey].filter(
          item => item._id !== sightseeing._id
        );
      } else {
        // Add if not exists
        newItinerary[dayKey] = [...newItinerary[dayKey], sightseeing];
      }
      
      return newItinerary;
    });
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle date changes
  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };
  
  // Calculate total price
  const calculateTotal = () => {
    return Object.values(itinerary)
      .flat()
      .reduce((sum, item) => {
        const itemPrice = parseFloat(item.sellingPrice) || 0;
        const itemPax = item.pax || formData.pax;
        return sum + (itemPrice * itemPax);
      }, 0);
  };
  
  // Handle quote submission
  const handleQuoteNow = async () => {
    try {
      setIsSubmitting(true);
      
      const quoteData = {
        title,
        description,
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        guestPhone: formData.guestPhone,
        pax: parseInt(formData.pax, 10),
        arrivalDate: formData.arrivalDate,
        departureDate: formData.departureDate,
        specialRequirements: formData.specialRequirements,
        destination: formData.destination,
        country: formData.country,
        items: Object.entries(itinerary).flatMap(([day, items]) =>
          items.map(item => ({
            ...item,
            day: parseInt(day.replace('day', ''), 10)
          }))
        )
      };
      
      const res = await api.post('/quotes', quoteData);
      
      if (res.data && res.data.data && res.data.data._id) {
        navigate(`/agent/quotes/${res.data.data._id}`);
      } else {
        setError('Unexpected response from server. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Fetch sightseeings on component mount
  useEffect(() => {
    const fetchSightseeings = async () => {
      try {
        const res = await api.get('/sightseeings');
        setSightseeings(res.data.data || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to load sightseeings. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchSightseeings();
  }, []);
  
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-gray-600">Loading sightseeings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Build Your Itinerary</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}
      </div>
      
      {/* Travel Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Date</label>
          <DatePicker
            selected={formData.arrivalDate}
            onChange={(date) => handleDateChange('arrivalDate', date)}
            selectsStart
            startDate={formData.arrivalDate}
            endDate={formData.departureDate}
            minDate={new Date()}
            className="w-full p-2 border rounded"
            placeholderText="Select arrival date"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
          <DatePicker
            selected={formData.departureDate}
            onChange={(date) => handleDateChange('departureDate', date)}
            selectsEnd
            startDate={formData.arrivalDate}
            endDate={formData.departureDate}
            minDate={formData.arrivalDate}
            className="w-full p-2 border rounded"
            placeholderText="Select departure date"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Available Sightseeings and Transfers */}
        <div className="lg:col-span-1 space-y-6">
          {/* Available Sightseeings Section */}
          <div className="bg-white border rounded shadow">
            <div className="bg-blue-600 text-white px-4 py-3 rounded-t">
              <h2 className="text-lg font-semibold">Available Sightseeings</h2>
            </div>
            <div className="p-4">
              {activities.length > 0 ? (
                activities.map((sightseeing) => (
                  <SightseeingCard
                    key={sightseeing._id}
                    sightseeing={sightseeing}
                    tripDays={tripDays}
                    isSightseeingInDay={isSightseeingInDay}
                    toggleSightseeing={toggleSightseeing}
                  />
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No sightseeings available
                </div>
              )}
            </div>
          </div>

          {/* Transfers Section */}
          <div className="bg-white border rounded shadow">
            <div className="bg-blue-600 text-white px-4 py-3 rounded-t">
              <h2 className="text-lg font-semibold">Transfers</h2>
            </div>
            <div className="p-4">
              {transfers.length > 0 ? (
                transfers.map((transfer) => (
                  <SightseeingCard
                    key={transfer._id}
                    sightseeing={transfer}
                    tripDays={tripDays}
                    isSightseeingInDay={isSightseeingInDay}
                    toggleSightseeing={toggleSightseeing}
                  />
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No transfers available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Itinerary */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Your Itinerary</h2>
            <div className="space-y-6">
              {tripDays.length > 0 ? (
                tripDays.map((day, index) => {
                  const dayKey = `day${index + 1}`;
                  const dayItems = itinerary[dayKey] || [];
                  const dayTotal = dayItems.reduce((sum, item) => {
                    const itemPrice = parseFloat(item.sellingPrice) || 0;
                    const itemPax = item.pax || formData.pax;
                    return sum + (itemPrice * itemPax);
                  }, 0);

                  return (
                    <div key={dayKey} className="border rounded overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                        <h3 className="font-medium">
                          Day {index + 1} - {day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </h3>
                        <span className="text-sm text-gray-600">
                          {dayItems.length} {dayItems.length === 1 ? 'activity' : 'activities'}
                        </span>
                      </div>
                      <div className="p-4">
                        {dayItems.length > 0 ? (
                          <div className="space-y-3">
                            {dayItems.map((item, itemIndex) => (
                              <div key={`${dayKey}-${itemIndex}`} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {item.duration && `${item.duration} • `}
                                    {item.country}
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <div className="text-right mr-4">
                                    <div className="font-medium">
                                      {formatPrice(item.sellingPrice * (item.pax || formData.pax), 'INR')}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {item.pax || formData.pax} pax × {formatPrice(item.sellingPrice, 'INR')}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const newItinerary = { ...itinerary };
                                      newItinerary[dayKey] = newItinerary[dayKey].filter(
                                        (_, i) => i !== itemIndex
                                      );
                                      setItinerary(newItinerary);
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            No activities added for this day
                          </div>
                        )}
                      </div>
                      <div className="bg-gray-50 px-4 py-2 border-t flex justify-between items-center">
                        <span className="text-sm font-medium">Day Total:</span>
                        <span className="font-semibold">
                          {formatPrice(dayTotal, 'INR')}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No days available. Please set your travel dates.
                </div>
              )}

              {/* Itinerary Summary */}
              <div className="bg-white border rounded p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Itinerary Summary</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <label htmlFor="pax" className="mr-2 text-sm font-medium text-gray-700">Pax:</label>
                      <input
                        type="number"
                        name="pax"
                        min="1"
                        value={formData.pax}
                        onChange={handleInputChange}
                        className="w-16 p-1 border rounded text-center"
                      />
                    </div>
                    <div className="text-xl font-semibold">
                      Total: {formatPrice(calculateTotal(), 'INR')}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleQuoteNow}
                    disabled={isSubmitting || Object.values(itinerary).flat().length === 0}
                    className={`px-4 py-2 rounded font-medium ${
                      isSubmitting || Object.values(itinerary).flat().length === 0
                        ? 'bg-gray-200 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isSubmitting ? 'Processing...' : 'Get Quote'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryBuilder;
