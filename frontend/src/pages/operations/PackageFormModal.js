import React, { useState, useRef } from 'react';
import axios from 'axios';

const defaultItineraryDay = {
  day: 1,
  title: 'Arrival & Check-in',
  description: 'Welcome to your destination! Check-in at the hotel and spend the rest of the day at leisure to relax and explore the surroundings.',
  activities: [],
  meals: { breakfast: false, lunch: false, dinner: false },
  accommodation: 'Standard Hotel',
};

const PackageFormModal = ({ open, onClose, onSuccess, editPackage }) => {
  const [form, setForm] = useState(() =>
    editPackage
      ? { ...editPackage, itinerary: editPackage.itinerary || [], images: editPackage.images || [] }
      : {
          name: '',
          description: '',
          destination: '',
          duration: 1,
          price: '',
          agentPrice: '',
          offerPrice: '',
          endDate: '',
          inclusions: [],
          exclusions: [],
          itinerary: [{ ...defaultItineraryDay }],
          images: [],
        }
  );
  const [imageFiles, setImageFiles] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field, idx, value) => {
    setForm((prev) => {
      const arr = [...prev[field]];
      arr[idx] = value;
      return { ...prev, [field]: arr };
    });
  };

  const handleAddInclusion = () => setForm((prev) => ({ ...prev, inclusions: [...prev.inclusions, ''] }));
  const handleAddExclusion = () => setForm((prev) => ({ ...prev, exclusions: [...prev.exclusions, ''] }));
  const handleRemoveInclusion = (idx) => setForm((prev) => ({ ...prev, inclusions: prev.inclusions.filter((_, i) => i !== idx) }));
  const handleRemoveExclusion = (idx) => setForm((prev) => ({ ...prev, exclusions: prev.exclusions.filter((_, i) => i !== idx) }));

  // Itinerary
  const handleItineraryChange = (idx, field, value) => {
    setForm((prev) => {
      const arr = [...prev.itinerary];
      arr[idx][field] = value;
      return { ...prev, itinerary: arr };
    });
  };
  const handleItineraryMeal = (idx, meal) => {
    setForm((prev) => {
      const arr = [...prev.itinerary];
      arr[idx].meals[meal] = !arr[idx].meals[meal];
      return { ...prev, itinerary: arr };
    });
  };
  const handleAddItineraryDay = () => {
    setForm((prev) => ({
      ...prev,
      itinerary: [
        ...prev.itinerary,
        { ...defaultItineraryDay, day: prev.itinerary.length + 1 },
      ],
    }));
  };
  const handleRemoveItineraryDay = (idx) => {
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })),
    }));
  };

  // Image upload
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);
  };
  const handleRemoveImage = (idx) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // Validate required fields
      if (!form.name || !form.description || !form.destination || !form.duration || !form.price || !form.agentPrice || !form.endDate) {
        setError('Please fill all required fields.');
        setSubmitting(false);
        return;
      }
      const data = new FormData();
      data.append('name', form.name);
      data.append('description', form.description);
      data.append('destination', form.destination);
      data.append('duration', form.duration);
      data.append('price', form.price);
      data.append('agentPrice', form.agentPrice);
      data.append('offerPrice', form.offerPrice || form.price);
      data.append('endDate', form.endDate);
      data.append('inclusions', JSON.stringify(form.inclusions));
      data.append('exclusions', JSON.stringify(form.exclusions));
      data.append('itinerary', JSON.stringify(form.itinerary));
      imageFiles.forEach((file) => data.append('packageImages', file));
      let res;
      if (editPackage) {
        res = await axios.put(`/api/packages/${editPackage._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await axios.post('/api/packages', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onSuccess(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save package');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-[95vh]">
        <h3 className="text-lg font-bold mb-4">{editPackage ? 'Edit Package' : 'Create Package'}</h3>
        {error && <div className="mb-2 text-red-600">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Name *</label>
              <input className="form-input w-full" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Destination *</label>
              <input className="form-input w-full" name="destination" value={form.destination} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Price (₹)</label>
              <input className="form-input" type="number" name="price" value={form.price} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Agent Price (₹)</label>
              <input className="form-input" type="number" name="agentPrice" value={form.agentPrice} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm mb-1">Offer Price (₹)</label>
              <input className="form-input" type="number" name="offerPrice" value={form.offerPrice} onChange={handleChange} placeholder="Leave empty to use regular price" />
            </div>
            <div>
              <label className="block text-sm mb-1">End Date</label>
              <input className="form-input" type="date" name="endDate" value={form.endDate} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm mb-1">Duration (days) *</label>
              <input className="form-input w-full" name="duration" type="number" min="1" value={form.duration} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Price *</label>
              <input className="form-input w-full" name="price" type="number" min="0" value={form.price} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Agent Price *</label>
              <input className="form-input w-full" name="agentPrice" type="number" min="0" value={form.agentPrice} onChange={handleChange} required />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm mb-1">Description *</label>
            <textarea className="form-input w-full" name="description" value={form.description} onChange={handleChange} required rows={2} />
          </div>
          {/* Inclusions/Exclusions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm mb-1">Inclusions</label>
              {form.inclusions.map((inc, idx) => (
                <div key={idx} className="flex items-center mb-1">
                  <input className="form-input flex-1" value={inc} onChange={e => handleArrayChange('inclusions', idx, e.target.value)} />
                  <button type="button" className="ml-2 text-red-500" onClick={() => handleRemoveInclusion(idx)}>&times;</button>
                </div>
              ))}
              <button type="button" className="btn-outline mt-1" onClick={handleAddInclusion}>+ Add Inclusion</button>
            </div>
            <div>
              <label className="block text-sm mb-1">Exclusions</label>
              {form.exclusions.map((exc, idx) => (
                <div key={idx} className="flex items-center mb-1">
                  <input className="form-input flex-1" value={exc} onChange={e => handleArrayChange('exclusions', idx, e.target.value)} />
                  <button type="button" className="ml-2 text-red-500" onClick={() => handleRemoveExclusion(idx)}>&times;</button>
                </div>
              ))}
              <button type="button" className="btn-outline mt-1" onClick={handleAddExclusion}>+ Add Exclusion</button>
            </div>
          </div>
          {/* Itinerary */}
          <div className="mt-4">
            <label className="block text-sm mb-1">Day-wise Itinerary</label>
            {form.itinerary.map((day, idx) => (
              <div key={idx} className="border rounded p-2 mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">Day {day.day}</span>
                  {form.itinerary.length > 1 && (
                    <button type="button" className="text-red-500" onClick={() => handleRemoveItineraryDay(idx)}>&times;</button>
                  )}
                </div>
                <input className="form-input mb-1" placeholder="Title" value={day.title} onChange={e => handleItineraryChange(idx, 'title', e.target.value)} />
                <textarea className="form-input mb-1" placeholder="Description" rows={2} value={day.description} onChange={e => handleItineraryChange(idx, 'description', e.target.value)} />
                <input className="form-input mb-1" placeholder="Activities (comma separated)" value={day.activities?.join(', ')} onChange={e => handleItineraryChange(idx, 'activities', e.target.value.split(',').map(a => a.trim()))} />
                <div className="flex gap-2 mb-1">
                  <label><input type="checkbox" checked={day.meals.breakfast} onChange={() => handleItineraryMeal(idx, 'breakfast')} /> Breakfast</label>
                  <label><input type="checkbox" checked={day.meals.lunch} onChange={() => handleItineraryMeal(idx, 'lunch')} /> Lunch</label>
                  <label><input type="checkbox" checked={day.meals.dinner} onChange={() => handleItineraryMeal(idx, 'dinner')} /> Dinner</label>
                </div>
                <input className="form-input mb-1" placeholder="Accommodation" value={day.accommodation} onChange={e => handleItineraryChange(idx, 'accommodation', e.target.value)} />
              </div>
            ))}
            <button type="button" className="btn-outline mt-1" onClick={handleAddItineraryDay}>+ Add Day</button>
          </div>
          {/* Image upload */}
          <div className="mt-4">
            <label className="block text-sm mb-1">Images</label>
            <input type="file" multiple ref={fileInputRef} onChange={handleImageChange} className="mb-2" />
            <div className="flex flex-wrap gap-2">
              {imageFiles.map((file, idx) => (
                <div key={idx} className="relative">
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-20 h-20 object-cover rounded" />
                  <button type="button" className="absolute top-0 right-0 bg-white rounded-full text-red-500 px-1" onClick={() => handleRemoveImage(idx)}>&times;</button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end mt-6 space-x-2">
            <button type="button" className="btn-outline" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving...' : (editPackage ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageFormModal;
