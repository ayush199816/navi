import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
const SightseeingCard = ({ sightseeing, tripDays, isSightseeingInDay, toggleSightseeing }) => {
  const [pax, setPax] = useState(1);
  const isInItinerary = tripDays.some((_, index) => isSightseeingInDay(sightseeing, index));
  
  const handlePaxChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value) || 1);
    setPax(value);
    // Update the sightseeing object with the new pax value
    sightseeing.pax = value;
  };

  return (
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-700">Pax:</label>
              <input
                type="number"
                min="1"
                value={pax}
                onChange={handlePaxChange}
                className="w-16 p-1 border rounded text-sm text-right"
                disabled={isInItinerary}
              />
            </div>
            <div className="text-sm font-semibold text-right mb-2">
              {formatPrice(sightseeing.sellingPrice * pax, sightseeing.currency || 'INR')}
              <span className="text-xs text-gray-500 ml-1">
                ({pax} × {formatPrice(sightseeing.sellingPrice, sightseeing.currency || 'INR')})
              </span>
            </div>
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
      </div>
    </div>
  );
};

const ItineraryBuilder = () => {
  const { user } = useSelector((state) => state.auth);
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
    children: 0,
    hotelRequired: false,
    flightBooked: false,
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
  
  const [formErrors, setFormErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  
  const navigate = useNavigate();
  
  // Calculate trip days
  const tripDays = getDatesBetween(
    formData.arrivalDate,
    formData.departureDate
  );
  
  // Filter activities and transfers
  const activities = sightseeings.filter(s => s.type !== 'transfer');
  const transfers = sightseeings.filter(s => s.type === 'transfer');
  
  // Get unique countries from sightseeings
  const countries = React.useMemo(() => {
    const countrySet = new Set();
    sightseeings.forEach(item => {
      if (item.country) countrySet.add(item.country);
    });
    return Array.from(countrySet).sort();
  }, [sightseeings]);
  
  // Filter activities and transfers based on search and country
  const filteredActivities = React.useMemo(() => {
    return activities.filter(activity => {
      const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = !selectedCountry || activity.country === selectedCountry;
      return matchesSearch && matchesCountry;
    });
  }, [activities, searchTerm, selectedCountry]);
  
  const filteredTransfers = React.useMemo(() => {
    return transfers.filter(transfer => {
      const matchesSearch = transfer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = !selectedCountry || transfer.country === selectedCountry;
      return matchesSearch && matchesCountry;
    });
  }, [transfers, searchTerm, selectedCountry]);
  
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
        // Create a new object with the current pax value
        const itemToAdd = {
          ...sightseeing,
          pax: sightseeing.pax || 1 // Ensure pax is set
        };
        newItinerary[dayKey] = [...newItinerary[dayKey], itemToAdd];
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
        const itemPax = item.pax || 1; // Default to 1 if pax is not set
        return sum + (itemPrice * itemPax);
      }, 0);
  };
  

  // Get the most common currency from items or default to 'INR'
  const getMostCommonCurrency = () => {
    if (!sightseeings.length) return 'INR';
    
    const currencyCount = {};
    let maxCount = 0;
    let mostCommonCurrency = 'INR';
    
    sightseeings.forEach(item => {
      const currency = item.currency || 'INR';
      currencyCount[currency] = (currencyCount[currency] || 0) + 1;
      
      if (currencyCount[currency] > maxCount) {
        maxCount = currencyCount[currency];
        mostCommonCurrency = currency;
      }
    });
    
    return mostCommonCurrency;
  };

  // Handle quote submission
  const handleQuoteNow = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.guestName || !formData.guestEmail || !formData.guestPhone) {
        setError('Please fill in all required customer information');
        setIsSubmitting(false);
        return;
      }
      
      const baseCurrency = getMostCommonCurrency();
      const items = Object.entries(itinerary).flatMap(([day, items]) =>
        items.map(item => ({
          type: item.type || 'activity',
          sightseeing: item._id,
          name: item.name,
          date: new Date(new Date(formData.arrivalDate).setDate(
            new Date(formData.arrivalDate).getDate() + (parseInt(day.replace('day', ''), 10) - 1)
          )).toISOString(),
          pax: item.pax || 1,
          price: item.sellingPrice,
          currency: item.currency || baseCurrency,
          duration: item.duration || 'Full day',
          description: item.description || ''
        }))
      );
      
      const quoteData = {
        title: title || `Itinerary for ${formData.guestName}`,
        description: description || 'Custom travel package',
        customerName: formData.guestName,
        customerEmail: formData.guestEmail,
        customerPhone: formData.guestPhone,
        customerDetails: {
          name: formData.guestName,
          email: formData.guestEmail,
          phone: formData.guestPhone,
          address: formData.address || ''
        },
        travelDates: {
          startDate: formData.arrivalDate,
          endDate: formData.departureDate
        },
        travelers: {
          adults: parseInt(formData.pax, 10) || 1,
          children: parseInt(formData.children, 10) || 0,
          infants: 0,
          details: []
        },
        destination: formData.destination,
        country: formData.country || formData.destination,
        specialRequirements: formData.specialRequirements || '',
        hotelRequired: formData.hotelRequired || false,
        flightBooked: formData.flightBooked || false,
        items,
        totalAmount: calculateTotal(),
        status: 'draft',
        createdBy: 'agent',
        currency: baseCurrency,
        createdAt: new Date().toISOString()
      };
      
      const totalAmount = calculateTotal();
      
      // Create the final payload with all required fields
      const finalPayload = {
        title: title || `Itinerary for ${formData.guestName}`,
        description: description || 'Custom travel package',
        customerName: formData.guestName.trim(),
        customerEmail: formData.guestEmail.trim(),
        customerPhone: formData.guestPhone.trim(),
        destination: formData.destination,
        country: formData.country || formData.destination,
        travelDates: {
          startDate: new Date(formData.arrivalDate).toISOString(),
          endDate: new Date(formData.departureDate).toISOString()
        },
        numberOfTravelers: {
          adults: parseInt(formData.pax, 10) || 1,
          children: parseInt(formData.children, 10) || 0
        },
        budget: totalAmount,
        status: 'pending',
        currency: quoteData.currency || 'INR',
        totalAmount: totalAmount,
        hotelRequired: formData.hotelRequired || false,
        flightBooked: formData.flightBooked || false,
        specialRequirements: formData.specialRequirements || '',
        agent: user?._id,
        handledBy: user?._id,
        items: quoteData.items,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        quotedPrice: totalAmount,
        quotedDetails: 'Automatically generated quote',
        requirements: formData.specialRequirements || 'No special requirements specified'
      };
      
      console.log('Final payload before sending:', JSON.stringify({
        ...finalPayload,
        __types: {
          customerName: typeof finalPayload.customerName,
          customerEmail: typeof finalPayload.customerEmail,
          customerPhone: typeof finalPayload.customerPhone,
          travelDates_startDate: typeof finalPayload.travelDates?.startDate,
          travelDates_endDate: typeof finalPayload.travelDates?.endDate,
          numberOfTravelers_adults: typeof finalPayload.numberOfTravelers?.adults,
          budget: typeof finalPayload.budget
        }
      }, null, 2));
      
      // Create FormData for the request
      const formDataObj = new FormData();
      
      // Prepare customer data object
      const customerData = {
        name: formData.guestName?.trim() || '',
        email: formData.guestEmail?.trim() || '',
        phone: formData.guestPhone?.trim() || ''
      };
      
      // Format items for requirements
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      };

      const getDayOfWeek = (dateString) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const date = new Date(dateString);
        return days[date.getDay()];
      };

      // Group items by date
      const itemsByDate = (quoteData.items || []).reduce((acc, item) => {
        const date = item.date ? formatDate(item.date) : 'No date';
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(item);
        return acc;
      }, {});

      // Create detailed requirements with items and prices
      const requirementsSections = [
        formData.specialRequirements || 'No special requirements specified',
        '\n\n--- ITINERARY ITEMS ---\n'
      ];

      // Add items grouped by date
      Object.entries(itemsByDate).forEach(([date, items]) => {
        requirementsSections.push(`\nDate: ${date} (${getDayOfWeek(items[0]?.date || new Date())})`);
        requirementsSections.push('--------------------------------');
        
        items.forEach(item => {
          const itemTotal = (item.price * (item.pax || 1)).toFixed(2);
          requirementsSections.push(
            `Activity: ${item.name}\n` +
            `Pax: ${item.pax || 1}\n` +
            `Price: ${formatPrice(item.price, item.currency || 'THB')} x ${item.pax || 1} = ` +
            `${formatPrice(itemTotal, item.currency || 'THB')}\n`
          );
        });

        // Calculate subtotal for the date
        const dateSubtotal = items.reduce((sum, item) => 
          sum + (item.price * (item.pax || 1)), 0);
        
        requirementsSections.push(
          `Subtotal: ${formatPrice(dateSubtotal, items[0]?.currency || 'THB')}\n`
        );
      });

      // Add grand total
      requirementsSections.push(
        '\n--------------------------------',
        `GRAND TOTAL: ${formatPrice(totalAmount, quoteData.currency || 'THB')}\n`
      );

      const detailedRequirements = requirementsSections.join('\n');

      // Add all required fields individually
      const fieldsToAdd = {
        // Customer information as a JSON string
        'customer': JSON.stringify(customerData),
        
        // Trip information
        'destination': formData.destination || '',
        'country': formData.country || formData.destination || '',
        'travelDates': JSON.stringify({
          startDate: new Date(formData.arrivalDate || new Date()).toISOString(),
          endDate: new Date(formData.departureDate || new Date(Date.now() + 86400000)).toISOString()
        }),
        'numberOfTravelers': JSON.stringify({
          adults: parseInt(formData.pax, 10) || 1,
          children: parseInt(formData.children, 10) || 0
        }),
        
        // Quote details
        'budget': totalAmount || 0,
        'status': 'pending',
        'agent': user?._id || '',
        'specialRequirements': detailedRequirements,
        'hotelRequired': formData.hotelRequired || false,
        'flightBooked': formData.flightBooked || false,
        'currency': quoteData.currency || 'THB',
        'items': JSON.stringify(quoteData.items || []),
        
        // Additional fields
        'title': title || `Itinerary for ${formData.guestName}`,
        'description': description || 'Custom travel package',
        'expiryDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        'quotedPrice': totalAmount,
        'quotedDetails': 'Automatically generated quote',
        'requirements': detailedRequirements
      };
      
      // Add all fields to FormData
      Object.entries(fieldsToAdd).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataObj.append(key, value);
        }
      });
      
      // Log the form data being sent
      console.log('Sending form data:');
      for (let [key, value] of formDataObj.entries()) {
        console.log(key, value);
      }
      
      // Send the request
      console.log('Sending request to /api/quotes');
      const response = await api.post('/quotes', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Response received:', response.data);
      
      // Handle successful response
      if (response.data && response.data.data && response.data.data._id) {
        navigate(`/agent/quotes/${response.data.data._id}`);
        return response;
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('Failed to create quote: Invalid response format');
      }
      
    } catch (error) {
      console.error('Error in handleQuoteNow:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        setError(error.response.data.message || 'Failed to create quote');
      } else if (error.request) {
        console.error('No response received:', error.request);
        setError('No response received from server');
      } else {
        console.error('Error:', error.message);
        setError(error.message || 'Failed to create quote');
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Fetch sightseeings on component mount
  useEffect(() => {
    const fetchSightseeings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/sightseeing');
        
        if (res.data && res.data.success) {
          setSightseeings(res.data.data || []);
          setError('');
        } else {
          setError('Invalid response format from server');
          console.error('Invalid response format:', res.data);
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to load sightseeings. Please try again later.';
        setError(errorMessage);
        console.error('Error fetching sightseeings:', err);
      } finally {
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
      
      {/* Customer Information */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
            <input
              type="text"
              name="guestName"
              value={formData.guestName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              name="guestEmail"
              value={formData.guestEmail}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input
              type="tel"
              name="guestPhone"
              value={formData.guestPhone}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
            <input
              type="text"
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Adults *</label>
            <input
              type="number"
              name="pax"
              min="1"
              value={formData.pax}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Children</label>
            <input
              type="number"
              name="children"
              min="0"
              value={formData.children}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="hotelRequired"
                checked={formData.hotelRequired}
                onChange={(e) => setFormData(prev => ({ ...prev, hotelRequired: e.target.checked }))}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Hotel Required</span>
            </label>
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="flightBooked"
                checked={formData.flightBooked}
                onChange={(e) => setFormData(prev => ({ ...prev, flightBooked: e.target.checked }))}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Flight Already Booked</span>
            </label>
          </div>
        </div>
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
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {filteredActivities.slice(0, 10).map((sightseeing) => (
                  <SightseeingCard
                    key={sightseeing._id}
                    sightseeing={sightseeing}
                    tripDays={tripDays}
                    isSightseeingInDay={isSightseeingInDay}
                    toggleSightseeing={toggleSightseeing}
                  />
                ))}
                {filteredActivities.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No matching sightseeings found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transfers Section */}
          <div className="bg-white border rounded shadow">
            <div className="bg-blue-600 text-white px-4 py-3 rounded-t">
              <h2 className="text-lg font-semibold">Transfers</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Search transfers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {filteredTransfers.slice(0, 10).map((transfer) => (
                  <SightseeingCard
                    key={transfer._id}
                    sightseeing={transfer}
                    tripDays={tripDays}
                    isSightseeingInDay={isSightseeingInDay}
                    toggleSightseeing={toggleSightseeing}
                  />
                ))}
                {filteredTransfers.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No matching transfers found
                  </div>
                )}
              </div>
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
