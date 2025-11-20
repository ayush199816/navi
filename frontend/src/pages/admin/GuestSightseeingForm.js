import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createGuestSightseeing, updateGuestSightseeing } from '../../redux/slices/guestSightseeingSlice';
import { toast } from 'react-toastify';
import {
  CheckIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  MapPinIcon,
  PhotoIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import api from '../../utils/api';

const SectionCard = ({ title, description, icon: Icon, children }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
      {Icon && (
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
    </div>
    <div className="px-6 py-6">{children}</div>
  </section>
);

const baseInputClasses =
  'block w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';
const textareaClasses = `${baseInputClasses} min-h-[140px] align-top`;

const GuestSightseeingForm = ({ sightseeing: propSightseeing, onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const isEditMode = !!propSightseeing?._id;
  const { error, success } = useSelector((state) => state.guestSightseeings);
  // Only USD is supported as per requirements
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

  useEffect(() => {
    if (propSightseeing) {
      const safeSightseeing = JSON.parse(JSON.stringify(propSightseeing));
      console.log('Raw propSightseeing in form:', safeSightseeing);
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
    const { name, value, type, checked } = e.target;
    let processedValue = value;

    if (type === 'checkbox') {
      processedValue = checked;
    } else if (name === 'price' || name === 'offerPrice') {
      processedValue = value === '' ? '' : Number(value);
      if (Number.isNaN(processedValue)) {
        processedValue = '';
      }
    }

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
      const formDataToSubmit = new FormData();
      const formDataCopy = { ...formData };
      const arrayFields = ['inclusions', 'highlights', 'whatToBring', 'keywords'];

      arrayFields.forEach(field => {
        let fieldValue = formDataCopy[field];

        if (typeof fieldValue === 'string') {
          try {
            fieldValue = JSON.parse(fieldValue);
          } catch (err) {
            fieldValue = [fieldValue];
          }
        }

        if (!Array.isArray(fieldValue)) {
          fieldValue = [fieldValue];
        }

        formDataCopy[field] = fieldValue
          .flat(Infinity)
          .map(item => String(item).trim())
          .filter(item => item && item !== 'undefined' && item !== 'null');
      });

      if (formDataCopy.whatToBring.length === 0) {
        formDataCopy.whatToBring = [
          'Comfortable walking shoes',
          'camera',
          'weather-appropriate clothing'
        ];
      }
      if (formDataCopy.highlights.length === 0) {
        formDataCopy.highlights = ['No highlights available'];
      }
      if (formDataCopy.inclusions.length === 0) {
        formDataCopy.inclusions = ['No inclusions specified'];
      }

      Object.entries(formDataCopy).forEach(([key, value]) => {
        if (value === null || value === undefined) return;

        formDataToSubmit.delete(key);

        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item === null || item === undefined) return;
            const strValue = String(item).trim();
            if (strValue) {
              formDataToSubmit.append(key, strValue);
            }
          });
        } else {
          formDataToSubmit.set(key, String(value).trim());
        }
      });

      if (isEditMode) {
        await dispatch(updateGuestSightseeing({
          id: propSightseeing._id,
          data: formDataToSubmit
        })).unwrap();
        toast.success('Sightseeing updated successfully');
      } else {
        await dispatch(createGuestSightseeing(formDataToSubmit)).unwrap();
        toast.success('Sightseeing created successfully');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error || 'An error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">
              Guest Sightseeing
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              {isEditMode ? 'Update guest sightseeing' : 'Create a new guest sightseeing'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Provide comprehensive details so the experience feels premium and complete for travellers.
            </p>
          </div>
          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              isEditMode ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isEditMode ? 'Editing existing record' : 'Drafting new record'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <SectionCard
            title="General information"
            description="Core details that describe the sightseeing experience."
            icon={InformationCircleIcon}
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                  Sightseeing Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={baseInputClasses}
                  placeholder="E.g. Dubai Evening Desert Safari"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="country" className="text-sm font-semibold text-slate-700">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  id="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className={baseInputClasses}
                  placeholder="United Arab Emirates"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-semibold text-slate-700">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  id="city"
                  required
                  value={formData.city || ''}
                  onChange={handleChange}
                  className={baseInputClasses}
                  placeholder="Dubai"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="activityType" className="text-sm font-semibold text-slate-700">
                  Activity Type *
                </label>
                <select
                  id="activityType"
                  name="activityType"
                  value={formData.activityType || 'Sightseeing'}
                  onChange={handleChange}
                  className={baseInputClasses}
                  required
                >
                  <option value="Sightseeing">Sightseeing</option>
                  <option value="Transfers">Transfers</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="tourType" className="text-sm font-semibold text-slate-700">
                  Tour Type *
                </label>
                <select
                  id="tourType"
                  name="tourType"
                  value={formData.tourType || 'shared'}
                  onChange={handleChange}
                  className={baseInputClasses}
                  required
                >
                  <option value="shared">Shared Tour</option>
                  <option value="private">Private Tour</option>
                  <option value="both">Both Shared & Private</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="duration" className="text-sm font-semibold text-slate-700">
                  Duration
                </label>
                <input
                  type="text"
                  name="duration"
                  id="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className={baseInputClasses}
                  placeholder="e.g., 2 hours, Full day, etc."
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Pricing"
            description="Set the published price and optional promo price."
            icon={CurrencyDollarIcon}
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-semibold text-slate-700">
                  Price (USD)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className={`${baseInputClasses} pl-8`}
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-slate-500">Displayed as the primary retail price.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="offerPrice" className="text-sm font-semibold text-slate-700">
                  Offer Price (USD)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    name="offerPrice"
                    id="offerPrice"
                    min="0"
                    step="0.01"
                    value={formData.offerPrice}
                    onChange={handleChange}
                    className={`${baseInputClasses} pl-8`}
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-slate-500">Leave empty if there is no promotional offer.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Narrative content"
            description="Craft compelling descriptions so agents can easily pitch this experience."
            icon={DocumentTextIcon}
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-semibold text-slate-700">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className={textareaClasses}
                  placeholder="Provide a crisp summary of what the guest can expect."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="aboutTour" className="text-sm font-semibold text-slate-700">
                  About this tour
                </label>
                <textarea
                  id="aboutTour"
                  name="aboutTour"
                  value={formData.aboutTour}
                  onChange={handleChange}
                  className={textareaClasses}
                  placeholder="Share detailed insights, storytelling, or insider tips."
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Keywords & highlights"
            description="Add quick tags and standout moments for faster discovery."
            icon={TagIcon}
          >
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-700">Keywords</h3>
                  <span className="text-xs font-medium text-slate-400">Press Enter to add</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((keyword, index) => (
                    <div
                      key={`${keyword}-${index}`}
                      className="group flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                    >
                      <span>{keyword}</span>
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
                        className="text-blue-400 transition hover:text-blue-700"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
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
                      const pastedKeywords = e.clipboardData
                        .getData('text')
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
                    className={baseInputClasses}
                    placeholder="Add keyword"
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
                    className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-700">Highlights</h3>
                  <span className="text-xs font-medium text-slate-400">Spotlight the wow moments</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.highlights.map((highlight, index) => (
                    <div
                      key={`${highlight}-${index}`}
                      className="group flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                    >
                      <CheckIcon className="h-4 w-4 text-emerald-500" />
                      <span>{highlight}</span>
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
                        className="text-slate-400 transition hover:text-rose-500"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
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
                    className={baseInputClasses}
                    placeholder="Add highlight"
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
                    className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Logistics & essentials"
            description="Cover meeting points, inclusions, and packing reminders."
            icon={MapPinIcon}
          >
            <div className="space-y-8">
              <div className="space-y-2">
                <label htmlFor="meetingPoint" className="text-sm font-semibold text-slate-700">
                  Meeting point
                </label>
                <input
                  type="text"
                  name="meetingPoint"
                  id="meetingPoint"
                  value={formData.meetingPoint}
                  onChange={handleChange}
                  className={baseInputClasses}
                  placeholder="Enter the exact pickup or meetup location"
                />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-700">What to bring</h3>
                    <span className="text-xs font-medium text-slate-400">Set guests up for success</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.whatToBring.map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="group flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                      >
                        <CheckIcon className="h-4 w-4 text-blue-500" />
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [...formData.whatToBring];
                            newItems.splice(index, 1);
                            setFormData(prev => ({
                              ...prev,
                              whatToBring: newItems.length > 0 ? newItems : ['No items specified']
                            }));
                          }}
                          className="text-slate-400 transition hover:text-rose-500"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
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
                      className={baseInputClasses}
                      placeholder="Add packing tip"
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
                      className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-700">What's included</h3>
                    <span className="text-xs font-medium text-slate-400">Clarify value upfront</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.inclusions.map((inclusion, index) => (
                      <div
                        key={`${inclusion}-${index}`}
                        className="group flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                      >
                        <CheckIcon className="h-4 w-4 text-emerald-500" />
                        <span>{inclusion}</span>
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
                          className="text-slate-400 transition hover:text-rose-500"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
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
                      className={baseInputClasses}
                      placeholder="Add inclusion"
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
                      className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Media & visibility"
            description="Upload imagery and control whether travellers can book this now."
            icon={PhotoIcon}
          >
            <div className="space-y-8">
              <div>
                <label className="text-sm font-semibold text-slate-700">Images</label>
                <div className="mt-3 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
                  <PhotoIcon className="h-10 w-10 text-slate-400" />
                  <div className="text-sm text-slate-600">
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer font-semibold text-blue-600 transition hover:text-blue-700"
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
                    <span className="text-slate-400"> or drag & drop</span>
                  </div>
                  <p className="text-xs text-slate-400">PNG, JPG up to 10MB each</p>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="mt-5">
                    <h4 className="text-sm font-semibold text-slate-700">Uploaded images</h4>
                    <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {imagePreviews.map((img, index) => (
                        <div
                          key={`${typeof img === 'string' ? img : img.url}-${index}`}
                          className="group relative overflow-hidden rounded-2xl border border-slate-200"
                        >
                          <img
                            src={typeof img === 'string' ? img : img.url}
                            alt={`Preview ${index + 1}`}
                            className="h-32 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute right-2 top-2 rounded-full bg-rose-500/90 p-1 text-white opacity-0 transition group-hover:opacity-100"
                            title="Remove image"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Visibility toggle</p>
                  <p className="text-xs text-slate-500">Inactive sightseeings will stay hidden from customers.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {formData.isActive ? 'Active & bookable' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>
          </SectionCard>

          <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                    <path className="opacity-75" d="M4 12a8 8 0 018-8" strokeWidth="4" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  {isEditMode ? 'Update sightseeing' : 'Create sightseeing'}
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