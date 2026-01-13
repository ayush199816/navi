import React, { useState, useEffect } from 'react';
import { FaGlobe } from 'react-icons/fa';

// Simple Analog Clock Hands Component
const AnalogClockHands = ({ timeZone }) => {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const parts = formatter.formatToParts(now);
      const timeParts = {};
      parts.forEach(part => {
        if (['hour', 'minute', 'second'].includes(part.type)) {
          timeParts[part.type] = parseInt(part.value, 10);
        }
      });
      
      setTime({
        hours: timeParts.hour % 12,
        minutes: timeParts.minute,
        seconds: timeParts.second
      });
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [timeZone]);

  // Calculate rotation degrees
  const secondsDegrees = (time.seconds * 6) % 360;
  const minutesDegrees = (time.minutes * 6 + time.seconds * 0.1) % 360;
  const hoursDegrees = (time.hours * 30 + time.minutes * 0.5) % 360;


  return (
    <div className="relative w-full h-full">
      {/* Hour Hand */}
      <div 
        className="absolute w-1.5 h-10 bg-orange-700 origin-bottom left-1/2 bottom-1/2 -ml-0.5 rounded-full"
        style={{
          transform: `rotate(${hoursDegrees}deg)`,
          transformOrigin: '50% 90%',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }}
      />
      {/* Minute Hand */}
      <div 
        className="absolute w-1 h-14 bg-orange-500 origin-bottom left-1/2 bottom-1/2 -ml-px rounded-full"
        style={{
          transform: `rotate(${minutesDegrees}deg)`,
          transformOrigin: '50% 90%',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }}
      />
      {/* Second Hand */}
      <div 
        className="absolute w-0.5 h-16 bg-orange-400 origin-bottom left-1/2 bottom-1/2 -ml-px"
        style={{
          transform: `rotate(${secondsDegrees}deg)`,
          transformOrigin: '50% 90%',
        }}
      />
      {/* Center dot */}
      <div className="absolute w-2 h-2 bg-orange-700 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-orange-200 z-10" />
      
    </div>
  );
};

// Timezone data for selected locations
const timeZones = [
  { id: 'thailand', name: 'Bangkok', timeZone: 'Asia/Bangkok' },
  { id: 'bali', name: 'Bali', timeZone: 'Asia/Makassar' },
  { id: 'dubai', name: 'Dubai', timeZone: 'Asia/Dubai' },
  { id: 'vietnam', name: 'Ho Chi Minh', timeZone: 'Asia/Ho_Chi_Minh' },
  { id: 'india', name: 'India', timeZone: 'Asia/Kolkata' },
  { id: 'singapore', name: 'Singapore', timeZone: 'Asia/Singapore' },
];

const WorldClock = () => {

  // Function to get timezone offset string
  const getTimezoneOffset = (timeZone) => {
    try {
      const now = new Date();
      const tzString = now.toLocaleString('en-US', { 
        timeZone, 
        timeZoneName: 'short' 
      });
      const match = tzString.match(/([+-]\d{2})(\d{2})/);
      return match ? `UTC${match[1]}:${match[2]}` : '';
    } catch (e) {
      console.error(`Error getting timezone offset for ${timeZone}:`, e);
      return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center justify-center">
          <FaGlobe className="mr-2 text-orange-500" />
          World Clock
        </h2>
        <div className="mt-2">
          <span className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full inline-block">
            UTC {new Date().getTimezoneOffset() / -60}:00
          </span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-10">
        {timeZones.map(({ id, name, timeZone }) => (
          <div key={id} className="flex flex-col items-center mx-4">
            <div className="relative w-32 h-32 bg-white rounded-full shadow-md border-2 border-orange-300 p-1">
              {/* Clock face */}
              <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
              {/* Clock hands */}
              <div className="relative w-full h-full">
                <AnalogClockHands timeZone={timeZone} />
              </div>
            </div>
            {/* Digital Time */}
            <div className="mt-2 text-sm font-mono text-orange-700 font-medium">
              {new Date().toLocaleTimeString('en-US', {
                timeZone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })}
            </div>
            <h3 className="font-semibold text-orange-800 text-base mt-2">{name}</h3>
            <p className="text-sm text-orange-600">
              {getTimezoneOffset(timeZone)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorldClock;
