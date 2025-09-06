import { ChecklistState } from '@/types';

/**
 * Download user's checklist data as a JSON file
 */
export function downloadData(data: ChecklistState): void {
  try {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `hourly-checklist-backup-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  } catch (error) {
    console.error('Error downloading data:', error);
    throw error;
  }
}

/**
 * Upload checklist data from a JSON file
 */
export function uploadData(file: File): Promise<ChecklistState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: ChecklistState = JSON.parse(content);

        // Validate the data structure
        if (!data.items || !Array.isArray(data.items)) {
          throw new Error('Invalid data format: missing items array');
        }

        if (!data.lastReset || !data.nextReset) {
          throw new Error('Invalid data format: missing reset dates');
        }

        if (!data.progressHistory || !Array.isArray(data.progressHistory)) {
          throw new Error('Invalid data format: missing progress history');
        }

        if (!data.settings) {
          throw new Error('Invalid data format: missing settings');
        }

        // Convert date strings back to Date objects
        const processedData: ChecklistState = {
          ...data,
          lastReset: new Date(data.lastReset),
          nextReset: new Date(data.nextReset),
          items: data.items.map(item => ({
            ...item,
            createdAt: new Date(item.createdAt)
          })),
          progressHistory: data.progressHistory.map(progress => ({
            ...progress,
            timestamp: new Date(progress.timestamp),
            items: progress.items.map(item => ({
              ...item,
              createdAt: new Date(item.createdAt)
            }))
          }))
        };

        resolve(processedData);
      } catch (error) {
        console.error('Error parsing uploaded data:', error);
        reject(new Error('Invalid file format. Please upload a valid Hourly Checklist backup file.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
