import React, { useState } from 'react';
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
  const [dates, setDates] = useState(defaultDates);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setItinerary(null);
    try {
      const res = await axios.post('http://localhost:5000/api/ai/itinerary', {
        destination,
        dates,
        preferences,
      });
      setItinerary(res.data.itinerary);
      if (onItineraryGenerated) onItineraryGenerated(res.data.itinerary);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate itinerary');
    }
    setLoading(false);
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
