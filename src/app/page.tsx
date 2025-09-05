'use client';

import React, { useState } from 'react';
import Checklist from "@/components/Checklist";
import { DataMigrationModal } from "@/components/DataMigrationModal";
import { Profile } from "@/components/Profile";
import Settings from "@/components/Settings";
import { useChecklistWithAuth } from "@/hooks/useChecklistWithAuth";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ThemeToggle";
import SaveStatus from "@/components/SaveStatus";
import SyncStatus from "@/components/SyncStatus";

export default function Home() {
  const { 
    showMigrationModal, 
    handleMigrationComplete, 
    settings, 
    updateSettings,
    lastSyncTime,
    isSyncing,
    syncDataFromFirestore
  } = useChecklistWithAuth();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Hourly Checklist
              </h1>
              <SaveStatus />
              <SyncStatus 
                lastSyncTime={lastSyncTime}
                isSyncing={isSyncing}
                onManualSync={syncDataFromFirestore}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="!p-2 !min-w-0"
                aria-label="Open settings"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 00-1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Button>
              <ThemeToggle />
              <Profile />
            </div>
          </div>
          <Checklist />
        </div>
      </div>
      
      <DataMigrationModal 
        isOpen={showMigrationModal}
        onMigrationComplete={handleMigrationComplete}
      />
      
      {/* Settings Modal */}
      {showSettings && (
        <Settings
          settings={settings}
          onSaveSettings={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
