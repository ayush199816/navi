import React, { useEffect, useState } from 'react';

const AnalogClock = ({ timeZone, city }) => {
  const [time, setTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const getTimeInTimeZone = (tz) => {
    try {
      const now = new Date();
      
      // Get time parts using Intl.DateTimeFormat for better timezone handling
      const timeFormat = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour12: true,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      });
      
      const parts = timeFormat.formatToParts(now);
      let hours, minutes, seconds, period;
      
      parts.forEach(part => {
        switch(part.type) {
          case 'hour':
            hours = parseInt(part.value, 10);
            break;
          case 'minute':
            minutes = parseInt(part.value, 10);
            break;
          case 'second':
            seconds = parseInt(part.value, 10);
            break;
          case 'dayPeriod':
            period = part.value;
            break;
        }
      });
      
      // For analog clock, we need to handle 12-hour format properly
      // 12 AM = 0, 1 AM = 1, ..., 11 AM = 11, 12 PM = 12, 1 PM = 1, ..., 11 PM = 11
      if (period === 'PM' && hours !== 12) {
        hours += 12; // Convert to 24-hour for calculation
        hours = hours % 12; // Then back to 12-hour (1-11)
      } else if (period === 'AM' && hours === 12) {
        hours = 0; // 12 AM is 0 in 24-hour format
      }
      
      // For debugging
      console.log(`[${tz}] Time: ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`);
      
      return {
        hours,
        minutes,
        seconds,
        isPM: period === 'PM'
      };
    } catch (error) {
      console.error('Error getting time:', error);
      // Return current local time as fallback
      const now = new Date();
      const hours = now.getHours() % 12 || 12;
      return {
        hours,
        minutes: now.getMinutes(),
        seconds: now.getSeconds()
      };
    }
  };

  useEffect(() => {
    let lastLoggedTime = '';
    
    const updateTime = () => {
      try {
        const { hours, minutes, seconds } = getTimeInTimeZone(timeZone);
        
        // Only update and log if time has changed
        const currentTimeStr = `${hours}:${minutes}:${seconds}`;
        if (currentTimeStr !== lastLoggedTime) {
          lastLoggedTime = currentTimeStr;
          console.log(`[${city}] Current time: ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          setTime({ hours, minutes, seconds });
        }
      } catch (error) {
        console.error(`Error updating time for ${timeZone}:`, error);
      }
    };

    // Update immediately and then every second
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [timeZone]);

  // Log the current time for debugging
  console.log('Current time:', {
    hours: time.hours,
    minutes: time.minutes,
    seconds: time.seconds
  });

  // Calculate rotation degrees for clock hands
  const secondsDegrees = ((time.seconds * 6) + 90) % 360; // 360/60 = 6 degrees per second
  const minutesDegrees = ((time.minutes * 6) + (time.seconds * 0.1) + 90) % 360; // 360/60 = 6 degrees per minute + smooth movement
  // For 12-hour format: (hour % 12) * 30 + (minutes * 0.5) + 90
  // The +90 is to account for the 12 o'clock position being at 90 degrees (top center)
  const hoursDegrees = ((time.hours * 30) + (time.minutes * 0.5) + 90) % 360;

  // Log the calculated degrees

  // Format time for display using the same timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  const displayTime = formatter.format(new Date());

  return (
    <div className="flex flex-col items-center p-1">
      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-blue-100 shadow-md bg-white">
        {/* Clock face - simplified with just 12, 3, 6, 9 markers */}
        {[0, 3, 6, 9].map((i) => (
          <div
            key={i}
            className="absolute w-0.5 h-1.5 bg-blue-300 origin-bottom left-1/2 bottom-1/2"
            style={{
              transform: `translateX(-50%) rotate(${i * 30}deg)`,
              transformOrigin: '50% 100%',
              marginBottom: 'calc(100% - 4px)'
            }}
          />
        ))}
        
        {/* Center dot */}
        <div className="absolute w-1.5 h-1.5 bg-blue-500 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
        
        {/* Hour hand */}
        <div 
          className="absolute w-1 h-5 md:h-6 bg-blue-700 rounded-full origin-bottom left-1/2 bottom-1/2 transform -translate-x-1/2 z-5"
          style={{ transform: `translateX(-50%) rotate(${hoursDegrees}deg)` }}
        />
        
        {/* Minute hand */}
        <div 
          className="absolute w-0.5 h-7 md:h-8 bg-blue-600 rounded-full origin-bottom left-1/2 bottom-1/2 transform -translate-x-1/2 z-4"
          style={{ transform: `translateX(-50%) rotate(${minutesDegrees}deg)` }}
        />
        
        {/* Second hand - thinner and shorter */}
        <div 
          className="absolute w-[1px] h-8 md:h-9 bg-blue-500 origin-bottom left-1/2 bottom-1/2 transform -translate-x-1/2 z-3"
          style={{ transform: `translateX(-50%) rotate(${secondsDegrees}deg)` }}
        />
      </div>
      
      <div className="mt-2 text-sm font-medium text-blue-700">{city}</div>
      <div className="text-xs text-blue-500 font-medium">
        {displayTime}
      </div>
    </div>
  );
};

export default AnalogClock;
