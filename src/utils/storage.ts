import { ChecklistState, UserSettings } from '@/types';
import { getLastHourReset, getNextHourReset } from './time';
import { attemptDataRecovery } from './recovery';
import { cleanupOldProgress } from './progress';

const STORAGE_KEY = 'hourly-checklist';

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load checklist state from localStorage
 */
export function loadChecklistState(): ChecklistState {
  // Return default state if localStorage is not available (SSR)
  if (!isLocalStorageAvailable()) {
    return getDefaultState();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultState();
    }
    
    const parsed = JSON.parse(stored);
    
    // Validate the parsed data structure
    if (!parsed || typeof parsed !== 'object') {
      console.warn('Invalid stored data, using default state');
      return getDefaultState();
    }

    // Ensure items is an array
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    
    // Handle progress history
    const progressHistory = Array.isArray(parsed.progressHistory) 
      ? parsed.progressHistory.map((progress: { 
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
        }))
      : [];

    return {
      items: items.map((item: { id: string; text: string; completed: boolean; createdAt: string }) => ({
        id: item.id || '',
        text: item.text || '',
        completed: Boolean(item.completed),
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
      })),
      lastReset: parsed.lastReset ? new Date(parsed.lastReset) : getLastHourReset(),
      nextReset: parsed.nextReset ? new Date(parsed.nextReset) : getNextHourReset(),
      progressHistory: cleanupOldProgress(progressHistory),
      settings: parsed.settings || getDefaultSettings()
    };
  } catch (error) {
    console.error('Error loading checklist state:', error);
    
    // Attempt to recover from backup data
    const recoveredData = attemptDataRecovery();
    if (recoveredData) {
      return recoveredData;
    }
    
    return getDefaultState();
  }
}

/**
 * Save checklist state to localStorage
 */
export function saveChecklistState(state: ChecklistState): void {
  // Don't save if localStorage is not available
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    // Create a clean copy of the state to avoid circular references
    const stateToSave = {
      items: state.items.map(item => ({
        id: item.id,
        text: item.text,
        completed: item.completed,
        createdAt: item.createdAt.toISOString()
      })),
      lastReset: state.lastReset.toISOString(),
      nextReset: state.nextReset.toISOString(),
      progressHistory: state.progressHistory.map(progress => ({
        ...progress,
        timestamp: progress.timestamp.toISOString(),
        items: progress.items.map(item => ({
          ...item,
          createdAt: item.createdAt.toISOString()
        }))
      })),
      settings: state.settings
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    
    // Also save a backup with timestamp
    const backupKey = `${STORAGE_KEY}_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(stateToSave));
    
    // Clean up old backups (keep only last 5)
    cleanupOldBackups();
  } catch (error) {
    console.error('Error saving checklist state:', error);
    
    // Try to save to a different key if the main one fails
    try {
      const fallbackKey = `${STORAGE_KEY}_fallback`;
      localStorage.setItem(fallbackKey, JSON.stringify(state));
    } catch (fallbackError) {
      console.error('Error saving to fallback storage:', fallbackError);
    }
  }
}

/**
 * Clean up old backup entries (keep only last 5)
 */
function cleanupOldBackups(): void {
  try {
    const keys = Object.keys(localStorage);
    const backupKeys = keys
      .filter(key => key.startsWith(`${STORAGE_KEY}_backup_`))
      .sort((a, b) => {
        const timestampA = parseInt(a.split('_').pop() || '0');
        const timestampB = parseInt(b.split('_').pop() || '0');
        return timestampB - timestampA; // Sort newest first
      });

    // Remove old backups, keeping only the 5 most recent
    backupKeys.slice(5).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
}

/**
 * Get default checklist state
 */
function getDefaultState(): ChecklistState {
  return {
    items: [],
    lastReset: getLastHourReset(),
    nextReset: getNextHourReset(),
    progressHistory: [],
    settings: getDefaultSettings()
  };
}

function getDefaultSettings(): UserSettings {
  return {
    activeHours: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22], // 7 AM to 10 PM
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: false
  };
}
