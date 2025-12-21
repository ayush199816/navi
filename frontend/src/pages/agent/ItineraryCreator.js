import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO, isValid, addDays, differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../utils/api';

// Utility function to format currency
const formatPrice = (amount, currency = 'INR') => {
  if (typeof amount !== 'number') return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Utility function to format date in local timezone
const formatLocalDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    try {
        // Parse the date string and adjust for local timezone
        const date = new Date(dateString);
        if (!isValid(date)) return 'Invalid Date';
        
        // Format the date in local timezone
        // Use the 'P' format to include the timezone offset
        return format(date, 'EEEE, MMMM d, yyyy');
    } catch (e) {
        return 'Invalid Date';
    }
};

// Utility to get local date string without timezone issues
const toLocalDateString = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

// Utility function to format date/time for flights
const formatFlightTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
        const date = new Date(dateTimeString);
        return isValid(date) ? format(date, 'MMM d, h:mm a') : 'N/A';
    } catch (e) {
        return 'N/A';
    }
};

const ItineraryCreator = (props) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [priceData, setPriceData] = useState({
    amount: '',
    type: 'per_person', // 'per_person' or 'total'
    currency: '₹' // Default currency symbol
  });
  const [itineraryId, setItineraryId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { id } = useParams();
  
  // --- State Initialization ---

  const [itineraryDays, setItineraryDays] = useState([
    // Placeholder initial state structure for days (will be populated in useEffect)
    // { date: new Date(), activities: [] }
  ]);
  
  const [activityModal, setActivityModal] = useState(null);
  
  const [newActivity, setNewActivity] = useState({
    name: '',
    description: '',
    pickupTime: '',
    notes: '',
    image: null,
    pickupLocation: '',
    dropLocation: '',
    type: 'Activity',
    cost: '',
    location: '',
    aiInfo: ''
  });

  const [showHotelSection, setShowHotelSection] = useState(true);
  const [showFlightSection, setShowFlightSection] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    destination: '',
    arrivalDate: '',
    departureDate: '',
    adults: 1,
    children: 0,
    budget: '',
    notes: '',
    additionalNotes: '',
    hotels: [
      { name: '', checkIn: '', checkOut: '', roomType: '', confirmationNumber: '' }
    ],
    flights: [
      { airline: '', flightNumber: '', departure: '', arrival: '', from: '', to: '', confirmationNumber: '' }
    ]
  });

  // Initialize days when arrival and departure dates change
  useEffect(() => {
    if (formData.arrivalDate && formData.departureDate && !id) {
      const startDate = new Date(formData.arrivalDate);
      const endDate = new Date(formData.departureDate);
      
      // Only proceed if dates are valid and in the correct order
      if (isValid(startDate) && isValid(endDate) && startDate <= endDate) {
        const daysCount = differenceInDays(endDate, startDate) + 1;
        const generatedDays = [];
        
        for (let i = 0; i < daysCount; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          
          // Check if we already have this day in the state
          const existingDay = itineraryDays[i];
          
          if (existingDay) {
            // Keep existing day data but update the date
            generatedDays.push({
              ...existingDay,
              date: currentDate.toISOString()
            });
          } else {
            // Create a new day
            generatedDays.push({
              day: i + 1,
              date: currentDate.toISOString(),
              activities: [],
              meals: {
                breakfast: { included: false },
                lunch: { included: false },
                dinner: { included: false }
              }
            });
          }
        }
        
        // Only update if the number of days has changed or it's a new itinerary
        if (generatedDays.length !== itineraryDays.length || !itineraryDays.length) {
          setItineraryDays(generatedDays);
        }
      }
    }
  }, [formData.arrivalDate, formData.departureDate, id, itineraryDays]);

  // Fetch itinerary data when in edit mode
  useEffect(() => {
    const fetchItinerary = async () => {
      if (id) {
        try {
          setLoading(true);
          const response = await api.get(`/itineraries/${id}`);
          const itinerary = response.data.data;
          
          // Format dates for input fields (YYYY-MM-DD format)
          const formatDateForInput = (dateString) => {
            if (!dateString) return '';
            try {
              const date = new Date(dateString);
              return format(date, 'yyyy-MM-dd');
            } catch (e) {
              return '';
            }
          };

          // Update form data with fetched itinerary
          setFormData({
            title: itinerary.title || '',
            customerName: itinerary.customerName || '',
            customerEmail: itinerary.customerEmail || '',
            customerPhone: itinerary.customerPhone || '',
            destination: itinerary.destination || '',
            arrivalDate: formatDateForInput(itinerary.arrivalDate),
            departureDate: formatDateForInput(itinerary.departureDate),
            adults: itinerary.adults || 1,
            children: itinerary.children || 0,
            budget: itinerary.budget || '',
            notes: itinerary.notes || '',
            hotels: itinerary.hotels?.length ? itinerary.hotels : [
              { name: '', checkIn: '', checkOut: '', roomType: '', confirmationNumber: '' }
            ],
            flights: itinerary.flights?.length ? itinerary.flights.map(flight => ({
              ...flight,
              departure: flight.departure ? format(new Date(flight.departure), "yyyy-MM-dd'T'HH:mm") : '',
              arrival: flight.arrival ? format(new Date(flight.arrival), "yyyy-MM-dd'T'HH:mm") : ''
            })) : [
              { airline: '', flightNumber: '', departure: '', arrival: '', from: '', to: '', confirmationNumber: '' }
            ]
          });

          // Set itinerary days if available
          if (itinerary.days?.length) {
            // First, ensure all days have a valid date
            const daysWithValidDates = itinerary.days.map((day) => {
              try {
                let dayDate;
                const dateString = day.date || day.day || itinerary.arrivalDate;
                
                if (dateString) {
                  // Create date in local timezone
                  dayDate = new Date(dateString);
                  // If the date is invalid, use the arrival date
                  if (isNaN(dayDate.getTime())) {
                    dayDate = new Date(itinerary.arrivalDate);
                  }
                } else {
                  dayDate = new Date(itinerary.arrivalDate);
                }
                
                return {
                  ...day,
                  _date: dayDate, // Store the date object for sorting
                  date: dayDate.toISOString(),
                  activities: Array.isArray(day.activities) ? day.activities : []
                };
              } catch (e) {
                const fallbackDate = new Date(itinerary.arrivalDate);
                return {
                  ...day,
                  _date: fallbackDate,
                  date: fallbackDate.toISOString(),
                  activities: Array.isArray(day.activities) ? day.activities : []
                };
              }
            });
            
            // Sort days by date
            const sortedDays = [...daysWithValidDates].sort((a, b) => {
              return a._date - b._date;
            });
            
            // Add day numbers and clean up temporary _date property
            const formattedDays = sortedDays.map((day, index) => ({
              ...day,
              day: index + 1,
              // Remove the temporary _date property
              _date: undefined
            }));
            
            setItineraryDays(formattedDays);
          } else if (itinerary.arrivalDate && itinerary.departureDate) {
            // If no days data but we have dates, create days array
            const startDate = new Date(itinerary.arrivalDate);
            const endDate = new Date(itinerary.departureDate);
            const daysCount = differenceInDays(endDate, startDate) + 1;
            
            const generatedDays = [];
            for (let i = 0; i < daysCount; i++) {
              const currentDate = new Date(startDate);
              currentDate.setDate(startDate.getDate() + i);
              
              // Format the date in local timezone for display
              const dateString = currentDate.toISOString();
              
              generatedDays.push({
                day: i + 1,
                date: dateString,
                activities: [],
                meals: {
                  breakfast: { included: false },
                  lunch: { included: false },
                  dinner: { included: false }
                }
              });
            }
            
            setItineraryDays(generatedDays);
          }
          
          setIsEditMode(true);
          setItineraryId(id);
        } catch (error) {
          toast.error('Failed to load itinerary data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchItinerary();
  }, [id]);

  // --- Utility Functions ---

  // Define calculateDaysStable first
  const calculateDaysStable = useCallback((arrival, departure) => {
    if (!arrival || !departure) return [];
    
    const start = new Date(arrival);
    const end = new Date(departure);
    
    if (!isValid(start) || !isValid(end) || differenceInDays(end, start) < 0) {
      return [];
    }

    const daysCount = differenceInDays(end, start) + 1;
    return Array.from({ length: daysCount }, (_, i) => ({
      date: format(addDays(start, i), 'yyyy-MM-dd'),
      day: i + 1,
      activities: []
    }));
  }, []);

  // Only calculate days if we're not in edit mode or if we don't have days yet
  useEffect(() => {
    if (!id && formData.arrivalDate && formData.departureDate) {
      const newDays = calculateDaysStable(formData.arrivalDate, formData.departureDate);
      setItineraryDays(prevDays => (!prevDays?.length ? newDays : prevDays));
    }
  }, [formData.arrivalDate, formData.departureDate, id, calculateDaysStable]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev, 
      [name]: value,
      // Update the other date field's min/max when one changes
      ...(name === 'arrivalDate' ? { departureDate: prev.departureDate < value ? '' : prev.departureDate } : {}),
      ...(name === 'departureDate' ? { arrivalDate: prev.arrivalDate > value ? '' : prev.arrivalDate } : {})
    }));
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Set a default title if not provided
      if (!formData.title) {
        const customerName = formData.customerName || 'Customer';
        const destination = formData.destination || 'Destination';
        formData.title = `${customerName}'s ${destination} Itinerary`;
      }

      // Ensure required fields are present
      if (!formData.destination) {
        throw new Error('Please specify a destination for the itinerary');
      }

      // Filter out empty hotel entries
      const validHotels = formData.hotels.filter(hotel => 
        hotel.name && hotel.name.trim() !== '' && 
        hotel.checkIn && hotel.checkOut
      );

      // Filter out empty flight entries
      const validFlights = formData.flights.filter(flight => 
        (flight.airline || flight.flightNumber) && 
        flight.from && flight.to && 
        flight.departure && flight.arrival
      );

      // Prepare the data to send
      const itineraryData = {
        ...formData,
        title: formData.title, // Ensure title is included
        days: itineraryDays,
        // Only include hotels and flights if they have valid data
        hotels: validHotels.length > 0 ? validHotels : [],
        flights: validFlights.length > 0 ? validFlights : [],
        // Ensure dates are in ISO format
        arrivalDate: formData.arrivalDate ? new Date(formData.arrivalDate).toISOString() : new Date().toISOString(),
        departureDate: formData.departureDate 
          ? new Date(formData.departureDate).toISOString() 
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        // Set default status if not provided
        status: formData.status || 'draft',
      };

      // Make the API call (POST for create, PUT for update)
      console.log('Submitting itinerary data:', JSON.stringify(itineraryData, null, 2));
      let response;
      try {
        if (isEditMode && itineraryId) {
          response = await api.put(`/itineraries/${itineraryId}`, itineraryData);
        } else {
          response = await api.post('/itineraries', itineraryData);
        }
        console.log('API Response:', response);
      } catch (apiError) {
        console.error('API Error:', apiError);
        if (apiError.response) {
          console.error('Response data:', apiError.response.data);
          console.error('Response status:', apiError.response.status);
          console.error('Response headers:', apiError.response.headers);
        }
        throw apiError; // Re-throw to be caught by the outer catch
      }
      
      // Handle success
      toast.success('Itinerary saved successfully!');
      
      // Redirect to the itineraries list or view page
      navigate('/agent/itineraries');
      
    } catch (error) {
      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        if (error.response.status === 401) {
          toast.error('Session expired. Please log in again.');
          navigate('/login');
          return;
        }
        
        // Check if the response is HTML instead of JSON
        const contentType = error.response.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
          toast.error('Server error: Received an unexpected response. Please try again later.');
          return;
        }
        
        // Show error message from server if available
        const errorMessage = error.response.data?.message || 'Failed to save itinerary';
        toast.error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        toast.error('Network error. Please check your connection and try again.');
      } else {
        // Something happened in setting up the request
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHotelChange = (index, field, value) => {
    const updatedHotels = [...formData.hotels];
    updatedHotels[index] = { ...updatedHotels[index], [field]: value };
    setFormData(prev => ({ ...prev, hotels: updatedHotels }));
  };

  const handleFlightChange = (index, field, value) => {
    const updatedFlights = [...formData.flights];
    updatedFlights[index] = { ...updatedFlights[index], [field]: value };
    setFormData(prev => ({ ...prev, flights: updatedFlights }));
  };

  const openActivityModal = (dayIndex) => {
    setNewActivity({
      name: '', description: '', pickupTime: '', notes: '', image: null,
      pickupLocation: '', dropLocation: '', type: 'Activity', cost: '', location: '', aiInfo: ''
    });
    setActivityModal(dayIndex);
  };

  const closeActivityModal = () => {
    setActivityModal(null);
  };
  
  const handleActivityNameChange = (e) => {
    setNewActivity({...newActivity, name: e.target.value});
    // In a real app, you might trigger AI lookup here
  };

  const handleAddManualActivity = (dayIndex) => {
    if (!newActivity.name.trim()) {
      toast.error("Activity name is required.");
      return;
    }

    const activityToAdd = {
      ...newActivity,
      // In a real app, you'd upload the image and store the URL here
      images: newActivity.image ? ['/placeholder-image-url.jpg'] : []
    };

    const updatedDays = [...itineraryDays];
    updatedDays[dayIndex].activities.push(activityToAdd);
    setItineraryDays(updatedDays);
    closeActivityModal();
    toast.success('Activity added successfully!');
  };

  const removeActivity = (dayIndex, activityIndex) => {
    const updatedDays = [...itineraryDays];
    updatedDays[dayIndex].activities.splice(activityIndex, 1);
    setItineraryDays(updatedDays);
    toast.warn('Activity removed.');
  };

  // --- PDF Generation Logic (The main focus of the correction) ---

  /**
   * Generates the PDF by rendering HTML sections to canvas and adding them to jsPDF.
   * This is a simplified function to fix the syntax error. The original structure of
   * addSection is too complex to be defined and correctly used outside of a utility
   * file without all dependencies. I am restoring the original provided logic.
   */
  const generatePdf = async () => {
    setLoading(true);
    
    // Create a temporary content div outside the main component's render tree
    const content = document.createElement('div');
    content.id = 'pdf-content';
    content.style.position = 'absolute';
    content.style.top = '-9999px';
    content.style.left = '-9999px';
    content.style.width = '794px'; // A4 width at 96 DPI
    document.body.appendChild(content);

    try {
      // Initialize PDF
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - 2 * margin;
      let currentPage = 1;
      let currentY = margin;
      const lineHeight = 14;

      // Add new page function
      const addNewPage = (pdf, pageNumber, title) => {
        if (pageNumber > 1) {
          pdf.addPage();
        }
        
        // Add blue title with client name and Travel Itinerary
        pdf.setFontSize(16); // Reduced by 5px from 21
        pdf.setTextColor(0, 71, 171); // Dark blue
        pdf.setFont(undefined, 'bold');
        
        // Client name with 'Travel Itinerary'
        const clientTitle = `${formData.customerName || 'Customer'}'s Travel Itinerary`;
        const clientTitleWidth = pdf.getTextWidth(clientTitle);
        pdf.text(clientTitle, (pageWidth - clientTitleWidth) / 2, 25);
        
        // Country name below the title
        if (formData.destination) {
          pdf.setFontSize(12);
          const countryTitle = formData.destination;
          const countryTitleWidth = pdf.getTextWidth(countryTitle);
          pdf.text(countryTitle, (pageWidth - countryTitleWidth) / 2, 40);
        }
        
        // Add blue line after header
        pdf.setDrawColor(0, 71, 171);
        pdf.setLineWidth(1);
        pdf.line(margin, 50, pageWidth - margin, 50);
        
        // Add page title if provided
        if (title) {
          pdf.setFontSize(14); // Reduced by 5px from 19
          pdf.setTextColor(0, 0, 0);
          pdf.text(title, margin, 70);
          return 80; // Return Y position after header
        }
        
        return 60; // Return Y position after header
      };

      // Add section function (Uses html2canvas for complex HTML rendering)
      const addSection = async (title, contentHtml, options = {}) => {
        const { marginBottom = 10 } = options;
        const fontSize = 12;
        const sectionGap = 15;
        const subsectionGap = 10;
        const isSubsection = false;
        const isBold = false;
        const noGap = false;
        
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
            <h3 style="margin: 0; color: #2c3e50; font-size: 1.1em; font-weight: 600;">
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
        
        // Add pickup and drop locations if they exist (Restored logic from original)
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
          backgroundColor: null,
          scrollY: 0,
          windowWidth: 794,
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
      

      // Add Agent Information section with optional price
      await addSection('', `
        <div style="
          background: url('https://res.cloudinary.com/dqlcup2s7/image/upload/v1758475269/navi/guestsightseeing/mb9nxjwcrdwevptwxqxi.jpg');
          background-size: cover;
          background-position: center;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #9b59b6;
          margin-bottom: 8px;
          position: relative;
          overflow: hidden;
          color: white;
        ">
          <div style="position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="display: flex; align-items: center; gap: 20px; flex: 1;">
              <div style="width: 50px; height: 50px; border-radius: 50%; background: #9b59b6; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2em; font-weight: bold; flex-shrink: 0;">
                ${user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div style="color: white;">
                <h3 style="margin: 0 0 5px 0; color: white; font-size: 1.4em; line-height: 1.3; font-weight: 600;">
                  ${user?.name || 'Your Travel Partner'}
                </h3>
              <div style="display: flex; flex-direction: column; gap: 5px;">
                ${user?.email ? `
                  <div style="font-size: 0.9em; display: flex; align-items: center; gap: 5px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #3498db;">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    ${user.email}
                  </div>` : ''}
                ${user?.phoneNumber ? `
                  <div style="font-size: 0.9em; display: flex; align-items: center; gap: 5px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #3498db;">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    ${user.phoneNumber}
                  </div>` : ''}
                ${user?.companyName ? `
                  <div style="font-size: 0.9em; font-weight: 500; display: flex; align-items: center; gap: 5px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #3498db;">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                      <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                    ${user.companyName}
                  </div>` : ''}
              </div>
            </div>
            ${showPrice && priceData.amount ? `
              <div style="background: rgba(255, 255, 255, 0.2); margin-left: 325px; padding: 10px 20px; border-radius: 8px; text-align: right; backdrop-filter: blur(5px);">
                <div style="font-size: 0.9em; opacity: 0.9; margin-bottom: 5px;">
                  ${priceData.type === 'per_person' ? 'Starting from' : 'Total Price'}
                </div>
                <div style="font-size: 2em; font-weight: 700; line-height: 1;">
                  ${priceData.currency}${parseFloat(priceData.amount).toLocaleString('en-IN')}
                </div>
                <div style="font-size: 0.9em; opacity: 0.9; margin-top: 3px;">
                  ${priceData.type === 'per_person' ? 'per person' : 'for all travelers'}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `, { marginBottom: 5 });
      
      // Add Travelers section
      await addSection('', `
        <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 4px solid #3498db; margin-bottom: 8px;">
          <h2 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 1.2em; font-weight: 600;">Trip Summary</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <p style="margin: 0 0 4px 0;"><strong style="color: #7f8c8d;">Customer:</strong> ${formData.customerName || 'N/A'}</p>
              <p style="margin: 0 0 4px 0;"><strong style="color: #7f8c8d;">Email:</strong> ${formData.customerEmail || 'N/A'}</p>
              <p style="margin: 0 0 4px 0;"><strong style="color: #7f8c8d;">Destination:</strong> ${formData.destination || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 0 0 4px 0;"><strong style="color: #7f8c8d;">Dates:</strong> ${formData.arrivalDate} to ${formData.departureDate}</p>
              <p style="margin: 0 0 4px 0;"><strong style="color: #7f8c8d;">Adults:</strong> ${formData.adults || 1}</p>
              <p style="margin: 0 0 4px 0;"><strong style="color: #7f8c8d;">Children:</strong> ${formData.children || 0}</p>
            </div>
          </div>
        </div>
      `, { marginBottom: 5 });
      
      // Add Flights section if exists and visible
      if (showFlightSection && formData.flights && formData.flights.length > 0) {
        const validFlights = formData.flights.filter(flight => 
          (flight.airline || flight.flightNumber || flight.from || flight.to) && 
          flight.from && flight.to
        );
        
        if (validFlights.length > 0) {
          currentY = await addSection('', `
            <div style="background: #f8f9fa; padding: 12px; border-radius: 5px; border-left: 4px solid #e74c3c; margin-bottom: 8px;">
              ${validFlights.map((flight, index) => `
                <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 5px; border: 1px solid #eee;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #2c3e50; font-size: 1.1em; font-weight: 600;">
                      ${flight.airline || flight.flightNumber ? `Flight ${index + 1}: ${flight.airline || ''} ${flight.flightNumber || ''}` : 'Flight Details'}
                    </h4>
                    ${flight.flightType ? `
                      <span style="background: #f1c40f; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 0.7em; display: inline-block; text-align: center; min-width: 70px;">
                        ${flight.flightType === 'roundtrip' ? 'Round Trip' : 'One Way'}
                      </span>
                    ` : ''}
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 10px; align-items: center; border-bottom: 1px dashed #eee; padding-bottom: 10px; margin-bottom: 10px;">
                    <div>
                      <div style="font-weight: bold; font-size: 1.1em;">${flight.from || 'N/A'}</div>
                      ${flight.departure ? `<div style="color: #7f8c8d; font-size: 0.85em;">${formatFlightTime(flight.departure)}</div>` : ''}
                    </div>
                    <div style="text-align: center; color: #3b82f6; transform: rotate(45deg); margin: 0 5px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 2L11 13"></path>
                        <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                      </svg>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: bold; font-size: 1.1em;">${flight.to || 'N/A'}</div>
                      ${flight.arrival ? `<div style="color: #7f8c8d; font-size: 0.85em;">${formatFlightTime(flight.arrival)}</div>` : ''}
                    </div>
                  </div>
                  ${flight.confirmationNumber ? `
                    <div style="font-size: 0.9em;">
                      <strong>Confirmation #:</strong> ${flight.confirmationNumber}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `, { marginBottom: 10 });
        }
      }
      
      // Add Accommodation section if exists and visible
      if (showHotelSection && formData.hotels && formData.hotels.length > 0) {
        const validHotels = formData.hotels.filter(hotel => 
          hotel.name && hotel.name.trim() !== '' && 
          hotel.checkIn && hotel.checkOut
        );
        
        if (validHotels.length > 0) {
          currentY = await addSection('', `
            <div style="background: #f8f9fa; padding: 12px; border-radius: 5px; border-left: 4px solid #2ecc71; position: relative; margin-top: 5px;">
              <div style="position: absolute; top: 10px; right: 15px; color: #8B4513; font-size: 20px;">🏨</div>
              ${validHotels.map((hotel, index) => `
                <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 5px; border: 1px solid #eee;">
                  <h4 style="margin-top: 0; margin-bottom: 10px; color: #2c3e50; font-size: 1.1em; font-weight: 600;">${hotel.name || `Hotel ${index + 1}`}</h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                    <div>
                      <p style="margin: 3px 0;"><strong style="color: #7f8c8d;">Check-in:</strong> ${format(parseISO(hotel.checkIn), 'EEE, MMM d, yyyy')}</p>
                      <p style="margin: 3px 0;"><strong style="color: #7f8c8d;">Check-out:</strong> ${format(parseISO(hotel.checkOut), 'EEE, MMM d, yyyy')}</p>
                    </div>
                    <div>
                      ${hotel.roomType ? `<p style="margin: 3px 0;"><strong style="color: #7f8c8d;">Room Type:</strong> ${hotel.roomType}</p>` : ''}
                      ${hotel.confirmationNumber ? `<p style="margin: 3px 0;"><strong style="color: #7f8c8d;">Confirmation #:</strong> ${hotel.confirmationNumber}</p>` : ''}
                    </div>
                  </div>
                  ${hotel.address ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee; color: #666; font-size: 0.9em;">
                      <strong>Address:</strong> ${hotel.address}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `, { marginBottom: 10 });
        }
      }
      
      // --- Daily Itinerary Section ---

      if (itineraryDays && itineraryDays.length > 0) {
        // Add a new page for the first day
        currentPage++;
        currentY = addNewPage(pdf, currentPage);
        
        for (let dayIndex = 0; dayIndex < itineraryDays.length; dayIndex++) {
          const day = itineraryDays[dayIndex];
          const date = typeof day.date === 'string' ? parseISO(day.date) : day.date;
          
          if (dayIndex > 0) {
            currentY += 15;
            pdf.setDrawColor(230, 230, 230);
            pdf.setLineWidth(0.5);
            pdf.line(margin, currentY - 5, pageWidth - margin, currentY - 5);
            currentY += 5;
          }
          
          // Check if we need a new page for the day header
          if (currentY > margin + 20 && currentY + 100 > pageHeight - margin) {
            currentPage++;
            currentY = addNewPage(pdf, currentPage);
          }
          
          // Add day header with a colored background (full width blue box)
          const dayHeaderHeight = 14; // Slightly taller for better visibility
          pdf.saveGraphicsState();
          pdf.setFillColor(0, 71, 171); // Darker blue
          
          // Full width box (accounting for left and right margins)
          const boxX = margin;
          const boxWidth = pageWidth - (2 * margin);
          
          // Draw the full width box with rounded corners
          pdf.roundedRect(
            boxX, 
            currentY - 2, 
            boxWidth, 
            dayHeaderHeight + 4, 
            4, 4, 'F' // Rounded corners
          );
          
          // Add day text (centered in the full width box)
          pdf.setFontSize(12); // Slightly larger for better visibility
          pdf.setTextColor(255, 255, 255);
          pdf.setFont(undefined, 'bold');
          const dayTitle = `Day ${dayIndex + 1}: ${isValid(date) ? format(date, 'EEEE, MMMM d, yyyy') : 'Invalid Date'}`;
          const dayTitleWidth = pdf.getTextWidth(dayTitle);
          
          // Center text in the full width box
          pdf.text(dayTitle, margin + ((pageWidth - (2 * margin) - dayTitleWidth) / 2), currentY + dayHeaderHeight - 1);
          pdf.restoreGraphicsState();
          
          currentY += dayHeaderHeight + 10; // Slightly more space after header
          
          // Add activities for the day
          if (day.activities && day.activities.length > 0) {
            for (const activity of day.activities) {
              // Create temporary div for activity
              const activityDiv = document.createElement('div');
              activityDiv.style.width = `${contentWidth}px`;
              activityDiv.style.fontFamily = '"Helvetica Neue", Arial, sans-serif';
              activityDiv.style.fontSize = '11px'; // Reduced from 16px
              
              // Activity HTML content
              activityDiv.innerHTML = `
                <div style="margin-bottom: 15px; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                  <div style="background: #f5f5f5; padding: 8px 15px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: 600; color: #333; font-size: 12px;">${activity.pickupTime || 'Time TBD'}</div>
                    ${activity.type ? `
                      <div style="background: #e3f2fd; color: #1565c0; padding: 3px 8px; border-radius: 20px; font-size: 9px; font-weight: 500;">
                        ${activity.type}
                      </div>` : ''}
                  </div>
                  <div style="padding: 15px; background: white;">
                    ${activity.name ? `
                      <h3 style="margin: 0 0 8px 0; color: #1a237e; font-size: 13px; font-weight: 600;">
                        ${activity.name}
                      </h3>` : ''}
                    ${activity.description ? `
                      <div style="color: #555; font-size: 0.9em; line-height: 1.4; margin-bottom: 8px;">
                        ${activity.description}
                      </div>` : ''}
                    
                    ${(activity.pickupLocation || activity.dropLocation) ? `
                      <div style="margin-top: 10px; background: #f8f9fa; border-radius: 6px; padding: 10px; border: 1px solid #e9ecef;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                          ${activity.pickupLocation ? `
                            <div>
                              <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; margin-bottom: 3px;">Pickup</div>
                              <div style="font-weight: 500;">${activity.pickupLocation}</div>
                            </div>` : ''}
                          ${activity.dropLocation ? `
                            <div>
                              <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; margin-bottom: 3px;">Drop-off</div>
                              <div style="font-weight: 500;">${activity.dropLocation}</div>
                            </div>` : ''}
                        </div>
                      </div>` : ''}
                      
                      ${activity.aiInfo ? `
                      <div style="margin-top: 10px; padding: 10px; border-top: 1px dashed #dee2e6; font-size: 0.9em; background: #fffde7; border-radius: 4px;">
                        <div style="font-size: 11px; color: #f9a825; margin-bottom: 5px; font-weight: 600;">AI Info:</div>
                        <div style="color: #495057; line-height: 1.5;">${activity.aiInfo}</div>
                      </div>` : ''}
                    
                    ${activity.notes ? `
                      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #dee2e6;">
                        <div style="font-size: 11px; text-transform: uppercase; color: #6c757d; margin-bottom: 5px;">Notes:</div>
                        <div style="font-size: 0.9em; color: #495057; line-height: 1.5;">${activity.notes}</div>
                      </div>` : ''}
                  </div>
                </div>
              `;
              
              // Add activity to the temporary content div
              content.innerHTML = '';
              content.appendChild(activityDiv);
              
              // Convert to canvas and add to PDF
              const canvas = await html2canvas(activityDiv, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                scrollY: 0,
                width: contentWidth 
              });
              
              const imgData = canvas.toDataURL('image/png');
              const imgProps = pdf.getImageProperties(imgData);
              const imgWidth = contentWidth;
              const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
              
              // Check for page break
              if (currentY + imgHeight + 10 > pageHeight - margin) {
                currentPage++;
                currentY = addNewPage(pdf, currentPage);
              }
              
              pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
              currentY += imgHeight; // No extra vertical space needed as padding is baked in
            }
          } else {
            // No activities for this day
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.setFont(undefined, 'italic');
            pdf.text('No activities scheduled for this day.', margin + 5, currentY + 10);
            currentY += lineHeight + 10;
          }
        }
      }
      
      // Add footer to each page
      for (let i = 1; i <= currentPage; i++) {
        pdf.setPage(i);
        
        // Save current graphics state
        pdf.saveGraphicsState();
        
        // Set footer style
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        
        // Draw a subtle line above footer
        pdf.setLineWidth(1.5); // Make the line thicker
        pdf.setDrawColor(200, 200, 200);
        pdf.line(
          margin,
          pageHeight - 25, // Move the line up slightly (from -20 to -18)
          pageWidth - margin,
          pageHeight - 25  // Move the line up slightly (from -20 to -18)
        );
        pdf.setLineWidth(0.1); // Reset to default line width
        
        // Left side - Copyright
        pdf.text(
          `© ${new Date().getFullYear()} ${user?.companyName || 'Navi Travel'}. All rights reserved.`,
          margin,
          pageHeight - 15,
          { align: 'left' }
        );
        
        // Center - Page number
        pdf.text(
          `Page ${i} of ${currentPage}`,
          pageWidth / 2,
          pageHeight - 15,
          { align: 'center' }
        );
        
        // Right side - Contact info
        const contactInfo = [];
        if (user?.email) contactInfo.push(user.email);
        if (user?.phone) contactInfo.push(user.phone);
        
        if (contactInfo.length > 0) {
          pdf.text(
            contactInfo.join(' | '),
            pageWidth - margin,
            pageHeight - 15,
            { align: 'right' }
          );
        }
        
        // Restore graphics state
        pdf.restoreGraphicsState();
      }
      
      // Add Notes and Instructions section if notes exist
      if (formData.additionalNotes && formData.additionalNotes.trim() !== '') {
        const notesText = formData.additionalNotes.trim();
        const sectionSpacing = 20;
        const headerHeight = 18;
        const boxPadding = 14;
        const lineHeightPx = 14;
        const boxWidth = pageWidth - (2 * margin);
        const textMaxWidth = boxWidth - (boxPadding * 2);
        const splitText = pdf.splitTextToSize(notesText, textMaxWidth);
        const textHeight = splitText.length * lineHeightPx;
        const boxHeight = textHeight + (boxPadding * 2);
        const requiredHeight = sectionSpacing + headerHeight + 10 + boxHeight;

        if (currentY + requiredHeight > pageHeight - margin) {
          currentPage++;
          currentY = addNewPage(pdf, currentPage);
        }

        // Section heading
        currentY += sectionSpacing;
        pdf.setPage(currentPage);
        pdf.setFontSize(14);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont(undefined, 'bold');
        pdf.text('Notes & Instructions', margin, currentY);

        // Divider
        pdf.setDrawColor(224, 224, 224);
        pdf.setLineWidth(0.6);
        pdf.line(margin, currentY + 5, pageWidth - margin, currentY + 5);

        // Styled box background
        currentY += 12;
        const boxY = currentY;
        pdf.setFillColor(249, 250, 251);
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.8);
        pdf.roundedRect(margin, boxY, boxWidth, boxHeight, 6, 6, 'FD');

        // Notes text
        pdf.setFontSize(11);
        pdf.setTextColor(60, 64, 72);
        pdf.setFont(undefined, 'normal');

        let textY = boxY + boxPadding + 2;
        for (const line of splitText) {
          if (textY > pageHeight - margin - 20) {
            currentPage++;
            currentY = addNewPage(pdf, currentPage);
            pdf.setFontSize(11);
            pdf.setTextColor(60, 64, 72);
            textY = margin + boxPadding;
          }
          pdf.text(line, margin + boxPadding, textY);
          textY += lineHeightPx;
        }

        currentY = boxY + boxHeight;
      }
      
      // Add a thank you message on the last page
      pdf.setPage(currentPage);
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'italic');
      pdf.text(
        `Thank you for choosing ${user?.companyName || 'our travel services'}.`,
        pageWidth / 2,
        pageHeight - 40,
        { align: 'center' }
      );
      
      // Save the PDF with a timestamp
      const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
      const fileName = `Itinerary_${formData.customerName ? formData.customerName.replace(/\s+/g, '_') : 'Customer'}_${timestamp}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF generated successfully!');
    } catch (err) {
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      // Clean up the temporary content div
      if (content && document.body.contains(content)) {
        document.body.removeChild(content);
      }
      setLoading(false);
    }
  }; // <--- **CORRECTION: PROPER CLOSING BRACE FOR generatePdf**

  const downloadPDF = async () => {
    await generatePdf();
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPriceData(prev => ({
      ...prev,
      [name]: value
    }));
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
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <p className="text-lg font-medium">Saving itinerary...</p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            </div>
          </div>
        )}
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
                min={format(new Date(), 'yyyy-MM-dd')} // Can't select past dates
                max={formData.departureDate || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              {formData.arrivalDate && (
                <div className="text-xs text-gray-500 mt-1">
                  {format(new Date(formData.arrivalDate), 'EEEE, MMMM d, yyyy')}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Departure Date *</label>
              <input
                type="date"
                name="departureDate"
                value={formData.departureDate}
                min={formData.arrivalDate || format(new Date(), 'yyyy-MM-dd')}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              {formData.departureDate && (
                <div className="text-xs text-gray-500 mt-1">
                  {format(new Date(formData.departureDate), 'EEEE, MMMM d, yyyy')}
                </div>
              )}
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

        {/* Notes and Instructions */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium mb-4">Notes and Instructions</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes for the Traveler
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Add any special instructions, notes, or important information for the traveler..."
            />
          </div>
        </div>

        {/* Price Toggle */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Pricing Information</h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={showPrice}
                onChange={() => setShowPrice(!showPrice)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {showPrice ? 'Hide Price' : 'Show Price in PDF'}
              </span>
            </label>
          </div>
          
          {showPrice && (
            <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">{priceData.currency}</span>
                    </div>
                    <input
                      type="number"
                      name="amount"
                      value={priceData.amount}
                      onChange={handlePriceChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Type
                  </label>
                  <select
                    name="type"
                    value={priceData.type}
                    onChange={handlePriceChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="per_person">Per Person</option>
                    <option value="total">Total for All Travelers</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={priceData.currency}
                    onChange={handlePriceChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="₹">INR (₹)</option>
                    <option value="$">USD ($)</option>
                    <option value="€">EUR (€)</option>
                    <option value="£">GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hotel Section with Toggle */}
        <section className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold mr-3">Hotel Details</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={showHotelSection}
                  onChange={() => setShowHotelSection(!showHotelSection)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {showHotelSection ? 'Hide' : 'Show'}
                </span>
              </label>
            </div>
            {showHotelSection && formData.hotels.length < 7 && (
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
          {showHotelSection && formData.hotels.map((hotel, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 relative border p-4 rounded-lg bg-gray-50">
              {formData.hotels.length > 0 && (
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
                <label className="block text-sm font-medium text-gray-700">Hotel {index + 1} Name</label>
                <input
                  type="text"
                  value={hotel.name}
                  onChange={(e) => handleHotelChange(index, 'name', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Hotel name (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Check-in</label>
                <input
                  type="date"
                  value={hotel.checkIn ? (typeof hotel.checkIn === 'string' ? hotel.checkIn.split('T')[0] : format(new Date(hotel.checkIn), 'yyyy-MM-dd')) : ''}
                  onChange={(e) => handleHotelChange(index, 'checkIn', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Check-in date (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Check-out</label>
                <input
                  type="date"
                  value={hotel.checkOut ? (typeof hotel.checkOut === 'string' ? hotel.checkOut.split('T')[0] : format(new Date(hotel.checkOut), 'yyyy-MM-dd')) : ''}
                  onChange={(e) => handleHotelChange(index, 'checkOut', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min={hotel.checkIn || ''}
                  placeholder="Check-out date (optional)"
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Room Type</label>
                <input
                  type="text"
                  value={hotel.roomType || ''}
                  onChange={(e) => handleHotelChange(index, 'roomType', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="E.g., Double"
                />
              </div>
            </div>
          ))}
        </section>

        {/* Flight Section with Toggle */}
        <section className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold mr-3">Flight Details</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={showFlightSection}
                  onChange={() => setShowFlightSection(!showFlightSection)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {showFlightSection ? 'Hide' : 'Show'}
                </span>
              </label>
            </div>
            {showFlightSection && formData.flights.length < 15 && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  flights: [...prev.flights, { flightNumber: '', from: '', to: '', departure: '', arrival: '', airline: '', flightType: 'oneway', confirmationNumber: '' }]
                }))}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
              >
                + Add Flight
              </button>
            )}
          </div>
          {showFlightSection && formData.flights.map((flight, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 relative border p-4 rounded-lg bg-gray-50">
              {formData.flights.length > 0 && (
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
              {/* Added Airline and Flight Type fields */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Airline & Flight #</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="Airline (optional)"
                    value={flight.airline || ''}
                    onChange={(e) => handleFlightChange(index, 'airline', e.target.value)}
                    className="block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Flight # (optional)"
                    value={flight.flightNumber}
                    onChange={(e) => handleFlightChange(index, 'flightNumber', e.target.value)}
                    className="block w-2/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Flight Type</label>
                <select
                  value={flight.flightType || 'oneway'}
                  onChange={(e) => handleFlightChange(index, 'flightType', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="oneway">One Way</option>
                  <option value="roundtrip">Round Trip</option>
                  <option value="multi-city">Multi-City</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmation #</label>
                <input
                  type="text"
                  placeholder="Confirmation Number"
                  value={flight.confirmationNumber || ''}
                  onChange={(e) => handleFlightChange(index, 'confirmationNumber', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-5 border-t pt-3 mt-3 border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From</label>
                    <input
                      type="text"
                      placeholder="Origin (optional)"
                      value={flight.from || ''}
                      onChange={(e) => handleFlightChange(index, 'from', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">To</label>
                    <input
                      type="text"
                      placeholder="Destination (optional)"
                      value={flight.to || ''}
                      onChange={(e) => handleFlightChange(index, 'to', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Departure</label>
                    <input
                      type="datetime-local"
                      value={flight.departure || ''}
                      onChange={(e) => handleFlightChange(index, 'departure', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Arrival</label>
                    <input
                      type="datetime-local"
                      value={flight.arrival || ''}
                      onChange={(e) => handleFlightChange(index, 'arrival', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Itinerary Days */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Daily Itinerary</h2>
          {itineraryDays.map((day, dayIndex) => (
            <div key={dayIndex} className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-600">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-blue-800">
                  Day {dayIndex + 1}: {formatLocalDate(day.date)}
                  <span className="ml-2 text-sm text-gray-500">
                    ({toLocalDateString(day.date)})
                  </span>
                </h3>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      const newItineraryText = prompt('Enter itinerary for this day:', day.itineraryText || '');
                      if (newItineraryText !== null) {
                        const updatedDays = [...itineraryDays];
                        updatedDays[dayIndex] = {
                          ...day,
                          itineraryText: newItineraryText
                        };
                        setItineraryDays(updatedDays);
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {day.itineraryText ? 'Edit Itinerary' : '+ Add Itinerary'}
                  </button>
                )}
              </div>
              {isEditMode && day.itineraryText && (
                <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                  <p className="whitespace-pre-line">{day.itineraryText}</p>
                </div>
              )}
              
              <>
                {/* Activities Section */}
                <div className="mt-4">
                  <h4 className="text-md font-semibold text-gray-700 mb-3 pb-2 border-b">
                    Daily Activities
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => openActivityModal(dayIndex)}
                        className="ml-3 text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Activity
                      </button>
                    )}
                  </h4>
                  
                  {day.activities.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                      {isEditMode ? 'No activities added yet. Click "Add Activity" to get started.' : 'No activities scheduled for this day.'}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {day.activities.map((activity, activityIndex) => (
                        <div key={activityIndex} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow">
                          <div className="bg-white p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <h4 className="text-lg font-semibold text-gray-800">{activity.name}</h4>
                                  {activity.type && (
                                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                      {activity.type}
                                    </span>
                                  )}
                                </div>
                                
                                {activity.pickupTime && (
                                  <div className="mt-1 flex items-center text-sm text-gray-600">
                                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {activity.pickupTime}
                                  </div>
                                )}
                                
                                {activity.location && (
                                  <div className="mt-1 flex items-center text-sm text-gray-600">
                                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {activity.location}
                                  </div>
                                )}
                                
                                {activity.description && (
                                  <p className="mt-2 text-sm text-gray-600">{activity.description}</p>
                                )}
                                
                                {(activity.pickupLocation || activity.dropLocation) && (
                                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {activity.pickupLocation && (
                                      <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Pickup</label>
                                        <div className="p-2 bg-gray-50 rounded text-sm">
                                          {activity.pickupLocation}
                                        </div>
                                      </div>
                                    )}
                                    {activity.dropLocation && (
                                      <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Drop-off</label>
                                        <div className="p-2 bg-gray-50 rounded text-sm">
                                          {activity.dropLocation}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {activity.notes && (
                                  <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
                                    <p className="text-sm text-yellow-700">
                                      <span className="font-medium">Notes:</span> {activity.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Edit and Remove Buttons */}
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openActivityModal(dayIndex, activityIndex, activity);
                                  }}
                                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                  title="Edit activity"
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Are you sure you want to remove this activity?')) {
                                      removeActivity(dayIndex, activityIndex);
                                    }
                                  }}
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                  title="Remove activity"
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Type/Cost/Location</label>
                            <input
                              type="text"
                              placeholder="Type/Cost/Location"
                              value={`${activity.type || ''}${activity.cost ? ` | ${formatPrice(activity.cost)}` : ''}${activity.location ? ` | ${activity.location}` : ''}`}
                              disabled
                              className="w-full p-2 border rounded-md text-sm bg-gray-100 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>

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
                  <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="text-lg font-semibold">Add New Activity (Day {dayIndex + 1})</h3>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                            <input
                              type="time"
                              value={newActivity.pickupTime}
                              onChange={(e) => setNewActivity({...newActivity, pickupTime: e.target.value})}
                              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                            <select
                              value={newActivity.type}
                              onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="Activity">Activity</option>
                              <option value="Transfer">Transfer</option>
                              <option value="Meal">Meal</option>
                              <option value="Check-in">Check-in</option>
                              <option value="Check-out">Check-out</option>
                            </select>
                          </div>
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">AI Generated Info (Internal Notes)</label>
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image (Placeholder for PDF)</label>
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
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Download PDF'}
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