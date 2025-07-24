import React, { useState } from 'react';
import { FaGlobe } from 'react-icons/fa';
import AnalogClock from './AnalogClock';

// Timezone data organized by region
const timeZones = [
  // Asia
  { id: 'tokyo', name: 'Tokyo', timeZone: 'Asia/Tokyo' },
  { id: 'singapore', name: 'Singapore', timeZone: 'Asia/Singapore' },
  { id: 'mumbai', name: 'Mumbai', timeZone: 'Asia/Kolkata' },
  { id: 'beijing', name: 'Beijing', timeZone: 'Asia/Shanghai' },
  { id: 'seoul', name: 'Seoul', timeZone: 'Asia/Seoul' },
  { id: 'bangkok', name: 'Bangkok', timeZone: 'Asia/Bangkok' },
  { id: 'jakarta', name: 'Jakarta', timeZone: 'Asia/Jakarta' },
  { id: 'manila', name: 'Manila', timeZone: 'Asia/Manila' },
  { id: 'kualalumpur', name: 'Kuala Lumpur', timeZone: 'Asia/Kuala_Lumpur' },
  { id: 'hongkong', name: 'Hong Kong', timeZone: 'Asia/Hong_Kong' },
  { id: 'taipei', name: 'Taipei', timeZone: 'Asia/Taipei' },
  { id: 'bali', name: 'Bali', timeZone: 'Asia/Makassar' },
  { id: 'dubai', name: 'Dubai', timeZone: 'Asia/Dubai' },
  { id: 'telaviv', name: 'Tel Aviv', timeZone: 'Asia/Jerusalem' },
  { id: 'moscow', name: 'Moscow', timeZone: 'Europe/Moscow' },
  
  // Europe
  { id: 'london', name: 'London', timeZone: 'Europe/London' },
  { id: 'paris', name: 'Paris', timeZone: 'Europe/Paris' },
  { id: 'berlin', name: 'Berlin', timeZone: 'Europe/Berlin' },
  { id: 'rome', name: 'Rome', timeZone: 'Europe/Rome' },
  { id: 'madrid', name: 'Madrid', timeZone: 'Europe/Madrid' },
  { id: 'amsterdam', name: 'Amsterdam', timeZone: 'Europe/Amsterdam' },
  { id: 'vienna', name: 'Vienna', timeZone: 'Europe/Vienna' },
  { id: 'lisbon', name: 'Lisbon', timeZone: 'Europe/Lisbon' },
  { id: 'oslo', name: 'Oslo', timeZone: 'Europe/Oslo' },
  { id: 'stockholm', name: 'Stockholm', timeZone: 'Europe/Stockholm' },
  { id: 'copenhagen', name: 'Copenhagen', timeZone: 'Europe/Copenhagen' },
  { id: 'helsinki', name: 'Helsinki', timeZone: 'Europe/Helsinki' },
  { id: 'dublin', name: 'Dublin', timeZone: 'Europe/Dublin' },
  { id: 'brussels', name: 'Brussels', timeZone: 'Europe/Brussels' },
  { id: 'athens', name: 'Athens', timeZone: 'Europe/Athens' },
  { id: 'prague', name: 'Prague', timeZone: 'Europe/Prague' },
  { id: 'warsaw', name: 'Warsaw', timeZone: 'Europe/Warsaw' },
  { id: 'budapest', name: 'Budapest', timeZone: 'Europe/Budapest' },
  { id: 'barcelona', name: 'Barcelona', timeZone: 'Europe/Madrid' },
  
  // Americas
  { id: 'nyc', name: 'New York', timeZone: 'America/New_York' },
  { id: 'losangeles', name: 'Los Angeles', timeZone: 'America/Los_Angeles' },
  { id: 'chicago', name: 'Chicago', timeZone: 'America/Chicago' },
  { id: 'toronto', name: 'Toronto', timeZone: 'America/Toronto' },
  { id: 'mexicocity', name: 'Mexico City', timeZone: 'America/Mexico_City' },
  { id: 'lima', name: 'Lima', timeZone: 'America/Lima' },
  { id: 'bogota', name: 'Bogotá', timeZone: 'America/Bogota' },
  { id: 'santiago', name: 'Santiago', timeZone: 'America/Santiago' },
  { id: 'buenosaires', name: 'Buenos Aires', timeZone: 'America/Argentina/Buenos_Aires' },
  { id: 'riodejaneiro', name: 'Rio de Janeiro', timeZone: 'America/Sao_Paulo' },
  { id: 'saopaulo', name: 'São Paulo', timeZone: 'America/Sao_Paulo' },
  { id: 'caracas', name: 'Caracas', timeZone: 'America/Caracas' },
  { id: 'miami', name: 'Miami', timeZone: 'America/New_York' },
  { id: 'houston', name: 'Houston', timeZone: 'America/Chicago' },
  { id: 'phoenix', name: 'Phoenix', timeZone: 'America/Phoenix' },
  { id: 'denver', name: 'Denver', timeZone: 'America/Denver' },
  { id: 'vancouver', name: 'Vancouver', timeZone: 'America/Vancouver' },
  { id: 'montreal', name: 'Montreal', timeZone: 'America/Toronto' },
  { id: 'boston', name: 'Boston', timeZone: 'America/New_York' },
  { id: 'washington', name: 'Washington DC', timeZone: 'America/New_York' },
  { id: 'atlanta', name: 'Atlanta', timeZone: 'America/New_York' },
  { id: 'dallas', name: 'Dallas', timeZone: 'America/Chicago' },
  { id: 'seattle', name: 'Seattle', timeZone: 'America/Los_Angeles' },
  { id: 'sanfrancisco', name: 'San Francisco', timeZone: 'America/Los_Angeles' },
  { id: 'lasvegas', name: 'Las Vegas', timeZone: 'America/Los_Angeles' },
  { id: 'portland', name: 'Portland', timeZone: 'America/Los_Angeles' },
  { id: 'honolulu', name: 'Honolulu', timeZone: 'Pacific/Honolulu' },
  { id: 'anchorage', name: 'Anchorage', timeZone: 'America/Anchorage' },
  
  // Australia/Oceania
  { id: 'sydney', name: 'Sydney', timeZone: 'Australia/Sydney' },
  { id: 'melbourne', name: 'Melbourne', timeZone: 'Australia/Melbourne' },
  { id: 'brisbane', name: 'Brisbane', timeZone: 'Australia/Brisbane' },
  { id: 'perth', name: 'Perth', timeZone: 'Australia/Perth' },
  { id: 'auckland', name: 'Auckland', timeZone: 'Pacific/Auckland' },
  { id: 'wellington', name: 'Wellington', timeZone: 'Pacific/Auckland' },
  
  // Africa
  { id: 'capetown', name: 'Cape Town', timeZone: 'Africa/Johannesburg' },
  { id: 'cairo', name: 'Cairo', timeZone: 'Africa/Cairo' },
  { id: 'nairobi', name: 'Nairobi', timeZone: 'Africa/Nairobi' },
  { id: 'casablanca', name: 'Casablanca', timeZone: 'Africa/Casablanca' },
  { id: 'lagos', name: 'Lagos', timeZone: 'Africa/Lagos' },
];

