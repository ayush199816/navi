import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Trash2, 
  Save, 
  Calculator, 
  DollarSign, 
  Users, 
  Car,
  Copy,
  Download,
  Eye,
  Edit,
  X
} from 'lucide-react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { convertCurrency, getExchangeRate } from '../../utils/currencyConverter';

// Searchable Select Component
const SearchableSelect = ({ options, value, onChange, placeholder, required, filterKey = 'label', className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter(option =>
    option[filterKey].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  // Initialize searchTerm with selected option's label when value changes
  useEffect(() => {
    if (selectedOption) {
      setSearchTerm(selectedOption[filterKey]);
    } else if (!value) {
      setSearchTerm('');
    }
  }, [value, selectedOption, filterKey]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (option) => {
    onChange(option.value);
    setSearchTerm(option[filterKey]);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (!searchTerm && selectedOption) {
      setSearchTerm(selectedOption[filterKey]);
    }
  };

  const handleBlur = () => {
    // Delay closing to allow click on option
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filteredOptions.map(option => (
            <div
              key={option.value}
              onClick={() => handleSelect(option)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm leading-5 whitespace-normal break-words"
            >
              {option[filterKey]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PackageCalculator = () => {
  const [calculators, setCalculators] = useState([]);
  const [sightseeings, setSightseeings] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCalculator, setEditingCalculator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCalculator, setViewingCalculator] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [sectionToggles, setSectionToggles] = useState({
    showInclusionsExclusions: true,
    showDaywiseItinerary: true,
    showTransfers: true,
    showSightseeings: true
  });
  const pdfContentRef = useRef(null);
  const [formData, setFormData] = useState({
    tripId: '',
    adults: 0,
    children: 0,
    daysCount: 1,
    isAgent: false,
    adultSightseeings: [],
    childSightseeings: [],
    transfers: [],
    hotelPrices: [],
    currency: 'INR',
    notes: '',
    travelTriangle: false,
    grandTotal: 0
  });

  const createAgentQuoteId = () => {
    const existingNames = new Set((calculators || []).map(c => (c.tripId || '').trim()));

    for (let i = 0; i < 20; i += 1) {
      const num = Math.floor(Math.random() * 9999) + 1;
      const candidate = `NAVAQ${num}`;
      if (!existingNames.has(candidate)) return candidate;
    }

    return `NAVAQ${Date.now()}`;
  };

  const handleSavePdf = async () => {
    if (!pdfContentRef.current) return;

    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(pdfContentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const printableHeight = pageHeight - margin * 2;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= printableHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgHeight - heightLeft);
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= printableHeight;
      }

      const safeName = (formData.tripId || 'PackageCalculator')
        .toString()
        .trim()
        .replace(/[^a-z0-9_-]/gi, '_');

      pdf.save(`${safeName || 'PackageCalculator'}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const buildCopyText = () => {
    const totals = calculateTotals();

    const adultsCount = parseInt(formData.adults || 0);
    const childrenCount = parseInt(formData.children || 0);
    const totalPeople = adultsCount + childrenCount;
    const currency = formData.currency || 'INR';
    const daysCount = Math.max(1, parseInt(formData.daysCount || 1));

    // Get hotels data for date calculation
    const hotels = (formData.hotelPrices || []);

    // Use actual hotel dates for trip dates
    let startDate, endDate;
    
    if (hotels.length > 0) {
      // Find earliest check-in and latest check-out from hotels
      const checkInDates = hotels.map(h => new Date(h.checkIn));
      const checkOutDates = hotels.map(h => new Date(h.checkOut));
      
      startDate = new Date(Math.min(...checkInDates));
      endDate = new Date(Math.max(...checkOutDates));
    } else {
      // Fallback to calculated dates if no hotels
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + daysCount - 1);
    }

    const formatDate = (date) => {
      const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    };

    const formatDateShort = (date) => {
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    };

    const lines = [];
    
    // Professional greeting
    lines.push('Greetings from Navigatio Asia.');
    lines.push('');
    lines.push('Thank you for your query with us. As per your requirements, following are the package details.');
    lines.push('');
    
    // Trip details
    lines.push(`Trip ID ${(formData.tripId || '').toString().trim()}`);
    lines.push('----------');
    lines.push('Thailand Trip');
    lines.push(`* ${formatDate(startDate)} to ${formatDate(endDate)}`);
    lines.push(`* ${totalPeople} Pax (${adultsCount} Adults${childrenCount > 0 ? `, ${childrenCount} Children` : ''})`);
    lines.push('');
    
    // Price section
    lines.push(`Price (${currency}):`);
    lines.push(`* Total Package Cost: ${totals.grandTotal.toLocaleString('en-IN')} ${currency}`);
    lines.push('');
    
    // Calculate separate adult and child prices
    if (totalPeople > 0) {
      let adultPrice, childPrice;
      
      if (childrenCount > 0) {
        // Child price is 70% of what would be equal per-person price
        const equalPerPersonPrice = totals.grandTotal / totalPeople;
        childPrice = equalPerPersonPrice * 0.7;
        
        // Calculate total child cost
        const totalChildCost = childPrice * childrenCount;
        
        // Remaining amount goes to adults
        const remainingForAdults = totals.grandTotal - totalChildCost;
        adultPrice = remainingForAdults / adultsCount;
      } else {
        // No children, all adults pay equal
        adultPrice = totals.grandTotal / adultsCount;
        childPrice = 0;
      }
      
      // Display adult pricing
      lines.push(`* ${adultPrice.toLocaleString('en-IN')} / Adult x ${adultsCount} Adults = ${(adultPrice * adultsCount).toLocaleString('en-IN')} ${currency}`);
      
      // Display child pricing if there are children
      if (childrenCount > 0) {
        lines.push(`* ${childPrice.toLocaleString('en-IN')} / Child x ${childrenCount} Children = ${(childPrice * childrenCount).toLocaleString('en-IN')} ${currency}`);
      }
      
      lines.push('');
    }

    // Hotels section

    if (hotels.length > 0) {
      lines.push('🏨  Hotels');
      lines.push('-----------');
      
      hotels.forEach((hotel, index) => {
        const checkInDate = new Date(hotel.checkIn);
        const checkOutDate = new Date(hotel.checkOut);
        
        lines.push(`${formatDateShort(checkInDate)} to ${formatDateShort(checkOutDate)}`);
        lines.push(`Check-in: ${formatDateShort(checkInDate)} & Check-out: ${formatDateShort(checkOutDate)}`);
        lines.push(`${hotel.hotelName}`);
        if (index < hotels.length - 1) lines.push('');
      });
      lines.push('');
    }

    // Transfers section
    const allTransfers = [];
    (formData.transfers || []).forEach((item) => {
      if (item.transferId) {
        allTransfers.push(getTransferName(item.transferId));
      }
    });

    if (allTransfers.length > 0 && sectionToggles.showTransfers) {
      lines.push('🚖  Transfers');
      lines.push('-----------');
      allTransfers.forEach((transfer) => {
        lines.push(`* ${transfer}`);
      });
      lines.push('');
    }

    // Sightseeings section
    const allSightseeings = [];
    (formData.adultSightseeings || []).forEach((item) => {
      if (item.sightseeingId) {
        allSightseeings.push(getSightseeingName(item.sightseeingId));
      }
    });

    if (allSightseeings.length > 0 && sectionToggles.showSightseeings) {
      lines.push('🎯  Sightseeings');
      lines.push('-----------');
      allSightseeings.forEach((sightseeing) => {
        lines.push(`* ${sightseeing}`);
      });
      lines.push('');
    }

    // Day-wise Itinerary section
    if (sectionToggles.showDaywiseItinerary) {
      lines.push('📅  Day-wise Itinerary');
      lines.push('-----------');
    
    for (let d = 1; d <= daysCount; d += 1) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + d - 1);
      
      const adultItems = (formData.adultSightseeings || []).filter(i => (parseInt(i.day || 1) === d) && i.sightseeingId);
      const transferItems = (formData.transfers || []).filter(i => (parseInt(i.day || 1) === d) && i.transferId);
      
      const allItems = [];
      adultItems.forEach((item) => {
        allItems.push({ name: getSightseeingName(item.sightseeingId), type: 'sightseeing' });
      });
      transferItems.forEach((item) => {
        allItems.push({ name: getTransferName(item.transferId), type: 'transfer' });
      });

      lines.push(`${formatDate(currentDate)}`);
      lines.push('----');
      
      if (allItems.length === 0) {
        lines.push('No activities scheduled for this day');
      } else {
        allItems.forEach((item) => {
          // Clean up the item name for detailed description
          const cleanItem = item.name.split(' - ')[0]; // Remove location details
          const prefix = item.type === 'transfer' ? 'Transfer - ' : '';
          lines.push(`${prefix}${cleanItem}`);
        });
      }
      lines.push('');
    }

    // Close the Day-wise Itinerary conditional block
    }

    // Inclusions and Exclusions section
    if (sectionToggles.showInclusionsExclusions) {
      lines.push('Inclusions');
      lines.push('-----------');
      lines.push('+ Accommodation in well-rated hotels/resorts as per the itinerary');
      lines.push('+ Daily breakfast at the hotel (except on Day 1)');
      lines.push('+ Sightseeing as per itinerary in a private/shared vehicle');
      lines.push('+ Airport Transfers');
      lines.push('+ All toll taxes, parking charges, driver allowances');
      lines.push('+ Entry tickets to attractions (as mentioned in the itinerary)');
      lines.push('+ Assistance by our local representative');
      lines.push('');

      lines.push('Exclusions');
      lines.push('-----------');
      lines.push('- Airfare / Train fare / Bus tickets');
      lines.push('- Meals other than those specified in the Hotel inclusions');
      lines.push('- Personal expenses: Laundry, telephone calls, room service, mini-bar, etc.');
      lines.push('- Early check-in or late check-out at hotels (subject to availability)');
      lines.push('- Tips, porterage, and guide charges');
      lines.push('- Optional tours and activities not mentioned in the itinerary');
      lines.push('- Cost of any medical or travel insurance (unless included)');
      lines.push('- Any additional cost due to flight cancellation, delay, natural calamity, etc.');
      lines.push('- TCS (Tax Collected at Source)');
      lines.push('- 18% GST (Goods and Services Tax)');
      lines.push('');
      lines.push('NOTE: Anything not mentioned in the inclusions is excluded');
    }

    return lines.join('\n');
  };

  const handleCopy = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    
    setIsCopying(true);
    try {
      const text = buildCopyText();
      await navigator.clipboard.writeText(text);
      toast.success('Copied');
    } catch (e) {
      try {
        const text = buildCopyText();
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        toast.success('Copied');
      } catch (err) {
        toast.error('Failed to copy');
      }
    } finally {
      setIsCopying(false);
    }
  };

  useEffect(() => {
    fetchCalculators();
    fetchSightseeings();
    fetchTransfers();
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      // Test if we can fetch rates (now returns boolean)
      const success = await getExchangeRate('THB', 'INR');
      if (!success) {
        console.warn('Exchange rate test failed');
      }
    } catch (error) {
      console.error('Failed to test exchange rates:', error);
      toast.error('Failed to initialize exchange rates');
    }
  };

  const convertAllPrices = async (fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return;

    setLoading(true);
    try {
      const updatedFormData = { ...formData };

      // Convert adult sightseeing prices
      updatedFormData.adultSightseeings = await Promise.all(
        formData.adultSightseeings.map(async (item) => ({
          ...item,
          adultPrice: await convertCurrency(item.adultPrice, fromCurrency, toCurrency)
        }))
      );

      // Convert child sightseeing prices
      updatedFormData.childSightseeings = await Promise.all(
        formData.childSightseeings.map(async (item) => ({
          ...item,
          childPrice: await convertCurrency(item.childPrice, fromCurrency, toCurrency)
        }))
      );

      // Convert transfer prices
      updatedFormData.transfers = await Promise.all(
        formData.transfers.map(async (item) => ({
          ...item,
          transferPrice: await convertCurrency(item.transferPrice, fromCurrency, toCurrency)
        }))
      );

      // Convert hotel prices
      updatedFormData.hotelPrices = await Promise.all(
        formData.hotelPrices.map(async (item) => ({
          ...item,
          price: await convertCurrency(item.price, fromCurrency, toCurrency)
        }))
      );

      setFormData(updatedFormData);
      toast.success(`Prices converted from ${fromCurrency} to ${toCurrency}`);
    } catch (error) {
      console.error('Currency conversion failed:', error);
      toast.error('Failed to convert prices');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    const oldCurrency = formData.currency;
    
    // Update the currency field first
    setFormData(prev => ({ ...prev, currency: newCurrency }));
    
    if (oldCurrency !== newCurrency) {
      await convertAllPrices(oldCurrency, newCurrency);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Don't handle currency changes here - use handleCurrencyChange instead
    if (name === 'currency') return;
    
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };

      if (name === 'daysCount') {
        const nextDays = Math.max(1, parseInt(value || 1));
        updatedData.daysCount = nextDays;
        updatedData.adultSightseeings = (prev.adultSightseeings || []).map(item => ({
          ...item,
          day: Math.min(Math.max(1, parseInt(item.day || 1)), nextDays)
        }));
        updatedData.childSightseeings = (prev.childSightseeings || []).map(item => ({
          ...item,
          day: Math.min(Math.max(1, parseInt(item.day || 1)), nextDays)
        }));
        updatedData.transfers = (prev.transfers || []).map(item => ({
          ...item,
          day: Math.min(Math.max(1, parseInt(item.day || 1)), nextDays)
        }));
      }
      
      // Update sightseeing quantities when adults or children change
      if (name === 'adults' || name === 'children') {
        const newCount = parseInt(value || 0);
        
        if (name === 'adults') {
          updatedData.adultSightseeings = prev.adultSightseeings.map(item => ({
            ...item,
            quantity: newCount
          }));
        } else if (name === 'children') {
          updatedData.childSightseeings = prev.childSightseeings.map(item => ({
            ...item,
            quantity: newCount
          }));
        }
      }
      
      return updatedData;
    });
  };

  const fetchCalculators = async () => {
    try {
      const response = await axios.get('/api/package-calculator');
      setCalculators(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch calculators');
    }
  };

  const fetchSightseeings = async () => {
    try {
      const response = await axios.get('/api/package-calculator/sightseeings');
      setSightseeings(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch sightseeings');
    }
  };

  const fetchTransfers = async () => {
    try {
      const response = await axios.get('/api/calculator-transfer');
      setTransfers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch transfers');
    }
  };

  const addAdultSightseeing = () => {
    setFormData(prev => ({
      ...prev,
      adultSightseeings: [...prev.adultSightseeings, {
        sightseeingId: '',
        day: 1,
        quantity: parseInt(prev.adults || 0), // Initialize with number of adults
        adultPrice: 0,
        profitPerPax: 0 // Add profit per pax field
      }]
    }));
  };

  const addChildSightseeing = () => {
    setFormData(prev => ({
      ...prev,
      childSightseeings: [...prev.childSightseeings, {
        sightseeingId: '',
        day: 1,
        quantity: parseInt(prev.children || 0), // Initialize with number of children
        childPrice: 0,
        profitPerPax: 0 // Add profit per pax field
      }]
    }));
  };

  const addTransfer = () => {
    setFormData(prev => ({
      ...prev,
      transfers: [...prev.transfers, {
        transferId: '',
        day: 1,
        quantity: 1,
        transferPrice: 0
      }]
    }));
  };

  const addHotel = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(tomorrow.getDate() + 1);
    
    setFormData(prev => ({
      ...prev,
      hotelPrices: [...prev.hotelPrices, {
        hotelName: '',
        price: 0,
        quantity: 1,
        checkIn: tomorrow.toISOString().split('T')[0],
        checkOut: dayAfter.toISOString().split('T')[0]
      }]
    }));
  };

  const updateAdultSightseeing = async (index, field, value) => {
    const updated = [...formData.adultSightseeings];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-populate and convert price when sightseeing is selected
    if (field === 'sightseeingId') {
      const selectedSightseeing = sightseeings.find(s => s._id === value);
      if (selectedSightseeing) {
        console.log('Selected sightseeing:', selectedSightseeing);
        console.log('Original price:', selectedSightseeing.adultPrice, 'Currency:', selectedSightseeing.currency, 'To currency:', formData.currency);
        // Convert the price from sightseeing currency to form currency
        const convertedPrice = await convertCurrency(
          selectedSightseeing.adultPrice, 
          selectedSightseeing.currency, 
          formData.currency
        );
        console.log('Converted price:', convertedPrice);
        updated[index].adultPrice = convertedPrice;
      }
    }
    
    setFormData(prev => ({ ...prev, adultSightseeings: updated }));
  };

  const updateChildSightseeing = async (index, field, value) => {
    const updated = [...formData.childSightseeings];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-populate and convert price when sightseeing is selected
    if (field === 'sightseeingId') {
      const selectedSightseeing = sightseeings.find(s => s._id === value);
      if (selectedSightseeing) {
        console.log('Selected child sightseeing:', selectedSightseeing);
        console.log('Original child price:', selectedSightseeing.childPrice, 'Currency:', selectedSightseeing.currency, 'To currency:', formData.currency);
        // Convert the price from sightseeing currency to form currency
        const convertedPrice = await convertCurrency(
          selectedSightseeing.childPrice, 
          selectedSightseeing.currency, 
          formData.currency
        );
        console.log('Converted child price:', convertedPrice);
        updated[index].childPrice = convertedPrice;
      }
    }
    
    setFormData(prev => ({ ...prev, childSightseeings: updated }));
  };

  const updateTransfer = async (index, field, value) => {
    const updated = [...formData.transfers];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-populate and convert price when transfer is selected
    if (field === 'transferId') {
      const selectedTransfer = transfers.find(t => t._id === value);
      if (selectedTransfer) {
        // Convert the price from transfer currency to form currency
        const convertedPrice = await convertCurrency(
          selectedTransfer.price, 
          selectedTransfer.currency, 
          formData.currency
        );
        updated[index].transferPrice = convertedPrice;
      }
    }
    
    setFormData(prev => ({ ...prev, transfers: updated }));
  };

  const updateHotel = (index, field, value) => {
    const updated = [...formData.hotelPrices];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, hotelPrices: updated }));
  };

  const handleSectionToggle = (section) => {
    setSectionToggles(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const removeAdultSightseeing = (index) => {
    setFormData(prev => ({
      ...prev,
      adultSightseeings: prev.adultSightseeings.filter((_, i) => i !== index)
    }));
  };

  const removeChildSightseeing = (index) => {
    setFormData(prev => ({
      ...prev,
      childSightseeings: prev.childSightseeings.filter((_, i) => i !== index)
    }));
  };

  const removeTransfer = (index) => {
    setFormData(prev => ({
      ...prev,
      transfers: prev.transfers.filter((_, i) => i !== index)
    }));
  };

const removeHotel = (index) => {
  setFormData(prev => ({
    ...prev,
    hotelPrices: prev.hotelPrices.filter((_, i) => i !== index)
  }));
};

const calculateTotals = () => {
  const adultsCount = parseInt(formData.adults || 0);
  const childrenCount = parseInt(formData.children || 0);
  const isAgent = formData.isAgent === true;
  const currency = formData.currency || 'INR';
  
  // Calculate base sightseeing costs (quantity already includes adults/children count)
  const baseAdultTotal = formData.adultSightseeings.reduce((sum, item) => 
    sum + (parseFloat(item.adultPrice || 0) * (item.quantity || 1)), 0
  );
  const baseChildTotal = formData.childSightseeings.reduce((sum, item) => 
    sum + (parseFloat(item.childPrice || 0) * (item.quantity || 1)), 0
  );
  const baseTransferTotal = formData.transfers.reduce((sum, item) => 
    sum + (parseFloat(item.transferPrice || 0) * (item.quantity || 1)), 0
  );
  const baseHotelTotal = formData.hotelPrices.reduce((sum, item) => 
    sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0
  );
  
  // Apply Travel Triangle 10% markup if active
  const travelTriangleMultiplier = formData.travelTriangle ? 1.10 : 1.0;
  const adultTotal = baseAdultTotal * travelTriangleMultiplier;
  const childTotal = baseChildTotal * travelTriangleMultiplier;
  const transferTotal = baseTransferTotal * travelTriangleMultiplier;
  const hotelTotal = baseHotelTotal * travelTriangleMultiplier;
  
  // Calculate visa fees (not affected by Travel Triangle)
  const totalPeople = adultsCount + childrenCount;
  const visaSightseeingFees = isAgent ? 0 : (totalPeople * 1500); // 1500 per person for sightseeing
  const visaHotelFees = isAgent ? 0 : (totalPeople * 500); // 500 per person for hotel
  const visaTotal = visaSightseeingFees + visaHotelFees;
  const agentDiscountPerPax = isAgent ? convertCurrency(250, 'INR', currency) : 0;
  const agentDiscountTotal = totalPeople * agentDiscountPerPax;
  
  const grandTotal = Math.max(0, adultTotal + childTotal + transferTotal + hotelTotal + visaTotal + agentDiscountTotal);
  
  return {
    adultTotal,
    childTotal,
    transferTotal,
    hotelTotal,
    visaTotal,
    visaSightseeingFees,
    visaHotelFees,
    grandTotal,
    agentDiscountPerPax,
    agentDiscountTotal,
    baseAdultTotal,
    baseChildTotal,
    baseTransferTotal,
    baseHotelTotal
  };
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  // Calculate grand total before saving
  const totals = calculateTotals();
  const formDataWithTotal = {
    tripId: formData.tripId,
    adults: parseInt(formData.adults) || 0,
    children: parseInt(formData.children) || 0,
    daysCount: Math.max(1, parseInt(formData.daysCount || 1)),
    isAgent: formData.isAgent === true,
    adultSightseeings: formData.adultSightseeings,
    childSightseeings: formData.childSightseeings,
    transfers: formData.transfers,
    hotelPrices: formData.hotelPrices,
    currency: formData.currency,
    notes: formData.notes,
    travelTriangle: formData.travelTriangle,
    grandTotal: totals.grandTotal
  };

  console.log('Submitting data:', formDataWithTotal);
  console.log('Adults being sent:', formDataWithTotal.adults);
  console.log('Children being sent:', formDataWithTotal.children);
  console.log('Hotel prices with dates:', formDataWithTotal.hotelPrices);

  try {
    if (editingCalculator) {
      await axios.put(`/api/package-calculator/${editingCalculator._id}`, formDataWithTotal);
      toast.success('Calculator updated successfully');
    } else {
      await axios.post('/api/package-calculator', formDataWithTotal);
      toast.success('Calculator created successfully');
    }
    
    resetForm();
    fetchCalculators();
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to save calculator');
  } finally {
    setLoading(false);
  }
};

  const resetForm = () => {
    setFormData({
      tripId: '',
      adults: 0,
      children: 0,
      daysCount: 1,
      isAgent: false,
      adultSightseeings: [],
      childSightseeings: [],
      transfers: [],
      hotelPrices: [],
      currency: 'INR',
      notes: '',
      travelTriangle: false,
      grandTotal: 0
    });
    setEditingCalculator(null);
    setShowForm(false);
  };

  const handleEdit = (calculator) => {
    console.log('Editing calculator:', calculator);
    
    // Try to get adults/children from direct fields, or calculate from sightseeing quantities
    const adultsCount = parseInt(calculator.adults) || parseInt(calculator.adultsCount) || 
                       (calculator.adultSightseeings && calculator.adultSightseeings[0] ? calculator.adultSightseeings[0].quantity : 0) || 0;
    const childrenCount = parseInt(calculator.children) || parseInt(calculator.childrenCount) || 
                          (calculator.childSightseeings && calculator.childSightseeings[0] ? calculator.childSightseeings[0].quantity : 0) || 0;
    
    console.log('Calculated adults:', adultsCount, 'children:', childrenCount);
    
    // Fix sightseeing IDs - extract string ID from objects
    const fixedAdultSightseeings = (calculator.adultSightseeings || []).map(item => ({
      ...item,
      sightseeingId: typeof item.sightseeingId === 'object' ? item.sightseeingId._id : item.sightseeingId,
      day: parseInt(item.day || 1),
      profitPerPax: item.profitPerPax || 0
    }));
    
    const fixedChildSightseeings = (calculator.childSightseeings || []).map(item => ({
      ...item,
      sightseeingId: typeof item.sightseeingId === 'object' ? item.sightseeingId._id : item.sightseeingId,
      day: parseInt(item.day || 1),
      profitPerPax: item.profitPerPax || 0
    }));
    
    // Fix transfer IDs - extract string ID from objects
    const fixedTransfers = (calculator.transfers || []).map(item => ({
      ...item,
      transferId: typeof item.transferId === 'object' ? item.transferId._id : item.transferId,
      day: parseInt(item.day || 1)
    }));
    
    // Fix hotel dates - format Date objects to YYYY-MM-DD strings for date inputs
    const fixedHotelPrices = (calculator.hotelPrices || []).map(hotel => ({
      ...hotel,
      checkIn: hotel.checkIn ? (new Date(hotel.checkIn)).toISOString().split('T')[0] : '',
      checkOut: hotel.checkOut ? (new Date(hotel.checkOut)).toISOString().split('T')[0] : ''
    }));
    
    console.log('Travel Triangle from database:', calculator.travelTriangle);
    console.log('Type:', typeof calculator.travelTriangle);
    console.log('Fixed hotel prices with dates:', fixedHotelPrices);
    
    setEditingCalculator(calculator);
    setFormData({
      tripId: calculator.tripId || calculator.name || '',
      adults: adultsCount,
      children: childrenCount,
      daysCount: Math.max(1, parseInt(calculator.daysCount || 1)),
      isAgent: calculator.isAgent === true,
      adultSightseeings: fixedAdultSightseeings,
      childSightseeings: fixedChildSightseeings,
      transfers: fixedTransfers.map(t => ({ ...t, day: parseInt(t.day || 1) })),
      hotelPrices: fixedHotelPrices,
      currency: calculator.currency || 'INR',
      notes: calculator.notes || '',
      travelTriangle: calculator.travelTriangle === true || calculator.travelTriangle === undefined,
      grandTotal: calculator.grandTotal || 0
    });
    
    console.log('Travel Triangle set in formData:', calculator.travelTriangle === true || calculator.travelTriangle === undefined);
    setShowForm(true);
  };

  const handleView = (calculator) => {
    setViewingCalculator(calculator);
    setShowViewModal(true);
  };

  const calculateViewTotals = (calculator) => {
    // Try to get adults/children from direct fields, or calculate from sightseeing quantities
    const adultsCount = parseInt(calculator.adults) || parseInt(calculator.adultsCount) || 
                       (calculator.adultSightseeings && calculator.adultSightseeings[0] ? calculator.adultSightseeings[0].quantity : 0) || 0;
    const childrenCount = parseInt(calculator.children) || parseInt(calculator.childrenCount) || 
                          (calculator.childSightseeings && calculator.childSightseeings[0] ? calculator.childSightseeings[0].quantity : 0) || 0;
    
    console.log('View modal - Adults:', adultsCount, 'Children:', childrenCount);
    
    // Calculate base sightseeing costs
    const baseAdultTotal = calculator.adultSightseeings.reduce((sum, item) => 
      sum + (parseFloat(item.adultPrice || 0) * (item.quantity || 1)), 0
    );
    const baseChildTotal = calculator.childSightseeings.reduce((sum, item) => 
      sum + (parseFloat(item.childPrice || 0) * (item.quantity || 1)), 0
    );
    const baseTransferTotal = calculator.transfers.reduce((sum, item) => 
      sum + (parseFloat(item.transferPrice || 0) * (item.quantity || 1)), 0
    );
    const baseHotelTotal = calculator.hotelPrices.reduce((sum, item) => 
      sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0
    );
    
    // Apply Travel Triangle 10% markup if active
    const travelTriangleMultiplier = calculator.travelTriangle ? 1.10 : 1.0;
    const adultTotal = baseAdultTotal * travelTriangleMultiplier;
    const childTotal = baseChildTotal * travelTriangleMultiplier;
    const transferTotal = baseTransferTotal * travelTriangleMultiplier;
    const hotelTotal = baseHotelTotal * travelTriangleMultiplier;
    
    const isAgent = calculator.isAgent === true;

    // Calculate visa fees (not affected by Travel Triangle)
    const totalPeople = adultsCount + childrenCount;
    const visaSightseeingFees = isAgent ? 0 : (totalPeople * 1500);
    const visaHotelFees = isAgent ? 0 : (totalPeople * 500);
    const visaTotal = visaSightseeingFees + visaHotelFees;
    const agentDiscountPerPax = isAgent ? convertCurrency(250, 'INR', calculator.currency || 'INR') : 0;
    const agentDiscountTotal = totalPeople * agentDiscountPerPax;
    
    const grandTotal = Math.max(0, adultTotal + childTotal + transferTotal + hotelTotal + visaTotal + agentDiscountTotal);
    
    return {
      adultTotal,
      childTotal,
      transferTotal,
      hotelTotal,
      visaTotal,
      visaSightseeingFees,
      visaHotelFees,
      grandTotal,
      agentDiscountPerPax,
      agentDiscountTotal,
      adultsCount,
      childrenCount
    };
  };

  const getSightseeingName = (sightseeingId) => {
    if (!sightseeingId) return 'Not Selected';
    // Handle MongoDB ObjectId - convert to string for comparison
    const idString = typeof sightseeingId === 'object' ? sightseeingId.toString() : sightseeingId;
    const sightseeing = sightseeings.find(s => s._id === idString || s._id === sightseeingId);
    return sightseeing ? sightseeing.name : `Sightseeing ID: ${idString.substring(0, 8)}...`;
  };

  const getTransferName = (transferId) => {
    if (!transferId) return 'Not Selected';
    // Handle MongoDB ObjectId - convert to string for comparison
    const idString = typeof transferId === 'object' ? transferId.toString() : transferId;
    const transfer = transfers.find(t => t._id === idString || t._id === transferId);
    return transfer ? `${transfer.name} (${transfer.fromLocation} to ${transfer.toLocation})` : `Transfer ID: ${idString.substring(0, 8)}...`;
  };

  const totals = calculateTotals();

  // Filter calculators based on search term
  const filteredCalculators = calculators.filter(calculator =>
    (calculator.tripId || calculator.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Package Cost Calculator</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          New Calculator
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by Trip ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Calculators List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trip ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adult Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Child Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transfers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hotels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grand Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCalculators.map((calculator) => (
                <tr key={calculator._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {calculator.tripId || calculator.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculator.adultSightseeings.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculator.childSightseeings.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculator.transfers.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculator.hotelPrices ? calculator.hotelPrices.length : 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {calculator.currency} {calculator.grandTotal.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(calculator)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(calculator)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingCalculator ? 'Edit Calculator' : 'Create Calculator'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div ref={pdfContentRef} className="bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trip ID
                    </label>
                    <input
                      type="text"
                      name="tripId"
                      value={formData.tripId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Adults
                    </label>
                    <input
                      type="number"
                      name="adults"
                      value={formData.adults}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Children
                    </label>
                    <input
                      type="number"
                      name="children"
                      value={formData.children}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Days
                    </label>
                    <input
                      type="number"
                      name="daysCount"
                      value={formData.daysCount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleCurrencyChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="INR">INR</option>
                      <option value="THB">THB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Travel Triangle
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="travelTriangle"
                        checked={formData.travelTriangle}
                        onChange={(e) => setFormData(prev => ({ ...prev, travelTriangle: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Add 10% markup to costs</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isAgent"
                        checked={formData.isAgent === true}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => {
                            const next = { ...prev, isAgent: checked };

                            if (checked) {
                              const currentName = (prev.name || '').trim();
                              const isAutoQuote = /^NAVAQ\d+$/i.test(currentName);
                              if (!currentName || isAutoQuote) {
                                next.name = createAgentQuoteId();
                              }
                            }

                            return next;
                          });
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Exclude visa and add {formData.currency} {totals.agentDiscountPerPax ? totals.agentDiscountPerPax.toFixed(2) : '0.00'} per pax</span>
                    </div>
                  </div>
                </div>

                {/* Adult Sightseeings */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users size={20} />
                      Adult Sightseeings
                    </h3>
                    <button
                      type="button"
                      onClick={addAdultSightseeing}
                      className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-700"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                  {formData.adultSightseeings.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={parseInt(item.day || 1)}
                        onChange={(e) => updateAdultSightseeing(index, 'day', parseInt(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: Math.max(1, parseInt(formData.daysCount || 1)) }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>Day {d}</option>
                        ))}
                      </select>
                      <SearchableSelect
                        options={sightseeings.map(sightseeing => ({
                          value: sightseeing._id,
                          label: `${sightseeing.name} - Adult: ${sightseeing.currency} ${sightseeing.adultPrice}`
                        }))}
                        value={item.sightseeingId}
                        onChange={(value) => updateAdultSightseeing(index, 'sightseeingId', value)}
                        placeholder="Select Sightseeing"
                        required
                        filterKey="label"
                        className="flex-1 min-w-[260px]"
                      />
                      <input
                        type="number"
                        value={item.adultPrice}
                        onChange={(e) => updateAdultSightseeing(index, 'adultPrice', parseFloat(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        required
                      />
                      <input
                        type="number"
                        value={item.profitPerPax || 0}
                        onChange={(e) => updateAdultSightseeing(index, 'profitPerPax', parseFloat(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="Profit/Pax"
                      />
                      <button
                        type="button"
                        onClick={() => removeAdultSightseeing(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Child Sightseeings */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users size={20} />
                      Child Sightseeings
                    </h3>
                    <button
                      type="button"
                      onClick={addChildSightseeing}
                      className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-700"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                  {formData.childSightseeings.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={parseInt(item.day || 1)}
                        onChange={(e) => updateChildSightseeing(index, 'day', parseInt(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: Math.max(1, parseInt(formData.daysCount || 1)) }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>Day {d}</option>
                        ))}
                      </select>
                      <SearchableSelect
                        options={sightseeings.map(sightseeing => ({
                          value: sightseeing._id,
                          label: `${sightseeing.name} - Child: ${sightseeing.currency} ${sightseeing.childPrice}`
                        }))}
                        value={item.sightseeingId}
                        onChange={(value) => updateChildSightseeing(index, 'sightseeingId', value)}
                        placeholder="Select Sightseeing"
                        required
                        filterKey="label"
                        className="flex-1 min-w-[260px]"
                      />
                      <input
                        type="number"
                        value={item.childPrice}
                        onChange={(e) => updateChildSightseeing(index, 'childPrice', parseFloat(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        required
                      />
                      <input
                        type="number"
                        value={item.profitPerPax || 0}
                        onChange={(e) => updateChildSightseeing(index, 'profitPerPax', parseFloat(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="Profit/Pax"
                      />
                      <button
                        type="button"
                        onClick={() => removeChildSightseeing(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Transfers */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Car size={20} />
                      Transfers
                    </h3>
                    <button
                      type="button"
                      onClick={addTransfer}
                      className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-700"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                  {formData.transfers.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={parseInt(item.day || 1)}
                        onChange={(e) => updateTransfer(index, 'day', parseInt(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: Math.max(1, parseInt(formData.daysCount || 1)) }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>Day {d}</option>
                        ))}
                      </select>
                      <SearchableSelect
                        options={transfers.map(transfer => ({
                          value: transfer._id,
                          label: `${transfer.name} (${transfer.transferType}) - ${transfer.fromLocation} to ${transfer.toLocation} - ${transfer.currency} ${transfer.price}`
                        }))}
                        value={item.transferId}
                        onChange={(value) => updateTransfer(index, 'transferId', value)}
                        placeholder="Select Transfer"
                        required
                        filterKey="label"
                        className="flex-1 min-w-[260px]"
                      />
                      <input
                        type="number"
                        value={item.transferPrice}
                        onChange={(e) => updateTransfer(index, 'transferPrice', parseFloat(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeTransfer(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Hotel Prices */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <DollarSign size={20} />
                      Hotel Prices
                    </h3>
                    <button
                      type="button"
                      onClick={addHotel}
                      className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-green-700"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                  {formData.hotelPrices.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={item.hotelName}
                        onChange={(e) => updateHotel(index, 'hotelName', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Hotel Name"
                        required
                      />
                      <input
                        type="date"
                        value={item.checkIn}
                        onChange={(e) => updateHotel(index, 'checkIn', e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Check-in"
                        required
                      />
                      <input
                        type="date"
                        value={item.checkOut}
                        onChange={(e) => updateHotel(index, 'checkOut', e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Check-out"
                        required
                      />
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateHotel(index, 'price', parseFloat(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                        placeholder="Price per person"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeHotel(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Totals Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Calculator size={20} />
                    Cost Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Adult Total</p>
                      <p className="text-lg font-semibold">{formData.currency} {totals.adultTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Child Total</p>
                      <p className="text-lg font-semibold">{formData.currency} {totals.childTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Transfer Total</p>
                      <p className="text-lg font-semibold">{formData.currency} {totals.transferTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Hotel Total</p>
                      <p className="text-lg font-semibold">{formData.currency} {totals.hotelTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Visa Total</p>
                      <p className="text-lg font-semibold">{formData.currency} {totals.visaTotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Grand Total</p>
                      <p className="text-xl font-bold text-blue-600">{formData.currency} {totals.grandTotal.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {formData.isAgent === true ? (
                      <div>
                        <p className="text-sm text-gray-600">
                          Visa Breakdown: excluded (Agent)
                        </p>
                        <p className="text-sm text-gray-600">
                          Agent Addition: {parseInt(formData.adults || 0) + parseInt(formData.children || 0)} people × {formData.currency} {totals.agentDiscountPerPax.toFixed(2)} = {formData.currency} {totals.agentDiscountTotal.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        Visa Breakdown: {parseInt(formData.adults || 0) + parseInt(formData.children || 0)} people × 
                        ({formData.currency} {convertCurrency(1500, 'INR', formData.currency).toFixed(2)} sightseeing + {formData.currency} {convertCurrency(500, 'INR', formData.currency).toFixed(2)} hotel) = {formData.currency} {totals.visaTotal.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                </div>

                {/* Section Toggles */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-3">Message Sections</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sectionToggles.showTransfers}
                        onChange={() => handleSectionToggle('showTransfers')}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">Transfers</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sectionToggles.showSightseeings}
                        onChange={() => handleSectionToggle('showSightseeings')}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">Sightseeings</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sectionToggles.showDaywiseItinerary}
                        onChange={() => handleSectionToggle('showDaywiseItinerary')}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">Day-wise Itinerary</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sectionToggles.showInclusionsExclusions}
                        onChange={() => handleSectionToggle('showInclusionsExclusions')}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">Inclusions/Exclusions</span>
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={isCopying}
                    className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Copy size={20} />
                    {isCopying ? 'Copying...' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePdf}
                    disabled={isGeneratingPdf}
                    className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Download size={20} />
                    {isGeneratingPdf ? 'Generating...' : 'Save PDF'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save size={20} />
                    {loading ? 'Saving...' : (editingCalculator ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{viewingCalculator.name}</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Adult Sightseeings */}
                {viewingCalculator.adultSightseeings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Users size={20} />
                      Adult Sightseeings
                    </h3>
                    <div className="space-y-2">
                      {viewingCalculator.adultSightseeings.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span>{getSightseeingName(item.sightseeingId)}</span>
                          <div className="flex items-center gap-4">
                            <span>Qty: {item.quantity}</span>
                            <span className="font-semibold">{viewingCalculator.currency} {item.adultPrice.toFixed(2)}</span>
                            <span className="text-green-600">Profit: {viewingCalculator.currency} {(item.profitPerPax || 0).toFixed(2)}</span>
                            <span className="font-bold">{viewingCalculator.currency} {(item.adultPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Child Sightseeings */}
                {viewingCalculator.childSightseeings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Users size={20} />
                      Child Sightseeings
                    </h3>
                    <div className="space-y-2">
                      {viewingCalculator.childSightseeings.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span>{getSightseeingName(item.sightseeingId)}</span>
                          <div className="flex items-center gap-4">
                            <span>Qty: {item.quantity}</span>
                            <span className="font-semibold">{viewingCalculator.currency} {item.childPrice.toFixed(2)}</span>
                            <span className="text-green-600">Profit: {viewingCalculator.currency} {(item.profitPerPax || 0).toFixed(2)}</span>
                            <span className="font-bold">{viewingCalculator.currency} {(item.childPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transfers */}
                {viewingCalculator.transfers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Car size={20} />
                      Transfers
                    </h3>
                    <div className="space-y-2">
                      {viewingCalculator.transfers.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span>{getTransferName(item.transferId)}</span>
                          <div className="flex items-center gap-4">
                            <span>Qty: {item.quantity}</span>
                            <span className="font-semibold">{viewingCalculator.currency} {item.transferPrice.toFixed(2)}</span>
                            <span className="font-bold">{viewingCalculator.currency} {(item.transferPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hotels */}
                {viewingCalculator.hotelPrices && viewingCalculator.hotelPrices.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <DollarSign size={20} />
                      Hotels
                    </h3>
                    <div className="space-y-2">
                      {viewingCalculator.hotelPrices.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span>{item.hotelName}</span>
                          <div className="flex items-center gap-4">
                            <span>Qty: {item.quantity}</span>
                            <span className="font-semibold">{viewingCalculator.currency} {item.price.toFixed(2)}</span>
                            <span className="font-bold">{viewingCalculator.currency} {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {viewingCalculator.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Notes</h3>
                    <p className="text-gray-600">{viewingCalculator.notes}</p>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <DollarSign size={20} />
                    Cost Summary
                  </h3>
                  {(() => {
                    const viewTotals = calculateViewTotals(viewingCalculator);
                    return (
                      <div>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Adult Total</p>
                            <p className="text-lg font-semibold">{viewingCalculator.currency} {viewTotals.adultTotal.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Child Total</p>
                            <p className="text-lg font-semibold">{viewingCalculator.currency} {viewTotals.childTotal.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Transfer Total</p>
                            <p className="text-lg font-semibold">{viewingCalculator.currency} {viewTotals.transferTotal.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Hotel Total</p>
                            <p className="text-lg font-semibold">{viewingCalculator.currency} {viewTotals.hotelTotal.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Visa Total</p>
                            <p className="text-lg font-semibold">{viewingCalculator.currency} {viewTotals.visaTotal.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Grand Total</p>
                            <p className="text-xl font-bold text-blue-600">{viewingCalculator.currency} {viewTotals.grandTotal.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {viewingCalculator.isAgent === true ? (
                            <div>
                              <p className="text-sm text-gray-600">
                                Visa Breakdown: excluded (Agent)
                              </p>
                              <p className="text-sm text-gray-600">
                                Agent Addition: {viewTotals.adultsCount + viewTotals.childrenCount} people × {viewingCalculator.currency} {viewTotals.agentDiscountPerPax.toFixed(2)} = {viewingCalculator.currency} {viewTotals.agentDiscountTotal.toFixed(2)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">
                              Visa Breakdown: {viewTotals.adultsCount + viewTotals.childrenCount} people × 
                              ({viewingCalculator.currency} {convertCurrency(1500, 'INR', viewingCalculator.currency).toFixed(2)} sightseeing + {viewingCalculator.currency} {convertCurrency(500, 'INR', viewingCalculator.currency).toFixed(2)} hotel) = {viewingCalculator.currency} {viewTotals.visaTotal.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageCalculator;
