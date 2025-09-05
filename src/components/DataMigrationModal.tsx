'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { migrateLocalDataToFirestore } from '@/utils/firebaseStorage';
import { loadChecklistState } from '@/utils/storage';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface DataMigrationModalProps {
  isOpen: boolean;
  onMigrationComplete: () => void;
}

export function DataMigrationModal({ isOpen, onMigrationComplete }: DataMigrationModalProps) {
  const { user } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleMigrate = async () => {
    try {
      setIsMigrating(true);
      setError(null);

      // Load local data
      const localData = loadChecklistState();
      
      // Check if there's actually data to migrate
      if (localData.items.length === 0 && localData.progressHistory.length === 0) {
        onMigrationComplete();
        return;
      }

      // Migrate to Firestore
      await migrateLocalDataToFirestore(user.uid, localData);
      
      onMigrationComplete();
    } catch (err) {
      console.error('Migration error:', err);
      setError('Failed to migrate data. Please try again.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleStartFresh = () => {
    onMigrationComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome to your account!</h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          We found some data saved locally on this device. Would you like to migrate it to your account so you can access it from other devices?
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={handleMigrate}
            disabled={isMigrating}
            className="w-full"
          >
            {isMigrating ? 'Migrating...' : 'Yes, migrate my data'}
          </Button>
          
          <Button 
            onClick={handleStartFresh}
            variant="outline"
            className="w-full"
            disabled={isMigrating}
          >
            No, start fresh
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          You can always sign out and sign back in to change this choice.
        </p>
      </Card>
    </div>
  );
}