const WorldClock = () => {
  const [activeTab, setActiveTab] = useState('asia');

  const regions = {
    asia: ['tokyo', 'singapore', 'mumbai', 'beijing', 'seoul', 'bangkok', 'jakarta', 'manila', 'kualalumpur', 'hongkong', 'taipei', 'bali', 'dubai', 'telaviv', 'moscow'],
    europe: ['london', 'paris', 'berlin', 'rome', 'madrid', 'amsterdam', 'vienna', 'lisbon', 'oslo', 'stockholm', 'copenhagen', 'helsinki', 'dublin', 'brussels', 'athens', 'prague', 'warsaw', 'budapest', 'barcelona'],
    americas: ['nyc', 'losangeles', 'chicago', 'toronto', 'mexicocity', 'lima', 'bogota', 'santiago', 'buenosaires', 'riodejaneiro', 'saopaulo', 'caracas', 'miami', 'houston', 'phoenix', 'denver', 'vancouver', 'montreal', 'boston', 'washington', 'atlanta', 'dallas', 'seattle', 'sanfrancisco', 'lasvegas', 'portland', 'honolulu', 'anchorage'],
    australia: ['sydney', 'melbourne', 'brisbane', 'perth', 'auckland', 'wellington'],
    africa: ['capetown', 'cairo', 'nairobi', 'casablanca', 'lagos'],
  };

  const getRegionName = (region) => {
    switch (region) {
      case 'asia':
        return 'Asia';
      case 'europe':
        return 'Europe';
      case 'americas':
        return 'Americas';
      case 'australia':
        return 'Australia/Oceania';
      case 'africa':
        return 'Africa';
      default:
        return region;
    }
  };

  // Get current time in UTC for reference
  const currentTime = new Date().toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="w-screen bg-gradient-to-br from-blue-600 to-blue-800 py-12 -ml-[calc(50vw-50%)] -mr-[calc(50vw-50%)]">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4">
            <FaGlobe className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            World Clock
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-blue-100">
            Current UTC Time: <span className="font-semibold text-white">{currentTime}</span>
          </p>
          <div className="w-20 h-1 bg-white/50 mx-auto mt-4"></div>
        </div>

        <div className="mb-8 flex justify-center overflow-x-auto pb-2">
          <div className="inline-flex space-x-2">
            {Object.keys(regions).map((region) => (
              <button
                key={region}
                onClick={() => setActiveTab(region)}
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  activeTab === region
                    ? 'bg-white text-blue-700 shadow-lg font-semibold'
                    : 'text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                {getRegionName(region)} ({regions[region].length})
              </button>
            ))}
          </div>
        </div>

        <div className="w-full px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-8 gap-4 w-full">
            {timeZones
              .filter((tz) => regions[activeTab].includes(tz.id))
              .slice(0, 16) // Limit to 16 cities per region
              .map((tz) => (
                <div
                  key={tz.id}
                  className="flex flex-col items-center justify-center w-full p-4"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-lg p-4 hover:bg-white/20 transition-all duration-200 w-full max-w-[160px] border border-white/10 flex-shrink-0">
                    <div className="mb 2">
                      <AnalogClock timeZone={tz.timeZone} city={tz.name} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldClock;
