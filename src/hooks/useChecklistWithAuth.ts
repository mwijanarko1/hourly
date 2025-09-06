import { useState, useEffect, useCallback } from 'react';
import { ChecklistState, ChecklistItem, UserSettings } from '@/types';
import { loadChecklistState, saveChecklistState } from '@/utils/storage';
import { loadUserChecklistState, saveUserChecklistState, hasUserData, subscribeToUserChecklist } from '@/utils/firebaseStorage';
import { getNextHourReset, getLastHourReset, shouldReset } from '@/utils/time';
import { generateId, sanitizeText, validateChecklistItem } from '@/utils/validation';
import { getCurrentHour, getTodayString, updateOrCreateHourlyProgress } from '@/utils/progress';
import { useAuth } from '@/contexts/AuthContext';

export function useChecklistWithAuth() {
  const { user, isFirstTimeUser, hasCompletedMigration, setHasCompletedMigration } = useAuth();
  const [state, setState] = useState<ChecklistState>(() => loadChecklistState());
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasInitializedFromFirestore, setHasInitializedFromFirestore] = useState(false);
  const [lastLocalSaveTime, setLastLocalSaveTime] = useState<Date | null>(null);
  const [isReceivingUpdate, setIsReceivingUpdate] = useState(false);

  // Set up real-time sync when user authentication state changes
  useEffect(() => {
    // Reset initialization flag when user changes
    if (user) {
      setHasInitializedFromFirestore(false);
    }

    let unsubscribe: (() => void) | null = null;

    const setupSync = async () => {
      if (!user) {
        // User is not authenticated, use local storage
        const localData = loadChecklistState();
        setState(localData);
        setLastSyncTime(null);
        setHasInitializedFromFirestore(true);
        return;
      }

      setIsLoading(true);
      try {
        // Check if user has Firestore data first
        const hasFirestoreData = await hasUserData(user.uid);
        
        if (hasFirestoreData) {
          // Set up real-time listener for syncing data from other devices
          unsubscribe = subscribeToUserChecklist(
            user.uid,
            (firestoreData) => {
              if (firestoreData) {
                const firestoreDataWithTimestamp = firestoreData as ChecklistState & { lastModified?: Date };
                const firestoreLastModified = firestoreDataWithTimestamp.lastModified || new Date(0);
                const localLastSave = lastLocalSaveTime || new Date(0);

                console.log('📡 Received Firestore update:', {
                  firestoreLastModified: firestoreLastModified.toISOString(),
                  localLastSave: localLastSave.toISOString(),
                  shouldUpdate: firestoreLastModified > localLastSave,
                  isReceivingUpdate
                });

                // Improved conflict resolution:
                // 1. Always update if we haven't initialized yet
                // 2. Update if Firestore data is newer than our last save
                // 3. Don't update if we're currently sending an update (prevents loops)
                const shouldUpdate = !hasInitializedFromFirestore || 
                  (firestoreLastModified > localLastSave && !isReceivingUpdate);

                if (shouldUpdate) {
                  console.log('✅ Updating local state from Firestore');
                  setIsReceivingUpdate(true);
                  
                  // Remove timestamp before setting state (it's not part of ChecklistState)
                  const { lastModified, ...cleanState } = firestoreDataWithTimestamp;
                  setState(cleanState);
                  saveChecklistState(cleanState);
                  setLastSyncTime(new Date());
                  
                  // Reset flag after a short delay to allow for state updates
                  setTimeout(() => setIsReceivingUpdate(false), 100);
                } else {
                  console.log('⏭️ Skipping Firestore update (not newer or currently sending)');
                  setLastSyncTime(new Date());
                }

                setIsSyncing(false);
                setHasInitializedFromFirestore(true);
              } else {
                console.log('📭 No Firestore data found');
                setHasInitializedFromFirestore(true);
              }
            },
            (error) => {
              console.error('❌ Real-time sync error:', error);
              setIsSyncing(false);
            }
          );
        } else {
          // User has no Firestore data, check for local data
          const localData = loadChecklistState();
          const hasLocalData = localData.items.length > 0 || localData.progressHistory.length > 0;

          if (hasLocalData && isFirstTimeUser && !hasCompletedMigration) {
            // Show migration modal only for first-time users with local data who haven't completed migration
            setShowMigrationModal(true);
          } else {
            // No data anywhere, or user has already completed migration, start fresh
            setState(localData);
            
            // Still set up a listener in case data gets added from another device
            unsubscribe = subscribeToUserChecklist(
              user.uid,
              (firestoreData) => {
                if (firestoreData) {
                  console.log('📡 Received initial data from another device');
                  const firestoreDataWithTimestamp = firestoreData as ChecklistState & { lastModified?: Date };
                  const { lastModified, ...cleanState } = firestoreDataWithTimestamp;
                  setState(cleanState);
                  saveChecklistState(cleanState);
                  setLastSyncTime(new Date());
                }
              },
              (error) => {
                console.error('❌ Real-time sync error:', error);
              }
            );
          }
          setHasInitializedFromFirestore(true);
        }
      } catch (error) {
        console.error('❌ Error setting up sync:', error);
        // Fallback to local storage
        const localData = loadChecklistState();
        setState(localData);
        setHasInitializedFromFirestore(true);
      } finally {
        setIsLoading(false);
      }
    };

    setupSync();

    // Cleanup listener when user changes or component unmounts
    return () => {
      if (unsubscribe) {
        console.log('🔍 Cleaning up real-time listener');
        unsubscribe();
      }
    };
  }, [user, isFirstTimeUser, hasCompletedMigration]);

  // Save data to appropriate storage
  const saveData = useCallback(async (newState: ChecklistState) => {
    // Don't save if we're currently receiving an update from Firestore
    if (isReceivingUpdate) {
      console.log('🚫 Skipping save - currently receiving Firestore update');
      return;
    }

    // Always save to local storage first for immediate persistence
    saveChecklistState(newState);

    if (user) {
      // User is authenticated, also save to Firestore
      setIsSyncing(true);
      try {
        console.log('💾 Saving to Firestore:', { itemCount: newState.items.length, progressCount: newState.progressHistory.length });
        await saveUserChecklistState(user.uid, newState);
        const saveTime = new Date();
        setLastSyncTime(saveTime);
        setLastLocalSaveTime(saveTime);
        console.log('✅ Successfully saved to Firestore');
      } catch (error) {
        console.error('❌ Error saving to Firestore:', error);
        // Local storage save already happened above, so we still have persistence
      } finally {
        setIsSyncing(false);
      }
    }
  }, [user, isReceivingUpdate]);

  // Check for hourly reset and save progress
  useEffect(() => {
    const checkReset = () => {
      if (shouldReset(state.lastReset)) {
        // Save current progress before resetting
        if (state.items.length > 0) {
          const currentHour = getCurrentHour();
          const today = getTodayString();
          
          setState(prevState => {
            // Reset only the completion status, keep all items
            const resetItems = prevState.items.map(item => ({
              ...item,
              completed: false
            }));
            
            // Update or create progress entry for the current hour
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

    // Check immediately
    checkReset();

    // Check every minute
    const interval = setInterval(checkReset, 60000);
    return () => clearInterval(interval);
  }, [state.lastReset, state.items, saveData]);

  // Save state whenever it changes, but only after we've initialized from Firestore
  useEffect(() => {
    // Don't save if we haven't initialized from Firestore yet
    if (!hasInitializedFromFirestore) {
      console.log('⏸️ Skipping save - not initialized from Firestore yet');
      return;
    }

    // Don't save if we're currently receiving an update
    if (isReceivingUpdate) {
      console.log('⏸️ Skipping save - currently receiving update');
      return;
    }

    // Improved empty state handling: only skip if user is authenticated AND we have no local data at all
    // This allows devices with data to sync to empty devices
    const hasNoData = state.items.length === 0 && state.progressHistory.length === 0;
    if (user && hasNoData && lastLocalSaveTime === null) {
      console.log('⏸️ Skipping save - authenticated user with no data and no previous saves');
      return;
    }

    console.log('💾 Auto-saving state change');
    saveData(state);
  }, [state, hasInitializedFromFirestore, user, isReceivingUpdate, lastLocalSaveTime]); // Include dependencies

  // Auto-save current hour progress when items change
  useEffect(() => {
    if (state.items.length > 0) {
      const currentHour = getCurrentHour();
      const today = getTodayString();
      
      // Only auto-save if we're in the current hour (not viewing historical data)
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

  // Additional safety: save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveData(state);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveData(state);
      }
    };

    // Save when page is about to unload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Save when tab becomes hidden (user switches tabs)
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

  // Function to toggle historical item completion
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

  // Function to update historical item text
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

  // Function to remove historical item
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

  // Handle migration completion
  const handleMigrationComplete = useCallback(() => {
    setShowMigrationModal(false);
    // Mark migration as completed for this user
    if (user) {
      const migrationKey = `migration_completed_${user.uid}`;
      localStorage.setItem(migrationKey, 'true');
      setHasCompletedMigration(true);
    }
  }, [user, setHasCompletedMigration]);

  // Manual sync function for user-triggered data sync
  const syncDataFromFirestore = useCallback(async () => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      const hasFirestoreData = await hasUserData(user.uid);
      if (hasFirestoreData) {
        const firestoreData = await loadUserChecklistState(user.uid);
        if (firestoreData) {
          console.log('🔄 Manually synced data from Firestore');
          setState(firestoreData);
          saveChecklistState(firestoreData);
          setLastSyncTime(new Date());
        }
      }
    } catch (error) {
      console.error('❌ Error syncing data:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user]);


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
    isLoading,
    showMigrationModal,
    handleMigrationComplete,
    syncDataFromFirestore,
    lastSyncTime,
    isSyncing
  };
}
