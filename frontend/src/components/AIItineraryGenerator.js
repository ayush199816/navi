import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Destination-specific activities
const DESTINATION_ACTIVITIES = {
  'Krabi': [
    '4 Island Tour by Speedboat',
    '7 Island Sunset Tour',
    'Railay Beach & Phra Nang Cave',
    'Hong Islands Tour',
    'Emerald Pool & Hot Springs',
    'Tiger Cave Temple',
    'Kayaking in Ao Thalane'
  ],
  'Phuket': [
    'Phi Phi Islands Day Trip',
    'James Bond Island Tour',
    'Phang Nga Bay by Speedboat',
    'Similan Islands Diving',
    'Phuket Old Town Tour',
    'Big Buddha & Viewpoints',
    'Elephant Sanctuary Visit'
  ],
  'Pattaya': [
    'Coral Island Day Trip',
    'Koh Larn Island Hopping',
    'Floating Market Tour',
    'Sanctuary of Truth',
    'Nong Nooch Tropical Garden',
    'Pattaya Viewpoints',
    'Underwater World'
  ]
};

const AIItineraryGenerator = ({
  open,
  onClose,
  defaultDestination = '',
  defaultDates = {},
  defaultPreferences = '',
  onItineraryGenerated
}) => {
  const [destination, setDestination] = useState(defaultDestination);
  const [dates, setDates] = useState({
    startDate: defaultDates.startDate || '',
    endDate: defaultDates.endDate || ''
  });
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);

  // Reset form when opening the modal
  useEffect(() => {
    if (open) {
      setDestination(defaultDestination);
      setDates({
        startDate: defaultDates.startDate || '',
        endDate: defaultDates.endDate || ''
      });
      setSelectedActivities([]);
      setPreferences(defaultPreferences);
      setItinerary(null);
      setError(null);
      setStep(1);
    }
  }, [open]);

  const handleActivityToggle = (activity) => {
    setSelectedActivities(prev => 
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    
    if (step === 1) {
      setStep(2);
      return;
    }
    
    setLoading(true);
    setError(null);
    setItinerary(null);
    
    try {
      // In a real implementation, you would call your backend API here
      // For example:
      // const res = await axios.post('http://localhost:5000/api/ai/itinerary', {
      //   destination,
      //   dates,
      //   activities: selectedActivities,
      //   preferences,
      // });
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock response - in a real app, this would come from the API
      const mockItinerary = {
        destination,
        duration: `${dates.startDate} to ${dates.endDate}`,
        activities: selectedActivities.map(activity => ({
          day: 1,
          time: '09:00 AM',
          activity,
          duration: '4-6 hours',
          description: `Experience the best of ${activity} in ${destination}.`
        })),
        notes: preferences ? `Special preferences: ${preferences}` : ''
      };
      
      setItinerary(mockItinerary);
      if (onItineraryGenerated) onItineraryGenerated(mockItinerary);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate itinerary');
      console.error('Error generating itinerary:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl overflow-y-auto max-h-[95vh]">
        <h3 className="text-lg font-bold mb-2">AI Itinerary Generator</h3>
        <form onSubmit={handleGenerate} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Destination</label>
            <input className="form-input w-full" value={destination} onChange={e => setDestination(e.target.value)} required />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm mb-1">Start Date</label>
              <input className="form-input w-full" type="date" value={dates.startDate || ''} onChange={e => setDates(d => ({ ...d, startDate: e.target.value }))} required />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1">End Date</label>
              <input className="form-input w-full" type="date" value={dates.endDate || ''} onChange={e => setDates(d => ({ ...d, endDate: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Preferences / Requirements</label>
            <textarea className="form-input w-full" rows={2} value={preferences} onChange={e => setPreferences(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Generating...' : 'Generate Itinerary'}</button>
          </div>
        </form>
        {error && <div className="mt-2 text-red-600">{error}</div>}
        {itinerary && (
          <div className="mt-4">
            <h4 className="font-semibold mb-1">Generated Itinerary</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mb-2">{typeof itinerary === 'string' ? itinerary : JSON.stringify(itinerary, null, 2)}</pre>
            {onItineraryGenerated && (
              <button className="btn-primary" onClick={() => { onItineraryGenerated(itinerary); onClose(); }}>Attach to Quote</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIItineraryGenerator;
