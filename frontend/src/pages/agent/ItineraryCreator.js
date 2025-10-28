import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { format, addDays, differenceInDays, parseISO, isValid } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { formatPrice } from '../../utils/currencyFormatter';

const ItineraryCreator = (props) => {
  const { user } = useSelector((state) => state.auth);
  const { id: itineraryId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!props.editMode);
  const [itineraryDays, setItineraryDays] = useState([]);
  const [activityModal, setActivityModal] = useState(null);
  // Helper function to safely format dates
  const safeFormat = (date, formatStr, fallback = '') => {
    if (!date) return fallback;
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isValid(d) ? format(d, formatStr) : fallback;
  };

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    destination: '',
    arrivalDate: safeFormat(new Date(), 'yyyy-MM-dd'),
    departureDate: safeFormat(addDays(new Date(), 7), 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
    hotels: [{ name: '', checkIn: '', checkOut: '', confirmationNumber: '' }],
    flights: [{ flightNumber: '', from: '', to: '', departure: '', arrival: '' }]
  });

  // Fetch itinerary data when in edit mode
  useEffect(() => {
    const fetchItinerary = async () => {
      const id = itineraryId || props.id;
      
      if (!props.editMode || !id) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/v1/itinerary-creator/${id}`);
        
        if (!response.data || !response.data.data) {
          throw new Error('Invalid itinerary data received');
        }
        
        const { data: itinerary } = response.data;
        
        // Format dates to ensure they're in the correct format for the form
        const formatDate = (date) => {
          if (!date) return '';
          try {
            const d = typeof date === 'string' ? new Date(date) : date;
            return format(d, 'yyyy-MM-dd');
          } catch (e) {
            return '';
          }
        };
        
        // Update form data with fetched itinerary
        const newFormData = {
          ...formData,
          // Customer information might be in different fields or not present
          customerName: itinerary.customerName || itinerary.travelerName || '',
          customerEmail: itinerary.customerEmail || itinerary.travelerEmail || '',
          customerPhone: itinerary.customerPhone || itinerary.travelerPhone || '',
          destination: itinerary.destination || '',
          arrivalDate: formatDate(itinerary.arrivalDate) || formData.arrivalDate,
          departureDate: formatDate(itinerary.departureDate) || formData.departureDate,
          adults: itinerary.adults || 1,
          children: itinerary.children || 0,
          notes: itinerary.notes || '',
          hotels: Array.isArray(itinerary.hotels) && itinerary.hotels.length > 0 
            ? itinerary.hotels.map(hotel => ({
                ...hotel,
                checkIn: safeFormat(hotel.checkIn, "yyyy-MM-dd'T'HH:mm") || '',
                checkOut: safeFormat(hotel.checkOut, "yyyy-MM-dd'T'HH:mm") || ''
              }))
            : [{ name: '', checkIn: '', checkOut: '', confirmationNumber: '' }],
          flights: Array.isArray(itinerary.flights) && itinerary.flights.length > 0
            ? itinerary.flights.map(flight => ({
                ...flight,
                departure: safeFormat(flight.departure, "yyyy-MM-dd'T'HH:mm") || '',
                arrival: safeFormat(flight.arrival, "yyyy-MM-dd'T'HH:mm") || ''
              }))
            : [{ flightNumber: '', from: '', to: '', departure: '', arrival: '' }]
        };
        
        setFormData(newFormData);
        
        // Update itinerary days if needed
        if (itinerary.days && Array.isArray(itinerary.days)) {
          const formattedDays = itinerary.days.map(day => ({
            ...day,
            date: day.date ? new Date(day.date) : new Date(),
            activities: Array.isArray(day.activities) ? day.activities : []
          }));
          setItineraryDays(formattedDays);
        } else {
          // If no days data, create days based on the date range
          const startDate = new Date(itinerary.arrivalDate || Date.now());
          const endDate = new Date(itinerary.departureDate || Date.now() + 7 * 24 * 60 * 60 * 1000);
          const daysCount = differenceInDays(endDate, startDate) + 1;
          
          const defaultDays = Array.from({ length: Math.max(1, daysCount) }, (_, i) => ({
            date: addDays(startDate, i),
            activities: []
          }));
          
          setItineraryDays(defaultDays);
        }
      } catch (error) {
        toast.error(`Failed to load itinerary data: ${error.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchItinerary();
  }, [itineraryId, props.editMode, props.id]);

  // Calculate number of days
  const arrival = parseISO(formData.arrivalDate);
  const departure = parseISO(formData.departureDate);
  const numberOfDays = (isValid(arrival) && isValid(departure)) 
    ? Math.max(1, differenceInDays(departure, arrival) + 1)
    : 7; // Default to 7 days if dates are invalid

  // Initialize itinerary days when dates change or when in edit mode without days
  useEffect(() => {
    // Only initialize days if we're not in edit mode or if we don't have any days yet
    if (!props.editMode || (props.editMode && (!itineraryDays || itineraryDays.length === 0))) {
      const days = [];
      const startDate = parseISO(formData.arrivalDate);
      
      if (isValid(startDate)) {
        for (let i = 0; i < numberOfDays; i++) {
          const date = addDays(startDate, i);
          // Check if we already have this date in our existing days
          const existingDay = itineraryDays.find(d => 
            d.date && format(new Date(d.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
          );
          
          days.push(existingDay || {
            date,
            activities: []
          });
        }
        setItineraryDays(days);
      }
    }
  }, [formData.arrivalDate, formData.departureDate, numberOfDays, props.editMode, itineraryDays]);

  const generateActivityInfo = (activityName) => {
    if (!activityName.trim()) return '';
    
    // Extract location and activity type from the name
    const nameParts = activityName.split(' ');
    const location = nameParts.find(part => 
      ['in', 'at', 'to', 'from'].includes(part.toLowerCase()) ? '' : part
    ).replace(/[^a-zA-Z0-9 ]/g, '');
    
    const activityType = activityName.toLowerCase();
    
    // Generate detailed information based on activity type
    const getActivityDetails = () => {
      // Common activities
      if (activityType.includes('island') || activityType.includes('island tour')) {
        return `Embark on an unforgettable island-hopping adventure to explore the stunning islands of ${location || 'the region'}. ` +
               `Discover pristine beaches, crystal-clear waters, and vibrant marine life. ` +
               `Enjoy swimming, snorkeling, and sunbathing at each picturesque stop. ` +
               `A delicious lunch with local flavors is included.`;
      }
      
      if (activityType.includes('city tour')) {
        return `Experience the best of ${location || 'the city'} on this comprehensive city tour. ` +
               `Visit iconic landmarks, hidden gems, and local hotspots with our knowledgeable guide. ` +
               `Learn about the city's rich history, culture, and traditions while exploring on comfortable transportation.`;
      }
      
      if (activityType.includes('food tour') || activityType.includes('culinary')) {
        return `Indulge in a culinary journey through ${location || 'the region'}'s vibrant food scene. ` +
               `Sample authentic local dishes, street food, and traditional delicacies at handpicked eateries. ` +
               `Learn about the history and preparation of each dish from passionate local chefs and food experts.`;
      }
      
      if (activityType.includes('hiking') || activityType.includes('trekking')) {
        return `Challenge yourself with a scenic hike through ${location || 'the region'}'s breathtaking landscapes. ` +
               `Explore lush forests, mountain trails, or coastal paths with an experienced guide. ` +
               `Suitable for ${activityType.includes('easy') ? 'all fitness levels' : 'moderate fitness levels'}. ` +
               `Don't forget your camera for stunning panoramic views!`;
      }
      
      if (activityType.includes('cultural') || activityType.includes('heritage')) {
        return `Immerse yourself in the rich cultural heritage of ${location || 'the region'}. ` +
               `Visit ancient temples, traditional villages, and historical sites with expert guides. ` +
               `Experience local customs, traditional performances, and authentic cultural interactions.`;
      }
      
      // Default detailed description
      return `Experience the best of ${activityName} with our carefully curated tour. ` +
             `Professional guides will take you through all the highlights and hidden gems. ` +
             `Enjoy comfortable transportation, insightful commentary, and memorable experiences. ` +
             `Perfect for ${activityType.includes('private') ? 'a personalized adventure' : 'small groups'}.`;
    };
    
    // Add some dynamic elements
    const duration = activityType.includes('half day') ? '4-5 hours' : 
                    activityType.includes('full day') ? '8-9 hours' : '3-4 hours';
                    
    const inclusions = [
      'Professional guide',
      activityType.includes('food') ? 'Food tastings' : 'Entrance fees',
      'Hotel transfers',
      activityType.includes('island') ? 'Snorkeling equipment' : 'Bottled water'
    ].filter(Boolean);
    
    return `${getActivityDetails()}

📅 Duration: ${duration}
✅ What's included:
${inclusions.map(item => `• ${item}`).join('\n')}

💡 Tip: ${['Bring comfortable walking shoes', 'Don\'t forget your camera', 'Wear weather-appropriate clothing', 'Bring local currency for souvenirs'][Math.floor(Math.random() * 4)]}`;
  };

  const [newActivity, setNewActivity] = useState({
    name: '',
    description: '',
    pickupLocation: '',
    dropLocation: '',
    pickupTime: '', // No default time
    aiInfo: '',
    image: null,
    transferType: 'private'
  });

  const handleActivityNameChange = (e) => {
    const name = e.target.value;
    const aiInfo = generateActivityInfo(name);
    setNewActivity(prev => ({
      ...prev,
      name,
      aiInfo
    }));
  };

  const handleAddManualActivity = (dayIndex) => {
    if (!newActivity.name.trim()) return;
    
    const activity = {
      _id: Date.now().toString(),
      name: newActivity.name,
      description: newActivity.description,
      pickupLocation: newActivity.pickupLocation,
      dropLocation: newActivity.dropLocation,
      pickupTime: newActivity.pickupTime,
      aiInfo: newActivity.aiInfo,
      image: newActivity.image
    };

    const updatedDays = [...itineraryDays];
    updatedDays[dayIndex].activities.push(activity);
    setItineraryDays(updatedDays);
    
    // Reset form but keep the time and location for convenience
    setNewActivity({
      name: '',
      description: '',
      pickupLocation: newActivity.pickupLocation, // Keep the last pickup location
      dropLocation: newActivity.dropLocation,     // Keep the last drop location
      pickupTime: newActivity.pickupTime,         // Keep the last pickup time
      aiInfo: '',
      image: null
    });
    
    setActivityModal(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHotelChange = (index, field, value) => {
    const updatedHotels = [...formData.hotels];
    updatedHotels[index] = { ...updatedHotels[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      hotels: updatedHotels
    }));
  };

  const handleFlightChange = (index, field, value) => {
    const updatedFlights = [...formData.flights];
    updatedFlights[index] = { ...updatedFlights[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      flights: updatedFlights
    }));
  };

  const addActivity = (dayIndex, sightseeing) => {
    const updatedDays = [...itineraryDays];
    // Get the current time in HH:MM format
    const currentTime = new Date().toTimeString().slice(0, 5);
    
    const activityToAdd = {
      name: sightseeing.name || newActivity.name || 'Untitled Activity',
      description: sightseeing.description || newActivity.description || '',
      // Use the time from the form if available, otherwise use the current time
      pickupTime: newActivity.pickupTime || sightseeing.pickupTime,
      transferType: sightseeing.transferType || newActivity.transferType || 'private',
      pickupLocation: sightseeing.pickupLocation || newActivity.pickupLocation || '',
      dropLocation: sightseeing.dropLocation || newActivity.dropLocation || '',
      notes: sightseeing.notes || newActivity.notes || '',
      images: [...(sightseeing.images || []), ...(newActivity.images ? [newActivity.images] : [])].filter(Boolean)
    };

    updatedDays[dayIndex].activities.push(activityToAdd);
    setItineraryDays(updatedDays);
    setActivityModal(null);
    
    // Reset the newActivity form
    setNewActivity({
      name: '',
      description: '',
      pickupLocation: newActivity.pickupLocation, // Keep the last pickup location
      dropLocation: newActivity.dropLocation,     // Keep the last drop location
      pickupTime: newActivity.pickupTime,         // Keep the last pickup time
      transferType: 'private',
      aiInfo: '',
      image: null
    });
  };

  const updateActivity = (dayIndex, activityIndex, field, value) => {
    const updatedDays = [...itineraryDays];
    updatedDays[dayIndex].activities[activityIndex] = {
      ...updatedDays[dayIndex].activities[activityIndex],
      [field]: value
    };
    setItineraryDays(updatedDays);
  };

  const openActivityModal = (dayIndex) => {
    setActivityModal(dayIndex);
  };

  const closeActivityModal = () => {
    setActivityModal(null);
  };

  const removeActivity = (dayIndex, activityIndex) => {
    const updatedDays = [...itineraryDays];
    updatedDays[dayIndex].activities.splice(activityIndex, 1);
    setItineraryDays(updatedDays);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare the itinerary data
      const itineraryData = {
        title: formData.title || `Itinerary for ${formData.customerName || 'Guest'}`,
        destination: formData.destination, // This will store the Booking ID/Quote ID
        arrivalDate: formData.arrivalDate,
        departureDate: formData.departureDate,
        adults: parseInt(formData.adults, 10) || 1,
        children: parseInt(formData.children, 10) || 0,
        notes: formData.notes || '',
        hotels: formData.hotels.map(hotel => ({
          name: hotel.name,
          checkIn: hotel.checkIn,
          checkOut: hotel.checkOut,
          confirmationNumber: hotel.confirmationNumber || ''
        })),
        flights: formData.flights.map(flight => ({
          flightNumber: flight.flightNumber,
          from: flight.from,
          to: flight.to,
          departure: flight.departure,
          arrival: flight.arrival
        })),
        days: itineraryDays.map(day => ({
          date: day.date,
          activities: day.activities.map(activity => ({
            name: activity.name,
            description: activity.description || '',
            pickupLocation: activity.pickupLocation || '',
            dropLocation: activity.dropLocation || '',
            pickupTime: activity.pickupTime,
            transferType: activity.transferType,
            notes: activity.notes || '',
            // Convert File objects to base64 URLs
            images: activity.images?.map(img => 
              img instanceof File ? URL.createObjectURL(img) : img
            ) || []
          }))
        }))
      };

      console.log('Saving itinerary data:', itineraryData);

      // Send the data to the new backend endpoint
      const response = await api.post('/v1/itinerary-creator', itineraryData);
      
      // Show success message
      alert('Itinerary saved successfully!');
      
      // Redirect to the itineraries list
      navigate('/agent/itineraries');
      
    } catch (error) {
      console.error('Error saving itinerary:', error);
      alert(`Failed to save itinerary: ${error.response?.data?.message || error.message}`);
    }
  };

  const downloadPDF = async () => {
    try {
      toast.info('Generating PDF...');
      
      // Create a temporary div to hold the PDF content
      const content = document.createElement('div');
      content.style.padding = '20px';
      content.style.fontFamily = 'Arial, sans-serif';
      content.style.maxWidth = '800px';
      content.style.margin = '0 auto';
      content.style.backgroundColor = 'white';
      content.style.position = 'absolute';
      content.style.left = '-9999px';
      
      // Format flight information
      const formatFlightTime = (dateTimeStr) => {
        if (!dateTimeStr) return 'N/A';
        try {
          const date = new Date(dateTimeStr);
          return format(date, 'MMM d, yyyy h:mm a');
        } catch (e) {
          return dateTimeStr;
        }
      };
      
      // Add content to the div
      content.innerHTML = `
  <!-- Company Header with Background Image -->
  <div style="
    background-image: url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80');
    background-size: cover;
    background-position: center;
    padding: 120px 20px;
    border-radius: 8px;
    margin-bottom: 30px;
    position: relative;
    overflow: hidden;
    text-align: center;
    color: white;
  ">
    <!-- Dark overlay for better text readability -->
    <div style="
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 1;
    "></div>
    
    <!-- Content -->
    <div style="position: relative; z-index: 2;">
      <h1 style="
        margin: 0;
        font-size: 4em;
        font-weight: 800;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        margin-bottom: 15px;
        letter-spacing: 1px;
        text-transform: uppercase;
        line-height: 1.1;
      ">
        ${user?.companyName || user?.company || 'Navi Travels'}
      </h1>
      <div style="
        width: 120px;
        height: 4px;
        background: #fff;
        margin: 20px auto;
        border-radius: 2px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
      "></div>
    </div>
  </div>


        <!-- Agent Information -->
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #9b59b6; margin-bottom: 15px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: #9b59b6; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5em; font-weight: bold; flex-shrink: 0;">
              ${user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <h3 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 2.2em;">${user?.name || 'Your Travel Agent'}</h3>
              ${user?.email ? `<div style="color: #7f8c8d; font-size: 0.95em; margin-bottom: 3px;">${user.email}</div>` : ''}
              ${user?.phoneNumber ? `<div style="color: #7f8c8d; font-size: 0.95em;">${user.phoneNumber}</div>` : ''}
            </div>
          </div>
        </div>
        
        <!-- Travelers -->
        <div style="margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db;">
          <h3 style="color: #2c3e50; border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-bottom: 15px; display: flex; align-items: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 10px;">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Travelers
          </h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${formData.customerName || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${formData.customerEmail || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${formData.customerPhone || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 5px 0;"><strong>Adults:</strong> ${formData.adults || 1}</p>
              <p style="margin: 5px 0;"><strong>Children:</strong> ${formData.children || 0}</p>
            </div>
          </div>
        </div>
        
        <!-- Flights -->
        ${formData.flights && formData.flights.length > 0 ? `
          <div style="margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c;">
            <h3 style="color: #2c3e50; border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-bottom: 15px; display: flex; align-items: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 10px;">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Flight Details
            </h3>
            ${formData.flights.map((flight, index) => `
              <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 5px; border: 1px solid #eee;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <h4 style="margin: 0; color: #2c3e50;">Flight ${index + 1}: ${flight.airline || 'Airline'} ${flight.flightNumber || ''}</h4>
                  <span style="background: #f1c40f; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 0.8em;">
                    ${flight.flightType === 'roundtrip' ? 'Round Trip' : 'One Way'}
                  </span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 15px; align-items: center;">
                  <div>
                    <div style="font-weight: bold; font-size: 1.2em;">${flight.from || 'N/A'}</div>
                    <div style="color: #7f8c8d; font-size: 0.9em;">${formatFlightTime(flight.departure)}</div>
                  </div>
                  <div style="text-align: center; color: #7f8c8d;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-weight: bold; font-size: 1.2em;">${flight.to || 'N/A'}</div>
                    <div style="color: #7f8c8d; font-size: 0.9em;">${formatFlightTime(flight.arrival)}</div>
                  </div>
                </div>
                ${flight.confirmationNumber ? `
                  <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee;">
                    <strong>Confirmation #:</strong> ${flight.confirmationNumber}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <!-- Accommodation -->
        ${formData.hotels && formData.hotels.length > 0 ? `
          <div style="margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #2ecc71;">
            <h3 style="color: #2c3e50; border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-bottom: 15px; display: flex; align-items: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 10px;">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Accommodation
            </h3>
            ${formData.hotels.map((hotel, index) => `
              <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 5px; border: 1px solid #eee;">
                <h4 style="margin-top: 0; margin-bottom: 10px; color: #2c3e50;">${hotel.name || `Hotel ${index + 1}`}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 10px; background: #f8f9fa; padding: 10px; border-radius: 6px;">
                    <div style="flex: 1; text-align: center; padding: 8px; background: white; border-radius: 4px; border: 1px solid #e9ecef;">
                      <div style="font-size: 11px; color: #6c757d; margin-bottom: 3px;">CHECK-IN</div>
                      <div style="font-weight: 600; color: #2c3e50;">${hotel.checkIn ? format(parseISO(hotel.checkIn), 'EEE, MMM d, yyyy') : 'N/A'}</div>
                    </div>
                    <div style="flex: 1; text-align: center; padding: 8px; background: white; border-radius: 4px; border: 1px solid #e9ecef;">
                      <div style="font-size: 11px; color: #6c757d; margin-bottom: 3px;">CHECK-OUT</div>
                      <div style="font-weight: 600; color: #2c3e50;">${hotel.checkOut ? format(parseISO(hotel.checkOut), 'EEE, MMM d, yyyy') : 'N/A'}</div>
                    </div>
                  </div>
                  <div>
                    ${hotel.roomType ? `<p style="margin: 5px 0;"><strong>Room Type:</strong> ${hotel.roomType}</p>` : ''}
                    ${hotel.confirmationNumber ? `<p style="margin: 5px 0;"><strong>Confirmation #:</strong> ${hotel.confirmationNumber}</p>` : ''}
                  </div>
                </div>
                ${hotel.address ? `
                  <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee; color: #666;">
                    <strong>Address:</strong> ${hotel.address}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <!-- Daily Itinerary -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 10px;">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Daily Itinerary
          </h3>
          ${itineraryDays && itineraryDays.length > 0 ? 
            itineraryDays.map((day, dayIndex) => {
              const date = typeof day.date === 'string' ? new Date(day.date) : day.date;
              return `
                <div style="margin-bottom: 25px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                  <div style="background: #3498db; color: white; padding: 12px 15px;">
                    <h4 style="margin: 0; font-size: 1.1em; display: flex; justify-content: space-between; align-items: center;">
                      <span>Day ${dayIndex + 1}: ${format(date, 'EEEE, MMMM d, yyyy')}</span>
                      <span style="font-weight: normal; font-size: 0.9em;">${format(date, 'EEEE')}</span>
                    </h4>
                  </div>
                  <div style="padding: 0;">
                    ${day.activities && day.activities.length > 0 ? 
                      day.activities.map((activity, activityIndex) => `
                        <div style="padding: 15px; border-bottom: 1px solid #f0f0f0; ${activityIndex % 2 === 0 ? 'background: #fff;' : 'background: #fcfcfc;'}">
                          <div style="display: flex;">
                            <div style="min-width: 80px; font-weight: bold; color: #2c3e50;">
                              ${activity.pickupTime || 'Time TBD'}
                            </div>
                            <div style="flex: 1;">
                              <div style="margin-bottom: 8px;">
                                <div style="font-weight: bold; font-size: 1.1em; color: #2c3e50;">${activity.name || 'Activity'}</div>
                                <div style="color: #7f8c8d; font-size: 0.9em; margin-top: 2px;">${activity.pickupTime || ''}</div>
                              </div>
                              ${activity.description ? `
                                <div style="color: #333; margin: 6px 0; font-size: 0.95em; line-height: 1.4;">
                                  ${activity.description}
                                </div>
                              ` : ''}
                              ${(activity.pickupLocation || activity.dropLocation) ? `
                                <div style="margin-top: 8px; font-size: 0.9em; background: #f8f9fa; padding: 6px 8px; border-radius: 4px;">
                                  ${activity.pickupLocation ? `
                                    <div style="display: flex; margin-bottom: 4px;">
                                      <div style="color: #7f8c8d; min-width: 70px;">Pickup:</div>
                                      <div>${activity.pickupLocation}</div>
                                    </div>
                                  ` : ''}
                                  ${activity.dropLocation ? `
                                    <div style="display: flex;">
                                      <div style="color: #7f8c8d; min-width: 70px;">Drop-off:</div>
                                      <div>${activity.dropLocation}</div>
                                    </div>
                                  ` : ''}
                                </div>
                              ` : ''}
                              <div style="display: flex; flex-wrap: wrap; gap: 10px; font-size: 0.9em; color: #7f8c8d;">
                                ${activity.duration ? `
                                  <span style="display: inline-flex; align-items: center;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    ${activity.duration} min
                                  </span>
                                ` : ''}
                                ${activity.cost ? `
                                  <span style="display: inline-flex; align-items: center; color: #27ae60; font-weight: 500;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                                      <line x1="12" y1="1" x2="12" y2="23"></line>
                                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                    </svg>
                                    ${formatPrice(activity.cost)}
                                  </span>
                                ` : ''}
                                ${activity.location ? `
                                  <span style="display: inline-flex; align-items: center;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                      <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    ${activity.location}
                                  </span>
                                ` : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      `).join('') : 
                      `
                      <div style="padding: 20px; text-align: center; color: #7f8c8d; font-style: italic;">
                        No activities scheduled for this day.
                      </div>
                      `
                    }
                  </div>
                </div>
              `;
            }).join('') : 
            '<div style="text-align: center; padding: 20px; color: #7f8c8d; font-style: italic;">No itinerary days available.</div>'
          }
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 50px; padding: 20px; text-align: center; color: #7f8c8d; font-size: 0.9em; border-top: 1px solid #eee;">
          <div style="max-width: 600px; margin: 0 auto;">
            <p style="margin: 0 0 10px 0;">
              Thank you for choosing ${user?.companyName || 'our travel services'}. We hope you have a wonderful trip!
            </p>
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px;">
              ${user?.email ? `
                <span style="display: inline-flex; align-items: center;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 5px;">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  ${user.email}
                </span>
              ` : ''}
              ${user?.phone ? `
                <span style="display: inline-flex; align-items: center;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 5px;">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  ${user.phone}
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      
      // Add the content to the body temporarily
      document.body.appendChild(content);
      
      // Wait for fonts to load
      await document.fonts.ready;
      
      // Initialize PDF with proper margins
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      // PDF dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8; // Reduced from 10mm to 8mm
      const contentWidth = pageWidth - (2 * margin);
      
      // Compact spacing variables
      const sectionGap = 4; // Further reduced space between sections
      const elementGap = 3; // Further reduced space between elements
      const subsectionGap = 3; // Gap for subsections
      
      // Function to add a new page with header
      const addNewPage = (pdf, pageNumber, sectionTitle = '') => {
        if (pageNumber > 1) {
          pdf.addPage();
        }
        
        // Add main header - more compact
        pdf.setFontSize(16); // Reduced from 18
        pdf.setTextColor(44, 62, 80);
        pdf.setFont(undefined, 'bold');
        pdf.text(
          `${formData.customerName || 'Customer'}'s Travel Itinerary`,
          pageWidth / 2,
          margin + 8, // Reduced from 10
          { align: 'center' }
        );
        
        // Add section title if provided
        if (sectionTitle) {
          pdf.setFontSize(13); // Reduced from 14
          pdf.setTextColor(52, 152, 219);
          pdf.text(
            sectionTitle,
            pageWidth / 2,
            margin + 16, // Reduced from 20
            { align: 'center' }
          );
          pdf.setDrawColor(52, 152, 219);
          pdf.setLineWidth(0.3); // Thinner line
          pdf.line(
            margin,
            margin + 19, // Reduced from 25
            pageWidth - margin,
            margin + 19  // Reduced from 25
          );
          return margin + 25; // Reduced from 35
        }
        
        // Add page number
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.setFont(undefined, 'normal');
        pdf.text(
          `Page ${pageNumber}`,
          pageWidth - margin,
          pageHeight - margin,
          { align: 'right' }
        );
        
        return margin + 25; // Return Y position after header
      };
      
      // Function to split text into lines that fit the page width
      const getLines = (text, maxWidth) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const width = pdf.getStringUnitWidth(currentLine + ' ' + word) * pdf.getFontSize() / pdf.internal.scaleFactor;
          if (width < maxWidth) {
            currentLine += ' ' + word;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine);
        return lines;
      };
      
      // Generate PDF in chunks
      let currentPage = 1;
      let currentY = addNewPage(pdf, currentPage);
      const lineHeight = 7; // mm per line
      const sectionMargin = 5; // mm between sections
      
      // Function to add a section with page breaks
      const addSection = (title, contentHtml, options = {}) => {
        const { 
          fontSize = 11,
          isBold = false, 
          marginTop = 0, // Remove top margin - we'll handle spacing differently
          marginBottom = 0, // Remove bottom margin
          isSubsection = false,
          noGap = false // New option to remove all gaps
        } = options;
        
        // Create temporary div for the section
        const sectionDiv = document.createElement('div');
        sectionDiv.style.width = '794px';
        sectionDiv.style.padding = noGap ? '0' : '6px 10px';
        sectionDiv.style.fontFamily = '"Helvetica Neue", Arial, sans-serif';
        sectionDiv.style.fontSize = fontSize + 'px';
        sectionDiv.style.lineHeight = '1.35'; // Tighter line height
        sectionDiv.style.color = '#333';
        sectionDiv.style.fontWeight = isBold ? '600' : 'normal';
        sectionDiv.style.marginBottom = noGap ? '0' : (isSubsection ? subsectionGap + 'px' : sectionGap + 'px');
        
        // Create a wrapper div for the section
        const wrapperDiv = document.createElement('div');
        wrapperDiv.style.width = '100%';
        wrapperDiv.style.padding = '0 10px'; // Reduced from 20px
        
        // Add section title if provided
        if (title && !isSubsection) {
          const titleDiv = document.createElement('div');
          titleDiv.style.margin = '0 0 2px 0'; // Reduced bottom margin
          titleDiv.style.paddingBottom = '2px';
          titleDiv.style.borderBottom = '1px solid #f0f0f0'; // Lighter border
          titleDiv.innerHTML = `
            <h3 style="margin: 0; color: #2c3e50; font-size: 1.1em; font-weight: 600; line-height: 1.2;">
              ${title}
            </h3>
          `;
          wrapperDiv.appendChild(titleDiv);
        }
        
        // Add the content
        const contentDiv = document.createElement('div');
        contentDiv.style.margin = '0';
        contentDiv.style.padding = '0';
        contentDiv.style.lineHeight = '1.3'; // Tighter line height
        contentDiv.innerHTML = contentHtml;
        wrapperDiv.appendChild(contentDiv);
        
        // Add pickup and drop locations if they exist
        if (formData.pickupLocation || formData.dropLocation) {
          const locationDiv = document.createElement('div');
          locationDiv.style.marginTop = '4px';
          locationDiv.style.padding = '6px';
          locationDiv.style.background = '#f8f9fa';
          locationDiv.style.borderRadius = '4px';
          locationDiv.style.fontSize = '0.9em';
          
          let locationHtml = '<div style="display: flex; gap: 15px;">';
          if (formData.pickupLocation) {
            locationHtml += `
              <div style="flex: 1;">
                <div style="color: #7f8c8d; margin-bottom: 2px;">Pickup Location:</div>
                <div>${formData.pickupLocation}</div>
              </div>
            `;
          }
          if (formData.dropLocation) {
            locationHtml += `
              <div style="flex: 1;">
                <div style="color: #7f8c8d; margin-bottom: 2px;">Drop Location:</div>
                <div>${formData.dropLocation}</div>
              </div>
            `;
          }
          locationHtml += '</div>';
          
          locationDiv.innerHTML = locationHtml;
          wrapperDiv.appendChild(locationDiv);
        }
        
        // Add to document
        content.innerHTML = '';
        sectionDiv.appendChild(wrapperDiv);
        content.appendChild(sectionDiv);
        
        // Convert to canvas
        return html2canvas(sectionDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true,
          backgroundColor: null,
          scrollY: 0,
          windowWidth: 794, // A4 width in pixels at 96 DPI
          width: 794,
          x: 0,
          y: 0,
          onclone: (clonedDoc) => {
            // Ensure all styles are properly cloned
            const style = document.createElement('style');
            style.textContent = `
              @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
              body { 
                font-family: 'Open Sans', Arial, sans-serif;
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const imgProps = pdf.getImageProperties(imgData);
          const imgWidth = contentWidth;
          const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
          
          // Check if we need a new page
          if (currentY + imgHeight + margin > pageHeight) {
            currentPage++;
            currentY = addNewPage(pdf, currentPage);
          }
          
          // Add image to PDF
          pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + marginBottom;
          
          return currentY;
        });
      };
      
      // Add sections one by one with proper page breaks
      try {
        // Add Agent Information section
        await addSection('', `
          <div style="background-image: url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'); padding: 15px; border-radius: 6px; border-left: 4px solid #9b59b6; margin-bottom: 15px;">
            <div style="display: flex; align-items: center; gap: 50px;">
              <div style="width: 50px; height: 50px; border-radius: 50%; background: #9b59b6; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2em; font-weight: bold; flex-shrink: 0;">
                ${user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div>
                <h3 style="margin: 0 0 20px 0; color:rgb(255, 255, 255); font-size: 2em; line-height: 1.3; word-break: break-word; white-space: normal; max-width: 100%; padding: 0 10px; box-sizing: border-box;">
                  ${user?.name || 'Your Travel Partner'}
                </h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  ${user?.email ? `
                    <div style="color:rgb(255, 255, 255); font-size: 1.1em; display: flex; align-items: center; gap: 8px;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      ${user.email}
                    </div>` : ''}
                  ${user?.phoneNumber ? `
                    <div style="color:rgb(255, 255, 255); font-size: 1.1em; display: flex; align-items: center; gap: 8px;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      ${user.phoneNumber}
                    </div>` : ''}
                  ${user?.companyName ? `
                    <div style="color:rgb(255, 255, 255); font-size: 1.1em; margin-top: 5px; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                      </svg>
                      ${user.companyName}
                    </div>` : ''}
                </div>
              </div>
            </div>
          </div>
        `, { marginBottom: 1 });
        
        // Add Travelers section
        await addSection('', `
          <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #3498db;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px;">
              <div>
                <h4 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 1.05em; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px;">Passenger Contact Details</h4>
                <div style="display: grid; gap: 6px;">
                  <div style="display: flex;">
                    <span style="flex: 0 0 90px; color: #7f8c8d; font-size: 0.95em;">Name:</span>
                    <span style="font-size: 0.95em;">${formData.customerName || 'N/A'}</span>
                  </div>
                  <div style="display: flex;">
                    <span style="flex: 0 0 90px; color: #7f8c8d; font-size: 0.95em;">Email:</span>
                    <span style="font-size: 0.95em;">${formData.customerEmail || 'N/A'}</span>
                  </div>
                  <div style="display: flex;">
                    <span style="flex: 0 0 90px; color: #7f8c8d; font-size: 0.95em;">Phone:</span>
                    <span style="font-size: 0.95em;">${formData.customerPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 1.05em; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px;">Number of Passengers</h4>
                <div style="display: grid; gap: 6px;">
                  <div style="display: flex;">
                    <span style="flex: 0 0 90px; color: #7f8c8d; font-size: 0.95em;">Adults:</span>
                    <span style="font-size: 0.95em;">${formData.adults || 1}</span>
                  </div>
                  <div style="display: flex;">
                    <span style="flex: 0 0 90px; color: #7f8c8d; font-size: 0.95em;">Children:</span>
                    <span style="font-size: 0.95em;">${formData.children || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `, { marginBottom: 1 });
        
        // Add Flights section if exists
        if (formData.flights && formData.flights.length > 0) {
          await addSection('', `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #e74c3c;">
              ${formData.flights.map((flight, index) => `
                <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 5px; border: 1px solid #eee;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #2c3e50; display: flex; align-items: center; min-height: 100%;">Flight ${index + 1}: ${flight.airline || 'Airline'} ${flight.flightNumber || ''}</h4>
                    <span style="background: #f1c40f; color: #fff; padding: 5px 12px; border-radius: 4px; font-size: 0.8em; display: inline-block; text-align: center; min-width: 90px; line-height: 1.2;">
                      ${flight.flightType === 'roundtrip' ? 'Round Trip' : 'One Way'}
                    </span>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 15px; align-items: center;">
                    <div>
                      <div style="font-weight: bold; font-size: 1.2em;">${flight.from || 'N/A'}</div>
                      <div style="color: #7f8c8d; font-size: 0.9em;">${formatFlightTime(flight.departure)}</div>
                    </div>
                    <div style="text-align: center; color: #3b82f6; transform: rotate(45deg); margin: 0 5px;">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 2L11 13"></path>
                        <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                      </svg>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: bold; font-size: 1.2em;">${flight.to || 'N/A'}</div>
                      <div style="color: #7f8c8d; font-size: 0.9em;">${formatFlightTime(flight.arrival)}</div>
                    </div>
                  </div>
                  ${flight.confirmationNumber ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee;">
                      <strong>Confirmation #:</strong> ${flight.confirmationNumber}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `);
        }
        
        // Add Accommodation section if exists
        if (formData.hotels && formData.hotels.length > 0) {
          await addSection('', `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #2ecc71;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: #2c3e50;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                  <line x1="6" y1="1" x2="6" y2="4"></line>
                  <line x1="10" y1="1" x2="10" y2="4"></line>
                  <line x1="14" y1="1" x2="14" y2="4"></line>
                </svg>
                <h3 style="margin: 0; font-size: 1.2em;">Accommodation</h3>
              </div>
              ${formData.hotels.map((hotel, index) => `
                <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 5px; border: 1px solid #eee;">
                  <h4 style="margin-top: 0; margin-bottom: 10px; color: #2c3e50;">${hotel.name || `Hotel ${index + 1}`}</h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                      <p style="margin: 3px 0; font-size: 0.9em;"><strong style="font-size: 0.9em;">Check-in:</strong> ${hotel.checkIn ? format(parseISO(hotel.checkIn), 'EEE, MMM d, yyyy') : 'N/A'}</p>
                      <p style="margin: 3px 0; font-size: 0.9em;"><strong style="font-size: 0.9em;">Check-out:</strong> ${hotel.checkOut ? format(parseISO(hotel.checkOut), 'EEE, MMM d, yyyy') : 'N/A'}</p>
                    </div>
                    <div>
                      ${hotel.roomType ? `<p style="margin: 5px 0;"><strong>Room Type:</strong> ${hotel.roomType}</p>` : ''}
                      ${hotel.confirmationNumber ? `<p style="margin: 5px 0;"><strong>Confirmation #:</strong> ${hotel.confirmationNumber}</p>` : ''}
                    </div>
                  </div>
                  ${hotel.address ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee; color: #666;">
                      <strong>Address:</strong> ${hotel.address}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `);
        }
        
        // Add Daily Itinerary section with proper page breaks
        if (itineraryDays && itineraryDays.length > 0) {
          // Add a new page for the first day
          currentPage++;
          currentY = addNewPage(pdf, currentPage, 'Daily Itinerary');
          
          for (let dayIndex = 0; dayIndex < itineraryDays.length; dayIndex++) {
            const day = itineraryDays[dayIndex];
            const date = typeof day.date === 'string' ? new Date(day.date) : day.date;
            
            // For the first day, we've already added a new page
            // For subsequent days, just add some space
            if (dayIndex > 0) {
              // Add more space between days
              currentY += 15;
              
              // Draw a subtle separator between days
              pdf.setDrawColor(230, 230, 230);
              pdf.setLineWidth(0.5);
              pdf.line(margin, currentY - 5, pageWidth - margin, currentY - 5);
              
              // Add some space after the separator
              currentY += 5;
            }
            
            // Check if we need a new page (only if we're not at the top of a new page)
            if (currentY > margin + 20 && currentY + 100 > pageHeight - margin) {
              currentPage++;
              currentY = addNewPage(pdf, currentPage, 'Daily Itinerary (continued)');
            }
            
            // Add day header with a colored background
            const dayHeaderHeight = 10;
            
            // Save current graphics state
            pdf.saveGraphicsState();
            
            // Add colored background for day header
            pdf.setFillColor(52, 152, 219);
            pdf.roundedRect(
              margin, 
              currentY - 2, 
              contentWidth, 
              dayHeaderHeight + 4, 
              2, 2, 'F'
            );
            
            // Add day text
            pdf.setFontSize(11);
            pdf.setTextColor(255, 255, 255);
            pdf.setFont(undefined, 'bold');
            const dayTitle = `Day ${dayIndex + 1}: ${format(date, 'EEEE, MMMM d, yyyy')}`;
            pdf.text(dayTitle, margin + 5, currentY + dayHeaderHeight - 3);
            
            // Restore graphics state
            pdf.restoreGraphicsState();
            
            currentY += dayHeaderHeight + 8; // Add some space after the header
            
            // Add activities for the day
            if (day.activities && day.activities.length > 0) {
              for (const activity of day.activities) {
                // Check if we need a new page for this activity
                if (currentY > pageHeight - 40) { // Leave room for at least a small activity
                  currentPage++;
                  currentY = addNewPage(pdf, currentPage, 'Daily Itinerary (continued)');
                }
                
                // Create activity element
                const activityDiv = document.createElement('div');
                activityDiv.style.marginBottom = '15px';
                activityDiv.style.border = '1px solid #e0e0e0';
                activityDiv.style.borderRadius = '6px';
                activityDiv.style.overflow = 'hidden';
                
                // Add activity header with time
                activityDiv.innerHTML = `
                  <div style="background: #f5f5f5; padding: 8px 15px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: 600; color: #333;">${activity.pickupTime || 'Time TBD'}</div>
                    ${activity.type ? `
                      <div style="background: #e3f2fd; color: #1565c0; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500;">
                        ${activity.type}
                      </div>` : ''}
                  </div>
                  <div style="padding: 15px; background: white;">
                    ${activity.name ? `
                      <h3 style="margin: 0 0 10px 0; color: #1a237e; font-size: 16px; font-weight: 600;">
                        ${activity.name}
                      </h3>` : ''}
                    ${activity.description ? `
                      <div style="color: #555; font-size: 0.95em; line-height: 1.5; margin-bottom: 10px;">
                        ${activity.description}
                      </div>` : ''}
                    ${(activity.pickupLocation || activity.dropLocation) ? `
                      <div style="margin-top: 10px; background: #f8f9fa; border-radius: 6px; padding: 12px; border: 1px solid #e9ecef;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                          ${activity.pickupLocation ? `
                            <div>
                              <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; margin-bottom: 3px;">Pickup</div>
                              <div style="font-weight: 500; font-size: 0.95em;">${activity.pickupLocation}</div>
                            </div>` : ''}
                          ${activity.dropLocation ? `
                            <div>
                              <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; margin-bottom: 3px;">Drop-off</div>
                              <div style="font-weight: 500; font-size: 0.95em;">${activity.dropLocation}</div>
                            </div>` : ''}
                        </div>
                      </div>` : ''}
                    ${activity.cost || activity.location ? `
                      <div style="margin-top: 10px; display: grid; grid-template-columns: ${activity.cost && activity.location ? '1fr 1fr' : '1fr'}; gap: 10px;">
                        ${activity.cost ? `
                          <div>
                            <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; margin-bottom: 3px;">Price</div>
                            <div style="font-size: 14px; color: #27ae60; font-weight: 600;">${formatPrice(activity.cost)}</div>
                          </div>` : ''}
                        ${activity.location ? `
                          <div>
                            <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; margin-bottom: 3px;">Location</div>
                            <div style="font-size: 14px; color: #2c3e50; font-weight: 500;">${activity.location}</div>
                          </div>` : ''}
                      </div>` : ''}
                    ${activity.notes ? `
                      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #dee2e6;">
                        <div style="font-size: 12px; color: #6c757d; margin-bottom: 5px;">Notes:</div>
                        <div style="font-size: 13px; color: #495057; line-height: 1.5;">${activity.notes}</div>
                      </div>` : ''}
                  </div>
                `;
                
                // Add activity to the document
                content.innerHTML = '';
                content.appendChild(activityDiv);
                
                // Convert to canvas and add to PDF
                const canvas = await html2canvas(activityDiv, {
                  scale: 2,
                  useCORS: true,
                  allowTaint: true,
                  backgroundColor: null,
                  scrollY: 0,
                  windowWidth: 794, // A4 width in pixels at 96 DPI
                  width: 794
                });
                
                const imgData = canvas.toDataURL('image/png');
                const imgProps = pdf.getImageProperties(imgData);
                const imgWidth = contentWidth;
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                
                // Add to PDF if there's enough space, otherwise add a new page
                if (currentY + imgHeight > pageHeight - margin) {
                  currentPage++;
                  currentY = addNewPage(pdf, currentPage, 'Daily Itinerary (continued)');
                }
                
                pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
                currentY += imgHeight + 5; // Add small space after activity
              }
            } else {
              // No activities for this day
              pdf.setFontSize(10);
              pdf.setTextColor(100, 100, 100);
              pdf.setFont(undefined, 'italic');
              pdf.text('No activities scheduled for this day.', margin + 5, currentY);
              currentY += lineHeight;
            }
          }
        }
        
        // Add footer to the last page
        pdf.setPage(currentPage);
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Thank you for choosing ${user?.companyName || 'our travel services'}`,
          pageWidth / 2,
          pageHeight - margin - 10,
          { align: 'center' }
        );
        
        // Save the PDF
        const fileName = `Itinerary_${formData.customerName ? formData.customerName.replace(/\s+/g, '_') : 'Customer'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        pdf.save(fileName);
        
        // Clean up
        document.body.removeChild(content);
        toast.success('PDF generated successfully!');
      } catch (err) {
        console.error('Error generating PDF section:', err);
        throw err;
      }
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold">{user?.companyName || 'Agency Name'}</h1>
        <div className="text-sm text-gray-600">
          <p>ID: {user?._id || 'N/A'}</p>
          <p>Email: {user?.email || 'N/A'}</p>
          <p>Phone: {user?.phone || 'N/A'}</p>
        </div>
      </header>

      {/* Customer Information */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name + Query code*</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone *</label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Destination *</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </section>

        {/* Travel Dates and Passengers */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Travel Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Arrival Date *</label>
              <input
                type="date"
                name="arrivalDate"
                value={formData.arrivalDate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Departure Date *</label>
              <input
                type="date"
                name="departureDate"
                value={formData.departureDate}
                onChange={handleInputChange}
                min={formData.arrivalDate}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Adults *</label>
              <input
                type="number"
                name="adults"
                min="1"
                value={formData.adults}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Children</label>
              <input
                type="number"
                name="children"
                min="0"
                value={formData.children}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Hotels Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Hotel Details</h2>
            {formData.hotels.length < 7 && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  hotels: [...prev.hotels, { name: '', checkIn: '', checkOut: '', confirmationNumber: '' }]
                }))}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
              >
                + Add Hotel
              </button>
            )}
          </div>
          {formData.hotels.map((hotel, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 relative border p-4 rounded-lg bg-gray-50">
              {formData.hotels.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const updatedHotels = [...formData.hotels];
                    updatedHotels.splice(index, 1);
                    setFormData(prev => ({
                      ...prev,
                      hotels: updatedHotels
                    }));
                  }}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  title="Remove hotel"
                >
                  ✕
                </button>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Hotel {index + 1} Name *</label>
                <input
                  type="text"
                  value={hotel.name}
                  onChange={(e) => handleHotelChange(index, 'name', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Check-in *</label>
                <input
                  type="date"
                  value={hotel.checkIn ? (typeof hotel.checkIn === 'string' ? hotel.checkIn.split('T')[0] : format(new Date(hotel.checkIn), 'yyyy-MM-dd')) : ''}
                  onChange={(e) => handleHotelChange(index, 'checkIn', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Check-out *</label>
                <input
                  type="date"
                  value={hotel.checkOut ? (typeof hotel.checkOut === 'string' ? hotel.checkOut.split('T')[0] : format(new Date(hotel.checkOut), 'yyyy-MM-dd')) : ''}
                  onChange={(e) => handleHotelChange(index, 'checkOut', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min={hotel.checkIn || ''}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmation #</label>
                <input
                  type="text"
                  value={hotel.confirmationNumber || ''}
                  onChange={(e) => handleHotelChange(index, 'confirmationNumber', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>
          ))}
        </section>

        {/* Flights Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Flight Details</h2>
            {formData.flights.length < 15 && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  flights: [...prev.flights, { flightNumber: '', from: '', to: '', departure: '', arrival: '' }]
                }))}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
              >
                + Add Flight
              </button>
            )}
          </div>
          {formData.flights.map((flight, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 relative border p-4 rounded-lg bg-gray-50">
              {formData.flights.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const updatedFlights = [...formData.flights];
                    updatedFlights.splice(index, 1);
                    setFormData(prev => ({
                      ...prev,
                      flights: updatedFlights
                    }));
                  }}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  title="Remove flight"
                >
                  ✕
                </button>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Flight {index + 1} *</label>
                <input
                  type="text"
                  placeholder="Flight Number"
                  value={flight.flightNumber}
                  onChange={(e) => handleFlightChange(index, 'flightNumber', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">From *</label>
                <input
                  type="text"
                  placeholder="Origin"
                  value={flight.from}
                  onChange={(e) => handleFlightChange(index, 'from', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">To *</label>
                <input
                  type="text"
                  placeholder="Destination"
                  value={flight.to}
                  onChange={(e) => handleFlightChange(index, 'to', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Departure *</label>
                <input
                  type="datetime-local"
                  value={flight.departure}
                  onChange={(e) => handleFlightChange(index, 'departure', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Arrival *</label>
                <input
                  type="datetime-local"
                  value={flight.arrival}
                  onChange={(e) => handleFlightChange(index, 'arrival', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          ))}
        </section>

        {/* Itinerary Days */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Itinerary</h2>
          {itineraryDays.map((day, dayIndex) => (
            <div key={dayIndex} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">
                Day {dayIndex + 1}: {format(day.date, 'EEEE, MMMM d, yyyy')}
              </h3>
              
              {/* Activities */}
              <div className="space-y-4">
                {day.activities.map((activity, activityIndex) => (
                  <div key={activityIndex} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{activity.name}</h4>
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {activity.pickupTime || 'Time TBD'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        
                        {/* Pickup and Drop-off Information */}
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium">Pickup:</span> {activity.pickupLocation || 'Location to be confirmed'}
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="font-medium">Drop-off:</span> {activity.dropLocation || 'Location to be confirmed'}
                          </div>
                        </div>
                        {activity.images?.[0] && (
                          <div className="grid grid-cols-1 gap-3 p-3 bg-gray-50 rounded">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Transfer Type</label>
                              <select
                                value={activity.transferType || 'private'}
                                onChange={(e) => updateActivity(dayIndex, activityIndex, 'transferType', e.target.value)}
                                className="w-full p-2 border rounded-md text-sm"
                              >
                                <option value="private">Private Transfer</option>
                                <option value="shared">Shared Transfer</option>
                                <option value="self">Self-Arranged</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Pickup Time</label>
                              <input
                                type="time"
                                value={activity.pickupTime}
                                onChange={(e) => updateActivity(dayIndex, activityIndex, 'pickupTime', e.target.value)}
                                className="w-full p-2 border rounded-md text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Pickup Location</label>
                              <input
                                type="text"
                                placeholder="E.g., Hotel Lobby"
                                value={activity.pickupLocation}
                                onChange={(e) => updateActivity(dayIndex, activityIndex, 'pickupLocation', e.target.value)}
                                className="w-full p-2 border rounded-md text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Drop-off Location</label>
                              <input
                                type="text"
                                placeholder="E.g., Activity Venue"
                                value={activity.dropLocation}
                                onChange={(e) => updateActivity(dayIndex, activityIndex, 'dropLocation', e.target.value)}
                                className="w-full p-2 border rounded-md text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                              <textarea
                                placeholder="Special instructions or requirements"
                                value={activity.notes}
                                onChange={(e) => updateActivity(dayIndex, activityIndex, 'notes', e.target.value)}
                                rows="2"
                                className="w-full p-2 border rounded-md text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeActivity(dayIndex, activityIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Activity Button */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => openActivityModal(dayIndex)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  + Add Activity
                </button>
              </div>

              {/* Add Activity Modal */}
              {activityModal === dayIndex && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Add New Activity</h3>
                        <button
                          type="button"
                          onClick={closeActivityModal}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <span className="sr-only">Close</span>
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Activity Name *</label>
                          <input
                            type="text"
                            value={newActivity.name}
                            onChange={handleActivityNameChange}
                            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="E.g., City Tour"
                            autoFocus
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={newActivity.description}
                            onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            rows="2"
                            placeholder="Brief description of the activity"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                            <input
                              type="text"
                              value={newActivity.pickupLocation}
                              onChange={(e) => setNewActivity({...newActivity, pickupLocation: e.target.value})}
                              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="E.g., Hotel Lobby"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Drop-off Location</label>
                            <input
                              type="text"
                              value={newActivity.dropLocation}
                              onChange={(e) => setNewActivity({...newActivity, dropLocation: e.target.value})}
                              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="E.g., Activity Venue"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                          <input
                            type="time"
                            value={newActivity.pickupTime}
                            onChange={(e) => setNewActivity({...newActivity, pickupTime: e.target.value})}
                            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">AI Generated Info</label>
                          <div className="relative">
                            <textarea
                              value={newActivity.aiInfo}
                              onChange={(e) => setNewActivity(prev => ({...prev, aiInfo: e.target.value}))}
                              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                              rows="3"
                              placeholder="AI generated information about the activity..."
                            />
                            {newActivity.aiInfo && (
                              <span className="absolute top-2 right-2 text-xs text-gray-500 bg-white/80 px-2 py-0.5 rounded">
                                AI Generated
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                          <div className="mt-1 flex items-center">
                            <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                              {newActivity.image ? (
                                <img src={URL.createObjectURL(newActivity.image)} alt="Preview" className="h-full w-full object-cover" />
                              ) : (
                                <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                              )}
                            </span>
                            <label className="ml-5">
                              <span className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                                Choose
                              </span>
                              <input
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={(e) => setNewActivity({...newActivity, image: e.target.files[0]})}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={closeActivityModal}
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddManualActivity(dayIndex)}
                          disabled={!newActivity.name.trim()}
                          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${!newActivity.name.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          Add Activity
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={downloadPDF}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Download PDF
          </button>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Itinerary
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItineraryCreator;
