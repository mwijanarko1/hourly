import { useState, useEffect, useCallback } from 'react';
import { ChecklistState, ChecklistItem, UserSettings } from '@/types';
import { loadChecklistState, saveChecklistState } from '@/utils/storage';
import { downloadData, uploadData } from '@/utils/dataManagement';
import { getNextHourReset, getLastHourReset, shouldReset } from '@/utils/time';
import { generateId, sanitizeText, validateChecklistItem } from '@/utils/validation';
import { getCurrentHour, getTodayString, updateOrCreateHourlyProgress } from '@/utils/progress';

export function useChecklist() {
  const [state, setState] = useState<ChecklistState>(() => loadChecklistState());
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Save data to local storage
  const saveData = useCallback((newState: ChecklistState) => {
    saveChecklistState(newState);
  }, []);

  // Check for hourly reset and save progress
  useEffect(() => {
    const checkReset = () => {
      if (shouldReset(state.lastReset)) {
        if (state.items.length > 0) {
          const currentHour = getCurrentHour();
          const today = getTodayString();

          setState(prevState => {
            const resetItems = prevState.items.map(item => ({
              ...item,
              completed: false
            }));

            const updatedProgressHistory = updateOrCreateHourlyProgress(
              prevState.progressHistory,
              prevState.items,
              currentHour,
              today
            );

            const newState = {
              items: resetItems,
              lastReset: getLastHourReset(),
              nextReset: getNextHourReset(),
              progressHistory: updatedProgressHistory,
              settings: prevState.settings
            };
            saveData(newState);
            return newState;
          });
        } else {
          setState(prevState => {
            const newState = {
              items: [],
              lastReset: getLastHourReset(),
              nextReset: getNextHourReset(),
              progressHistory: prevState.progressHistory,
              settings: prevState.settings
            };
            saveData(newState);
            return newState;
          });
        }
      }
    };

    checkReset();
    const interval = setInterval(checkReset, 60000);
    return () => clearInterval(interval);
  }, [state.lastReset, state.items, saveData]);

  // Save state whenever it changes
  useEffect(() => {
    saveData(state);
  }, [state, saveData]);

  // Auto-save current hour progress when items change
  useEffect(() => {
    if (state.items.length > 0) {
      const currentHour = getCurrentHour();
      const today = getTodayString();
      const now = new Date();
      const isCurrentHour = now.getHours() === currentHour;

      if (isCurrentHour) {
        setState(prevState => ({
          ...prevState,
          progressHistory: updateOrCreateHourlyProgress(
            prevState.progressHistory,
            prevState.items,
            currentHour,
            today
          )
        }));
      }
    }
  }, [state.items]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => saveData(state);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveData(state);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state, saveData]);

  const addItem = useCallback((text: string) => {
    const sanitizedText = sanitizeText(text);
    const validation = validateChecklistItem(sanitizedText);

    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const newItem: ChecklistItem = {
      id: generateId(),
      text: sanitizedText,
      completed: false,
      createdAt: new Date()
    };

    setState(prevState => ({
      ...prevState,
      items: [...prevState.items, newItem]
    }));
  }, []);

  const updateItem = useCallback((id: string, text: string) => {
    const sanitizedText = sanitizeText(text);
    const validation = validateChecklistItem(sanitizedText);

    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    setState(prevState => ({
      ...prevState,
      items: prevState.items.map(item =>
        item.id === id ? { ...item, text: sanitizedText } : item
      )
    }));
  }, []);

  const toggleItem = useCallback((id: string) => {
    setState(prevState => ({
      ...prevState,
      items: prevState.items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setState(prevState => ({
      ...prevState,
      items: prevState.items.filter(item => item.id !== id)
    }));
  }, []);

  const reorderItems = useCallback((startIndex: number, endIndex: number) => {
    setState(prevState => {
      const newItems = Array.from(prevState.items);
      const [removed] = newItems.splice(startIndex, 1);
      newItems.splice(endIndex, 0, removed);

      return {
        ...prevState,
        items: newItems
      };
    });
  }, []);

  const startEditing = useCallback((id: string, currentText: string) => {
    setIsEditing(id);
    setEditText(currentText);
  }, []);

  const cancelEditing = useCallback(() => {
    setIsEditing(null);
    setEditText('');
  }, []);

  const saveEditing = useCallback(() => {
    if (isEditing && editText.trim()) {
      try {
        updateItem(isEditing, editText);
        cancelEditing();
      } catch (error) {
        console.error('Error updating item:', error);
      }
    }
  }, [isEditing, editText, updateItem, cancelEditing]);

  const completedCount = state.items.filter(item => item.completed).length;
  const totalCount = state.items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const updateSettings = useCallback((newSettings: UserSettings) => {
    setState(prevState => ({
      ...prevState,
      settings: newSettings
    }));
  }, []);

  const toggleHistoricalItem = useCallback((itemId: string, date: string, hour: number) => {
    setState(prevState => {
      const updatedHistory = prevState.progressHistory.map(progress => {
        if (progress.date === date && progress.hour === hour) {
          const updatedItems = progress.items.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );

          const completedItems = updatedItems.filter(item => item.completed).length;
          const totalItems = updatedItems.length;
          const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

          return {
            ...progress,
            items: updatedItems,
            completedItems,
            completionRate
          };
        }
        return progress;
      });

      return {
        ...prevState,
        progressHistory: updatedHistory
      };
    });
  }, []);

  const updateHistoricalItem = useCallback((itemId: string, newText: string, date: string, hour: number) => {
    const sanitizedText = sanitizeText(newText);
    const validation = validateChecklistItem(sanitizedText);

    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    setState(prevState => {
      const updatedHistory = prevState.progressHistory.map(progress => {
        if (progress.date === date && progress.hour === hour) {
          const updatedItems = progress.items.map(item =>
            item.id === itemId ? { ...item, text: sanitizedText } : item
          );

          return {
            ...progress,
            items: updatedItems
          };
        }
        return progress;
      });

      return {
        ...prevState,
        progressHistory: updatedHistory
      };
    });
  }, []);

  const removeHistoricalItem = useCallback((itemId: string, date: string, hour: number) => {
    setState(prevState => {
      const updatedHistory = prevState.progressHistory.map(progress => {
        if (progress.date === date && progress.hour === hour) {
          const updatedItems = progress.items.filter(item => item.id !== itemId);
          const completedItems = updatedItems.filter(item => item.completed).length;
          const totalItems = updatedItems.length;
          const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

          return {
            ...progress,
            items: updatedItems,
            completedItems,
            completionRate
          };
        }
        return progress;
      });

      return {
        ...prevState,
        progressHistory: updatedHistory
      };
    });
  }, []);

  const importData = useCallback((importedData: ChecklistState) => {
    setState(importedData);
  }, []);

  const exportData = useCallback(() => {
    downloadData(state);
  }, [state]);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const importedData = await uploadData(file);
      setState(importedData);
      saveData(importedData); // Save to local storage immediately
    } catch (error) {
      throw error;
    }
  }, [saveData]);

  return {
    items: state.items,
    lastReset: state.lastReset,
    nextReset: state.nextReset,
    progressHistory: state.progressHistory,
    settings: state.settings,
    completedCount,
    totalCount,
    progress,
    isEditing,
    editText,
    setEditText,
    addItem,
    updateItem,
    toggleItem,
    removeItem,
    reorderItems,
    startEditing,
    cancelEditing,
    saveEditing,
    updateSettings,
    toggleHistoricalItem,
    updateHistoricalItem,
    removeHistoricalItem,
    setState,
    importData,
    exportData,
    handleFileUpload
  };
}
