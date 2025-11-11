import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createGuestSightseeing, 
  updateGuestSightseeing,
  clearGuestSightseeingState
} from '../../redux/slices/guestSightseeingSlice';
import { toast } from 'react-toastify';
import { CheckIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';

const GuestSightseeingForm = ({ sightseeing: propSightseeing, onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const isEditMode = !!propSightseeing?._id;
  
  const { loading, error, success } = useSelector(
    (state) => state.guestSightseeings
  );

  // Only USD is supported as per requirements
  const currency = 'USD';

  const [formData, setFormData] = useState({
    name: '',
    country: '',
    city: '',
    description: '',
    price: '',
    priceCurrency: 'USD', // Default currency
    offerPrice: '',
    offerPriceCurrency: 'USD', // Default currency
    duration: 'Not specified',
    inclusions: ['No inclusions specified'],
    isActive: true,
    images: [],
    keywords: [],
    tourType: 'shared', // Default to shared
    activityType: 'Sightseeing', // Default to Sightseeing
    aboutTour: 'No detailed description available.',
    highlights: ['No highlights available'],
    meetingPoint: 'To be advised upon booking',
    whatToBring: ['Comfortable walking shoes', 'camera', 'weather-appropriate clothing']
  });
  
  const [newInclusion, setNewInclusion] = useState('');
  const [newHighlight, setNewHighlight] = useState('');
  const [newWhatToBring, setNewWhatToBring] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when propSightseeing changes
  useEffect(() => {
    if (propSightseeing) {
      // Create a safe copy of propSightseeing without circular references
      const safeSightseeing = JSON.parse(JSON.stringify(propSightseeing));
      console.log('Raw propSightseeing in form:', safeSightseeing);
      
      // Define default values
      const defaultValues = {
        name: '',
        country: '',
        city: '',
        description: '',
        price: '',
        priceCurrency: 'USD',
        offerPrice: '',
        offerPriceCurrency: 'USD',
        duration: 'Not specified',
        inclusions: ['No inclusions specified'],
        isActive: true,
        images: [],
        keywords: [],
        tourType: 'shared',
        activityType: 'Sightseeing',
        aboutTour: 'No detailed description available.',
        highlights: ['No highlights available'],
        meetingPoint: 'To be advised upon booking',
        whatToBring: ['Comfortable walking shoes', 'camera', 'weather-appropriate clothing']
      };
      
      // Create new form data with defaults and override with prop values
      const newFormData = { ...defaultValues };
      
      // Only override with prop values that are not undefined or null
      Object.keys(safeSightseeing).forEach(key => {
        if (safeSightseeing[key] !== undefined && safeSightseeing[key] !== null) {
          // Special handling for arrays to ensure they are properly initialized
          if (Array.isArray(defaultValues[key])) {
            newFormData[key] = Array.isArray(safeSightseeing[key]) 
              ? [...safeSightseeing[key]] 
              : [];
          } else {
            newFormData[key] = safeSightseeing[key];
          }
        }
      });
      
      // Ensure required fields have proper values
      if (!newFormData.tourType) {
        newFormData.tourType = 'shared';
      }
      if (!newFormData.activityType) {
        newFormData.activityType = 'Sightseeing';
      }
      if (!newFormData.city) {
        newFormData.city = '';
      }
      
      // Handle array fields to ensure they are properly initialized
      if (!Array.isArray(newFormData.inclusions) || newFormData.inclusions.length === 0) {
        newFormData.inclusions = ['No inclusions specified'];
      }
      if (!Array.isArray(newFormData.keywords)) {
        newFormData.keywords = [];
      }
      if (!Array.isArray(newFormData.highlights) || newFormData.highlights.length === 0) {
        newFormData.highlights = ['No highlights available'];
      }
      if (!Array.isArray(newFormData.whatToBring) || newFormData.whatToBring.length === 0) {
        newFormData.whatToBring = ['Comfortable walking shoes', 'camera', 'weather-appropriate clothing'];
      }
      
      console.log('Setting form data:', newFormData);
      
      setFormData(newFormData);
      setImagePreviews(propSightseeing.images || []);
    } else {
      // Reset form if no sightseeing is provided
      setFormData({
        name: '',
        country: '',
        city: '',
        description: '',
        price: '',
        priceCurrency: 'USD',
        offerPrice: '',
        offerPriceCurrency: 'USD',
        duration: 'Not specified',
        inclusions: ['No inclusions specified'],
        isActive: true,
        images: [],
        keywords: [],
        tourType: 'shared',
        activityType: 'Sightseeing',
        aboutTour: 'No detailed description available.',
        highlights: ['No highlights available'],
        meetingPoint: 'To be advised upon booking',
        whatToBring: ['Comfortable walking shoes', 'camera', 'weather-appropriate clothing']
      });
      setImagePreviews([]);
      setNewInclusion('');
      setNewHighlight('');
      setNewWhatToBring('');
    }
  }, [propSightseeing]);

  useEffect(() => {
    if (success && onSuccess) {
      toast.success(
        `Sightseeing ${isEditMode ? 'updated' : 'created'} successfully!`
      );
      onSuccess();
    }

    if (error) {
      toast.error(error);
    }
  }, [success, error, isEditMode, onSuccess]);

  const handleBack = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convert price and offerPrice to numbers
    const processedValue = (name === 'price' || name === 'offerPrice') && value !== '' 
      ? parseFloat(value) || ''
      : value;
      
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    try {
      const response = await api.post('/guest-sightseeing/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const newImageUrls = response.data.data.map(item => 
          typeof item === 'string' ? item : item.url || item.secure_url
        );
        
        const newImages = newImageUrls.map(url => ({
          url,
          name: url.split('/').pop()
        }));
        
        setImagePreviews(prev => [...prev, ...newImages]);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImageUrls]
        }));
        
        toast.success(`${files.length} image(s) uploaded successfully`);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error.response?.data?.message || 'Failed to upload images');
    }
  };

  const handleRemoveImage = (index) => {
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      images: newPreviews.map(img => (typeof img === 'string' ? img : img.name))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create FormData object
      const formDataToSubmit = new FormData();
      
      // Add all form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Handle array fields
          if (Array.isArray(value)) {
            // For arrays, append each item with the same key
            value.forEach(item => {
              formDataToSubmit.append(key, item);
            });
          } else {
            // For regular fields, just append the value
            formDataToSubmit.append(key, value);
          }
        }
      });
      
      // Ensure required fields have default values
      if (!formData.tourType) {
        formDataToSubmit.set('tourType', 'shared');
      }
      
      if (!formData.duration) {
        formDataToSubmit.set('duration', 'Not specified');
      }
      
      // Convert price fields to numbers
      if (formData.price) {
        formDataToSubmit.set('price', Number(formData.price));
      }
      
      if (formData.offerPrice) {
        formDataToSubmit.set('offerPrice', Number(formData.offerPrice));
      }
      
      // Handle empty arrays
      if (!formData.inclusions || formData.inclusions.length === 0) {
        formDataToSubmit.delete('inclusions');
        formDataToSubmit.append('inclusions', 'No inclusions specified');
      }
      
      if (isEditMode) {
        await dispatch(updateGuestSightseeing({ 
          id: propSightseeing._id, 
          data: formDataToSubmit
        })).unwrap();
        
        toast.success('Sightseeing updated successfully');
        if (onSuccess) onSuccess();
      } else {
        await dispatch(createGuestSightseeing(formDataToSubmit)).unwrap();
        toast.success('Sightseeing created successfully');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error || 'An error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Guest Sightseeing' : 'Add New Guest Sightseeing'}
        </h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Sightseeing Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="country"
                    id="country"
                    required
                    value={formData.country}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="city"
                    id="city"
                    required
                    value={formData.city || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="activityType" className="block text-sm font-medium text-gray-700">
                  Activity Type *
                </label>
                <div className="mt-1">
                  <select
                    id="activityType"
                    name="activityType"
                    value={formData.activityType || 'Sightseeing'}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Transfers">Transfers</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="tourType" className="block text-sm font-medium text-gray-700">
                  Tour Type *
                </label>
                <div className="mt-1">
                  <select
                    id="tourType"
                    name="tourType"
                    value={formData.tourType || 'shared'}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    <option value="shared">Shared Tour</option>
                    <option value="private">Private Tour</option>
                    <option value="both">Both Shared & Private</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price (USD)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">
                        $
                      </span>
                    </div>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-8 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="offerPrice" className="block text-sm font-medium text-gray-700">
                    Offer Price (USD)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">
                        $
                      </span>
                    </div>
                    <input
                      type="number"
                      name="offerPrice"
                      id="offerPrice"
                      min="0"
                      step="0.01"
                      value={formData.offerPrice}
                      onChange={handleChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-8 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                  Leave empty if there's no special offer
                </p>

              <div className="sm:col-span-3">
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Duration
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="duration"
                    id="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., 2 hours, Full day, etc."
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    required
                    value={formData.description}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="aboutTour" className="block text-sm font-medium text-gray-700">
                  About This Tour
                </label>
                <div className="mt-1">
                  <textarea
                    id="aboutTour"
                    name="aboutTour"
                    rows={4}
                    value={formData.aboutTour}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Detailed description of the tour"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.keywords.map((keyword, index) => (
                      <div key={index} className="flex items-center bg-blue-100 rounded-full px-3 py-1">
                        <span className="text-sm text-blue-800 mr-1">{keyword}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newKeywords = [...formData.keywords];
                            newKeywords.splice(index, 1);
                            setFormData(prev => ({
                              ...prev,
                              keywords: newKeywords
                            }));
                          }}
                          className="text-blue-400 hover:text-blue-700 focus:outline-none"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ',') && newKeyword.trim()) {
                          e.preventDefault();
                          const keywordToAdd = newKeyword.trim().replace(/,+$/, '');
                          if (keywordToAdd) {
                            setFormData(prev => ({
                              ...prev,
                              keywords: [...new Set([...prev.keywords, keywordToAdd])]
                            }));
                            setNewKeyword('');
                          }
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const pastedKeywords = pastedText
                          .split(',')
                          .map(k => k.trim())
                          .filter(k => k.length > 0);
                        
                        if (pastedKeywords.length > 0) {
                          setFormData(prev => ({
                            ...prev,
                            keywords: [...new Set([...prev.keywords, ...pastedKeywords])]
                          }));
                        }
                      }}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Type and press Enter or comma to add keywords"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newKeyword.trim()) {
                          const keywordToAdd = newKeyword.trim().replace(/,+$/, '');
                          if (keywordToAdd) {
                            setFormData(prev => ({
                              ...prev,
                              keywords: [...new Set([...prev.keywords, keywordToAdd])]
                            }));
                            setNewKeyword('');
                          }
                        }
                      }}
                      className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Highlights
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-gray-700 mr-1">{highlight}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newHighlights = [...formData.highlights];
                            newHighlights.splice(index, 1);
                            setFormData(prev => ({
                              ...prev,
                              highlights: newHighlights.length > 0 ? newHighlights : ['No highlights available']
                            }));
                          }}
                          className="text-gray-400 hover:text-red-500 focus:outline-none"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex mt-2">
                    <input
                      type="text"
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newHighlight.trim()) {
                          e.preventDefault();
                          const newHighlights = [...formData.highlights.filter(h => h !== 'No highlights available'), newHighlight.trim()];
                          setFormData(prev => ({
                            ...prev,
                            highlights: newHighlights
                          }));
                          setNewHighlight('');
                        }
                      }}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Add a highlight and press Enter"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newHighlight.trim()) {
                          const newHighlights = [...formData.highlights.filter(h => h !== 'No highlights available'), newHighlight.trim()];
                          setFormData(prev => ({
                            ...prev,
                            highlights: newHighlights
                          }));
                          setNewHighlight('');
                        }
                      }}
                      className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="meetingPoint" className="block text-sm font-medium text-gray-700">
                  Meeting Point
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="meetingPoint"
                    id="meetingPoint"
                    value={formData.meetingPoint}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Enter meeting point details"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What to Bring
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.whatToBring.map((item, index) => (
                      <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-gray-700 mr-1">{item}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newWhatToBring = [...formData.whatToBring];
                            newWhatToBring.splice(index, 1);
                            setFormData(prev => ({
                              ...prev,
                              whatToBring: newWhatToBring.length > 0 ? newWhatToBring : ['No items specified']
                            }));
                          }}
                          className="text-gray-400 hover:text-red-500 focus:outline-none"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex mt-2">
                    <input
                      type="text"
                      value={newWhatToBring}
                      onChange={(e) => setNewWhatToBring(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newWhatToBring.trim()) {
                          e.preventDefault();
                          const updatedItems = [...formData.whatToBring, newWhatToBring.trim()];
                          setFormData(prev => ({
                            ...prev,
                            whatToBring: updatedItems.includes('No items specified') 
                              ? updatedItems.filter(item => item !== 'No items specified')
                              : updatedItems
                          }));
                          setNewWhatToBring('');
                        }
                      }}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Add an item and press Enter"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newWhatToBring.trim()) {
                          const updatedItems = [...formData.whatToBring, newWhatToBring.trim()];
                          setFormData(prev => ({
                            ...prev,
                            whatToBring: updatedItems.includes('No items specified') 
                              ? updatedItems.filter(item => item !== 'No items specified')
                              : updatedItems
                          }));
                          setNewWhatToBring('');
                        }
                      }}
                      className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's Included
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.inclusions.map((inclusion, index) => (
                      <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-gray-700 mr-1">{inclusion}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newInclusions = [...formData.inclusions];
                            newInclusions.splice(index, 1);
                            setFormData(prev => ({
                              ...prev,
                              inclusions: newInclusions.length > 0 ? newInclusions : ['No inclusions specified']
                            }));
                          }}
                          className="text-gray-400 hover:text-red-500 focus:outline-none"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex mt-2">
                    <input
                      type="text"
                      value={newInclusion}
                      onChange={(e) => setNewInclusion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newInclusion.trim()) {
                          e.preventDefault();
                          const updatedInclusions = [...formData.inclusions, newInclusion.trim()];
                          setFormData(prev => ({
                            ...prev,
                            inclusions: updatedInclusions.includes('No inclusions specified')
                              ? updatedInclusions.filter(item => item !== 'No inclusions specified')
                              : updatedInclusions
                          }));
                          setNewInclusion('');
                        }
                      }}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Add an inclusion and press Enter"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newInclusion.trim()) {
                          const updatedInclusions = [...formData.inclusions, newInclusion.trim()];
                          setFormData(prev => ({
                            ...prev,
                            inclusions: updatedInclusions.includes('No inclusions specified')
                              ? updatedInclusions.filter(item => item !== 'No inclusions specified')
                              : updatedInclusions
                          }));
                          setNewInclusion('');
                        }
                      }}
                      className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  Images
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload files</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          className="sr-only" 
                          multiple
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
                
                {/* Image previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {imagePreviews.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={typeof img === 'string' ? img : img.url}
                            alt={`Preview ${index + 1}`}
                            className="h-24 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-center">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Inactive sightseeings won't be visible to customers
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="https://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-1" />
                  {isEditMode ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestSightseeingForm;
