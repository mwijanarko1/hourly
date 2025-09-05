import { TimeRemaining } from '@/types';

/**
 * Get the next hour reset time
 */
export function getNextHourReset(): Date {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  return nextHour;
}

/**
 * Get the last hour reset time
 */
export function getLastHourReset(): Date {
  const now = new Date();
  const lastHour = new Date(now);
  lastHour.setMinutes(0, 0, 0);
  return lastHour;
}

/**
 * Calculate time remaining until next reset
 */
export function getTimeRemaining(targetDate: Date): TimeRemaining {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
}

/**
 * Format time remaining as string
 */
export function formatTimeRemaining(time: TimeRemaining): string {
  const { hours, minutes, seconds } = time;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Check if it's time for a reset
 */
export function shouldReset(lastReset: Date): boolean {
  const now = new Date();
  const hourDiff = now.getHours() - lastReset.getHours();
  const dayDiff = now.getDate() - lastReset.getDate();
  
  return hourDiff > 0 || dayDiff > 0;
}
