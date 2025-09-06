import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChecklistState, UserSettings } from '@/types';

const COLLECTION_NAME = 'userChecklists';

/**
 * Save user's checklist state to Firestore
 */
export async function saveUserChecklistState(userId: string, state: ChecklistState, options?: { skipTimestamp?: boolean }): Promise<void> {
  try {
    const userDocRef = doc(db, COLLECTION_NAME, userId);

    // Convert dates to ISO strings for Firestore storage
    const stateToSave = {
      ...state,
      lastReset: state.lastReset.toISOString(),
      nextReset: state.nextReset.toISOString(),
      // Use server timestamp for more reliable conflict resolution
      lastModified: options?.skipTimestamp ? (state as ChecklistState & { lastModified?: Date }).lastModified : serverTimestamp(),
      items: state.items.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString()
      })),
      progressHistory: state.progressHistory.map(progress => ({
        ...progress,
        timestamp: progress.timestamp.toISOString(),
        items: progress.items.map(item => ({
          ...item,
          createdAt: item.createdAt.toISOString()
        }))
      }))
    };

    await setDoc(userDocRef, stateToSave, { merge: true });
  } catch (error) {
    console.error('Error saving checklist state to Firestore:', error);
    throw error;
  }
}

/**
 * Load user's checklist state from Firestore
 */
export async function loadUserChecklistState(userId: string): Promise<ChecklistState | null> {
  try {
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    
    // Convert ISO strings back to Date objects
    return {
      items: data.items.map((item: { id: string; text: string; completed: boolean; createdAt: string }) => ({
        ...item,
        createdAt: new Date(item.createdAt)
      })),
      lastReset: new Date(data.lastReset),
      nextReset: new Date(data.nextReset),
      progressHistory: data.progressHistory.map((progress: { 
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
      })),
      settings: data.settings
    };
  } catch (error) {
    console.error('Error loading checklist state from Firestore:', error);
    throw error;
  }
}

/**
 * Check if user has existing data in Firestore
 */
export async function hasUserData(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(userDocRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking if user has data:', error);
    return false;
  }
}

/**
 * Migrate local storage data to Firestore
 */
export async function migrateLocalDataToFirestore(userId: string, localData: ChecklistState): Promise<void> {
  try {
    await saveUserChecklistState(userId, localData);
  } catch (error) {
    console.error('Error migrating local data to Firestore:', error);
    throw error;
  }
}

/**
 * Update user settings in Firestore
 */
export async function updateUserSettings(userId: string, settings: UserSettings): Promise<void> {
  try {
    const userDocRef = doc(db, COLLECTION_NAME, userId);
    await updateDoc(userDocRef, { settings });
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}

/**
 * Set up real-time listener for user's checklist data
 */
export function subscribeToUserChecklist(
  userId: string, 
  onDataChange: (data: ChecklistState | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const userDocRef = doc(db, COLLECTION_NAME, userId);

  return onSnapshot(
    userDocRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        onDataChange(null);
        return;
      }

      const data = docSnap.data();

      try {
        // Convert ISO strings back to Date objects
        const checklistState: ChecklistState = {
          items: data.items.map((item: { id: string; text: string; completed: boolean; createdAt: string }) => ({
            ...item,
            createdAt: new Date(item.createdAt)
          })),
          lastReset: new Date(data.lastReset),
          nextReset: new Date(data.nextReset),
          progressHistory: data.progressHistory.map((progress: {
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
          })),
          settings: data.settings
        };

        // Pass along the server timestamp for conflict resolution
        const stateWithTimestamp = {
          ...checklistState,
          lastModified: data.lastModified instanceof Timestamp ? data.lastModified.toDate() : new Date(data.lastModified || 0)
        };

        onDataChange(stateWithTimestamp);
      } catch (error) {
        console.error('❌ Error parsing real-time data:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    },
    (error) => {
      console.error('❌ Real-time listener error:', error);
      if (onError) {
        onError(error);
      }
    }
  );
}
