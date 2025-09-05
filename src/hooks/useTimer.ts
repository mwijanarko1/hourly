import { useState, useEffect } from 'react';
import { TimeRemaining } from '@/types';
import { getTimeRemaining, formatTimeRemaining } from '@/utils/time';

export function useTimer(targetDate: Date) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    getTimeRemaining(targetDate)
  );

  useEffect(() => {
    const updateTimer = () => {
      setTimeRemaining(getTimeRemaining(targetDate));
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const formattedTime = formatTimeRemaining(timeRemaining);
  const isExpired = timeRemaining.hours === 0 && timeRemaining.minutes === 0 && timeRemaining.seconds === 0;

  return {
    timeRemaining,
    formattedTime,
    isExpired
  };
}
