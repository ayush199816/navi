import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

  // Reset form when opening the modal or when default values change
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
  }, [open, defaultDestination, defaultDates.startDate, defaultDates.endDate, defaultPreferences, 
      setDestination, setDates, setSelectedActivities, setPreferences, setItinerary, setError, setStep]);

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
      // Try to call the backend API
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/ai/generate-itinerary`, {
        destination,
        dates,
        activities: selectedActivities,
        preferences,
      });
      
      if (response.data.success) {
        setItinerary(response.data.data);
        if (onItineraryGenerated) onItineraryGenerated(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to generate itinerary');
      }
    } catch (err) {
      console.error('Error generating itinerary:', err);
      
      // Handle specific error cases
      if (err.response?.data?.error?.includes('GoogleGenerativeAI') || 
          err.response?.data?.message?.includes('overloaded')) {
        // Show a user-friendly message for Google AI service overload
        setError('The AI service is currently experiencing high demand. Please try again in a few minutes.');
      } else if (err.response?.data?.message) {
        // Use server-provided error message
        setError(err.response.data.message);
      } else if (err.message) {
        // Fallback to generic error message
        setError('Failed to generate itinerary. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
      
      // For development, log the full error
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error details:', err);
      }
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
