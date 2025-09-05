'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

interface SyncStatusProps {
  lastSyncTime: Date | null;
  isSyncing: boolean;
  onManualSync: () => void;
}

export default function SyncStatus({ lastSyncTime, isSyncing, onManualSync }: SyncStatusProps) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      {/* Sync Status Icon */}
      <div className="flex items-center gap-1">
        {isSyncing ? (
          <>
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Syncing...</span>
          </>
        ) : lastSyncTime ? (
          <>
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Synced {formatLastSync(lastSyncTime)}</span>
          </>
        ) : (
          <>
            <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Not synced</span>
          </>
        )}
      </div>

      {/* Manual Sync Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onManualSync}
        disabled={isSyncing}
        className="!p-1 !min-w-0 h-6 text-xs"
        aria-label="Manual sync"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </Button>
    </div>
  );
}
