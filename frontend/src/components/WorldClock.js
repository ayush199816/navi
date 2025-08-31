import React, { useState } from 'react';
import { FaGlobe } from 'react-icons/fa';
import AnalogClock from './AnalogClock';

// Timezone data for selected locations
const timeZones = [
  { id: 'thailand', name: 'Thailand', timeZone: 'Asia/Bangkok' },
  { id: 'bali', name: 'Bali', timeZone: 'Asia/Makassar' },
  { id: 'dubai', name: 'Dubai', timeZone: 'Asia/Dubai' },
  { id: 'vietnam', name: 'Vietnam', timeZone: 'Asia/Ho_Chi_Minh' },
  { id: 'malaysia', name: 'Malaysia/Singapore', timeZone: 'Asia/Kuala_Lumpur' },
];

const WorldClock = () => {
  const [activeTab, setActiveTab] = useState('all');

  // Group all locations under a single tab
  const regions = {
    all: timeZones.map(tz => tz.id), // All locations in one tab
  };

  const getRegionName = () => 'World Clocks';

  // Get current time in UTC for reference
  const currentTime = new Date().toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="w-screen bg-white py-12 -ml-[calc(50vw-50%)] -mr-[calc(50vw-50%)]">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
            <FaGlobe className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-blue-600 sm:text-4xl">
            World Clock
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-blue-500">
            Current UTC Time: <span className="font-semibold text-blue-600">{currentTime}</span>
          </p>
          <div className="w-20 h-1 bg-blue-200 mx-auto mt-4"></div>
        </div>
        {/* <div className="mb-8 flex justify-center overflow-x-auto pb-2">
          <div className="inline-flex space-x-2">
            {Object.keys(regions).map((region) => (
              <button
                key={region}
                onClick={() => setActiveTab(region)}
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  activeTab === region
                    ? 'bg-blue-600 text-white shadow-lg font-semibold'
                    : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {getRegionName(region)} ({regions[region].length})
              </button>
            ))}
          </div>
        </div> */}

        <div className="w-full px-4 py-6 flex justify-center">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-6 w-full max-w-6xl">
            {timeZones
              .filter((tz) => regions[activeTab].includes(tz.id))
              .slice(0, 16) // Limit to 16 cities per region
              .map((tz) => (
                <div
                  key={tz.id}
                  className="flex flex-col items-center justify-center w-full"
                >
                  <div className="bg-gray-50 rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-200 w-full max-w-[180px] border border-gray-100 flex-shrink-0">
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
