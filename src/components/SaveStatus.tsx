"use client";

import React, { useState, useEffect } from 'react';
import { useChecklist } from '@/hooks/useChecklist';

export default function SaveStatus() {
  const { items } = useChecklist();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    // Show saving indicator briefly when items change
    setIsSaving(true);
    setLastSaved(new Date());
    
    const timer = setTimeout(() => {
      setIsSaving(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [items]);

  if (!lastSaved) return null;

  const currentHour = new Date().getHours();

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      {isSaving ? (
        <>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Auto-saving {currentHour}:00 progress...</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Auto-saved to {currentHour}:00</span>
        </>
      )}
    </div>
  );
}
