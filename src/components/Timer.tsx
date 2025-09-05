"use client";

import React, { useState, useEffect } from 'react';
import { useTimer } from '@/hooks/useTimer';
import Card from './ui/Card';

interface TimerProps {
  nextReset: Date;
}

export default function Timer({ nextReset }: TimerProps) {
  const [isClient, setIsClient] = useState(false);
  const { formattedTime, isExpired } = useTimer(nextReset);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show a placeholder during SSR to prevent hydration mismatch
  if (!isClient) {
    return (
      <Card className="text-center" padding="sm">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Reset In</h3>
          <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
            --:--:--
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="text-center" padding="sm">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Reset In</h3>
        <div className={`
          text-2xl font-mono font-bold
          ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}
        `}>
          {formattedTime}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isExpired ? 'Resetting now...' : 'Checklist will reset automatically'}
        </p>
      </div>
    </Card>
  );
}
