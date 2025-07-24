import React, { useEffect, useState } from 'react';

const AnalogClock = ({ timeZone, city }) => {
  const [time, setTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Using toLocaleTimeString to get time in the specified timezone
      const timeString = now.toLocaleTimeString('en-US', {
        timeZone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      // Parse the time string to get hours, minutes, seconds
      const [hours, minutes, seconds] = timeString.split(':').map(Number);
      
      setTime({
        hours: hours % 12,
        minutes,
        seconds
      });
    };

    // Update immediately and then every second
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [timeZone]);

  // Calculate rotation degrees for clock hands
  const secondsDegrees = ((time.seconds / 60) * 360) + 90;
  const minutesDegrees = ((time.minutes / 60) * 360) + ((time.seconds / 60) * 6) + 90;
  const hoursDegrees = ((time.hours / 12) * 360) + ((time.minutes / 60) * 30) + 90;

  // Format time for display
  const displayTime = new Date().toLocaleTimeString('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="flex flex-col items-center p-1">
      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-white/50 shadow-lg">
        {/* Clock face - simplified with just 12, 3, 6, 9 markers */}
        {[0, 3, 6, 9].map((i) => (
          <div
            key={i}
            className="absolute w-0.5 h-1.5 bg-white/80 origin-bottom left-1/2 bottom-1/2"
            style={{
              transform: `translateX(-50%) rotate(${i * 30}deg)`,
              transformOrigin: '50% 100%',
              marginBottom: 'calc(100% - 4px)'
            }}
          />
        ))}
        
        {/* Center dot */}
        <div className="absolute w-1.5 h-1.5 bg-white rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
        
        {/* Hour hand */}
        <div 
          className="absolute w-1 h-5 md:h-6 bg-white rounded-full origin-bottom left-1/2 bottom-1/2 transform -translate-x-1/2 z-5"
          style={{ transform: `translateX(-50%) rotate(${hoursDegrees}deg)` }}
        />
        
        {/* Minute hand */}
        <div 
          className="absolute w-0.5 h-7 md:h-8 bg-white/90 rounded-full origin-bottom left-1/2 bottom-1/2 transform -translate-x-1/2 z-4"
          style={{ transform: `translateX(-50%) rotate(${minutesDegrees}deg)` }}
        />
        
        {/* Second hand - thinner and shorter */}
        <div 
          className="absolute w-[1px] h-8 md:h-9 bg-blue-300 origin-bottom left-1/2 bottom-1/2 transform -translate-x-1/2 z-3"
          style={{ transform: `translateX(-50%) rotate(${secondsDegrees}deg)` }}
        />
      </div>
      
      <div className="mt-2 text-sm font-medium text-white">{city}</div>
      <div className="text-xs text-blue-100 font-medium">
        {displayTime}
      </div>
    </div>
  );
};

export default AnalogClock;
