export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export interface HourlyProgress {
  hour: number; // 0-23
  date: string; // YYYY-MM-DD format
  completedItems: number;
  totalItems: number;
  completionRate: number;
  items: ChecklistItem[];
  timestamp: Date;
}

export interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface DailyStats {
  date: string;
  totalHours: number;
  completedHours: number;
  averageCompletionRate: number;
  totalItemsCompleted: number;
  bestHour: number;
  progressHistory: HourlyProgress[];
}

export interface UserSettings {
  activeHours: number[]; // Array of hours (0-23) to track
  timezone: string;
  notifications: boolean;
}

export interface ChecklistState {
  items: ChecklistItem[];
  lastReset: Date;
  nextReset: Date;
  progressHistory: HourlyProgress[];
  settings: UserSettings;
}
