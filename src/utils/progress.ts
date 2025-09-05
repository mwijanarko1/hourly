import { HourlyProgress, DailyStats, ChecklistItem } from '@/types';

/**
 * Create an hourly progress record
 */
export function createHourlyProgress(
  items: ChecklistItem[],
  hour: number,
  date: string
): HourlyProgress {
  const completedItems = items.filter(item => item.completed).length;
  const totalItems = items.length;
  const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return {
    hour,
    date,
    completedItems,
    totalItems,
    completionRate,
    items: [...items], // Create a copy
    timestamp: new Date()
  };
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current hour (0-23)
 */
export function getCurrentHour(): number {
  return new Date().getHours();
}

/**
 * Calculate daily statistics
 */
export function calculateDailyStats(progressHistory: HourlyProgress[], date?: string): DailyStats {
  const targetDate = date || getTodayString();
  const todayProgress = progressHistory.filter(progress => progress.date === targetDate);
  
  if (todayProgress.length === 0) {
    return {
      date: targetDate,
      totalHours: 0,
      completedHours: 0,
      averageCompletionRate: 0,
      totalItemsCompleted: 0,
      bestHour: 0,
      progressHistory: []
    };
  }

  const totalHours = todayProgress.length;
  const completedHours = todayProgress.filter(progress => progress.completionRate === 100).length;
  const averageCompletionRate = todayProgress.reduce((sum, progress) => sum + progress.completionRate, 0) / totalHours;
  const totalItemsCompleted = todayProgress.reduce((sum, progress) => sum + progress.completedItems, 0);
  const bestHour = todayProgress.reduce((best, progress) => 
    progress.completionRate > best.completionRate ? progress : best
  ).hour;

  return {
    date: targetDate,
    totalHours,
    completedHours,
    averageCompletionRate,
    totalItemsCompleted,
    bestHour,
    progressHistory: todayProgress
  };
}

/**
 * Get progress for a specific hour today
 */
export function getHourlyProgress(progressHistory: HourlyProgress[], hour: number, date?: string): HourlyProgress | null {
  const targetDate = date || getTodayString();
  return progressHistory.find(progress => 
    progress.hour === hour && progress.date === targetDate
  ) || null;
}

/**
 * Get the last 7 days of progress
 */
export function getWeeklyProgress(progressHistory: HourlyProgress[]): DailyStats[] {
  const weeklyStats: DailyStats[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    weeklyStats.push(calculateDailyStats(progressHistory, dateString));
  }
  
  return weeklyStats;
}

/**
 * Update or create hourly progress entry
 * If an entry for the same hour/date exists, update it; otherwise create a new one
 */
export function updateOrCreateHourlyProgress(
  progressHistory: HourlyProgress[],
  items: ChecklistItem[],
  hour: number,
  date: string
): HourlyProgress[] {
  const existingIndex = progressHistory.findIndex(
    progress => progress.hour === hour && progress.date === date
  );
  
  const newProgress = createHourlyProgress(items, hour, date);
  
  if (existingIndex >= 0) {
    // Update existing entry
    const updatedHistory = [...progressHistory];
    updatedHistory[existingIndex] = newProgress;
    return updatedHistory;
  } else {
    // Create new entry
    return [...progressHistory, newProgress];
  }
}

/**
 * Clean up old progress history (keep last 30 days)
 */
export function cleanupOldProgress(progressHistory: HourlyProgress[]): HourlyProgress[] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
  
  return progressHistory.filter(progress => progress.date >= cutoffDate);
}

/**
 * Get progress streak (consecutive days with at least one completed hour)
 */
export function getProgressStreak(progressHistory: HourlyProgress[]): number {
  const dailyStats = getWeeklyProgress(progressHistory);
  let streak = 0;
  
  // Check from today backwards
  for (let i = dailyStats.length - 1; i >= 0; i--) {
    if (dailyStats[i].completedHours > 0) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}
