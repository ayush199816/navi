import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIItineraryGenerator from '../components/AIItineraryGenerator';

const AIItineraryPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    preferences: '',
    travelers: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // The actual submission will be handled by the AIItineraryGenerator component
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            AI-Powered Itinerary Generator
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Create your perfect travel plan with our AI assistant
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <AIItineraryGenerator 
            open={true}
            onClose={() => navigate('/')}
            defaultDestination={formData.destination}
            defaultDates={{
              startDate: formData.startDate,
              endDate: formData.endDate
            }}
            defaultPreferences={formData.preferences}
            defaultTravelers={formData.travelers}
            standalone={true}
          />
        </div>
      </div>
    </div>
  );
};

export default AIItineraryPage;
