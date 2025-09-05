import { ChecklistState, UserSettings } from '@/types';

const STORAGE_KEY = 'hourly-checklist';

/**
 * Attempt to recover data from backup or fallback storage
 */
export function attemptDataRecovery(): ChecklistState | null {
  try {
    if (typeof window === 'undefined') return null;

    // Try to find the most recent backup
    const keys = Object.keys(localStorage);
    const backupKeys = keys
      .filter(key => key.startsWith(`${STORAGE_KEY}_backup_`))
      .sort((a, b) => {
        const timestampA = parseInt(a.split('_').pop() || '0');
        const timestampB = parseInt(b.split('_').pop() || '0');
        return timestampB - timestampA; // Sort newest first
      });

    // Try to load from the most recent backup
    for (const backupKey of backupKeys) {
      try {
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          const parsed = JSON.parse(backupData);
          return {
            items: parsed.items.map((item: { id: string; text: string; completed: boolean; createdAt: string }) => ({
              ...item,
              createdAt: new Date(item.createdAt)
            })),
            lastReset: new Date(parsed.lastReset),
            nextReset: new Date(parsed.nextReset),
            progressHistory: parsed.progressHistory ? parsed.progressHistory.map((progress: { 
              hour: number; 
              date: string; 
              completedItems: number; 
              totalItems: number; 
              completionRate: number; 
              items: { id: string; text: string; completed: boolean; createdAt: string }[]; 
              timestamp: string; 
            }) => ({
              ...progress,
              timestamp: new Date(progress.timestamp),
              items: progress.items.map((item: { id: string; text: string; completed: boolean; createdAt: string }) => ({
                ...item,
                createdAt: new Date(item.createdAt)
              }))
            })) : [],
            settings: parsed.settings || getDefaultSettings()
          };
        }
      } catch (error) {
        console.warn(`Failed to load backup ${backupKey}:`, error);
        continue;
      }
    }

    // Try fallback storage
    const fallbackKey = `${STORAGE_KEY}_fallback`;
    const fallbackData = localStorage.getItem(fallbackKey);
    if (fallbackData) {
      const parsed = JSON.parse(fallbackData);
      return {
        items: parsed.items.map((item: { id: string; text: string; completed: boolean; createdAt: string }) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })),
        lastReset: new Date(parsed.lastReset),
        nextReset: new Date(parsed.nextReset),
        progressHistory: parsed.progressHistory ? parsed.progressHistory.map((progress: { 
          hour: number; 
          date: string; 
          completedItems: number; 
          totalItems: number; 
          completionRate: number; 
          items: { id: string; text: string; completed: boolean; createdAt: string }[]; 
          timestamp: string; 
        }) => ({
          ...progress,
          timestamp: new Date(progress.timestamp),
          items: progress.items.map((item: { id: string; text: string; completed: boolean; createdAt: string }) => ({
            ...item,
            createdAt: new Date(item.createdAt)
          }))
        })) : [],
        settings: parsed.settings || getDefaultSettings()
      };
    }

    return null;
  } catch (error) {
    console.error('Error during data recovery:', error);
    return null;
  }
}

function getDefaultSettings(): UserSettings {
  return {
    activeHours: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22], // 7 AM to 10 PM
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: false
  };
}

/**
 * Check if there are any backup files available
 */
export function hasBackupData(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    const keys = Object.keys(localStorage);
    return keys.some(key => 
      key.startsWith(`${STORAGE_KEY}_backup_`) || 
      key === `${STORAGE_KEY}_fallback`
    );
  } catch {
    return false;
  }
}

/**
 * Clear all stored data (including backups)
 */
export function clearAllStoredData(): void {
  try {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEY)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing stored data:', error);
  }
}
