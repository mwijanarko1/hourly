"use client";

import React from 'react';
import { HourlyProgress, UserSettings } from '@/types';
import Card from './ui/Card';
import Button from './ui/Button';
import { useAuth } from '@/contexts/AuthContext';

interface ProgressChartProps {
  progressHistory: HourlyProgress[];
  settings: UserSettings;
  selectedDate: string;
  selectedHour: number | null;
  onDateChange: (date: string) => void;
  onHourChange: (hour: number | null) => void;
}

export default function ProgressChart({ 
  progressHistory, 
  settings, 
  selectedDate, 
  selectedHour,
  onDateChange, 
  onHourChange 
}: ProgressChartProps) {
  const { user, signInWithGoogle } = useAuth();
  // Get progress for selected date
  const selectedDateProgress = progressHistory.filter(progress => progress.date === selectedDate);
  
  // Create hourly data for the chart (only for active hours)
  const hourlyData = settings.activeHours.map(hour => {
    const progress = selectedDateProgress.find(p => p.hour === hour);
    return {
      hour,
      completionRate: progress ? progress.completionRate : 0,
      hasData: !!progress,
      progress: progress
    };
  });

  // Get available dates
  const availableDates = Array.from(new Set(progressHistory.map(p => p.date)))
    .sort((a, b) => b.localeCompare(a));

  const currentDateIndex = availableDates.indexOf(selectedDate);
  const canGoBack = currentDateIndex < availableDates.length - 1;
  const canGoForward = currentDateIndex > 0;

  const handlePreviousDay = () => {
    if (canGoBack) {
      onDateChange(availableDates[currentDateIndex + 1]);
      onHourChange(null); // Reset hour selection when changing days
    }
  };

  const handleNextDay = () => {
    if (canGoForward) {
      onDateChange(availableDates[currentDateIndex - 1]);
      onHourChange(null); // Reset hour selection when changing days
    }
  };




  // Get current hour to highlight
  const currentHour = new Date().getHours();

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        {/* Date Navigation Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousDay}
            disabled={!canGoBack}
            className="!p-2 !min-w-0"
            aria-label="Previous day"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {formatDate(selectedDate)} Progress
          </h3>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextDay}
            disabled={!canGoForward}
            className="!p-2 !min-w-0"
            aria-label="Next day"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Hour</span>
            <span>Completion</span>
          </div>
          
          <div className={`grid gap-1 ${settings.activeHours.length <= 8 ? 'grid-cols-4' : settings.activeHours.length <= 12 ? 'grid-cols-6' : 'grid-cols-8'}`}>
            {hourlyData.map(({ hour, completionRate, hasData, progress }) => (
              <div key={hour} className="flex flex-col items-center space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatHour(hour)}
                </div>
                <div
                  className={`
                    w-full h-8 rounded-sm transition-all duration-300 cursor-pointer hover:opacity-80
                    ${hasData 
                      ? completionRate === 100
                        ? 'bg-green-500 dark:bg-green-400'
                        : completionRate > 0
                        ? 'bg-blue-500 dark:bg-blue-400'
                        : 'bg-gray-300 dark:bg-gray-600'
                      : 'bg-gray-100 dark:bg-gray-700'
                    }
                    ${hour === currentHour ? 'ring-2 ring-yellow-400 dark:ring-yellow-300' : ''}
                    ${selectedHour === hour ? 'ring-2 ring-purple-500 dark:ring-purple-400 ring-offset-2 dark:ring-offset-gray-800' : ''}
                  `}
                  style={{ 
                    opacity: hasData ? Math.max(0.3, completionRate / 100) : 0.2 
                  }}
                  title={`${formatHour(hour)} - ${completionRate.toFixed(0)}% complete${progress ? ` (${progress.completedItems}/${progress.totalItems} items)` : ''}`}
                  onClick={() => {
                    if (progress) {
                      onHourChange(hour);
                    }
                  }}
                />
              </div>
            ))}
          </div>
          
          {settings.activeHours.length > 8 && (
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{formatHour(settings.activeHours[0])}</span>
              <span>{formatHour(settings.activeHours[Math.floor(settings.activeHours.length / 2)])}</span>
              <span>{formatHour(settings.activeHours[settings.activeHours.length - 1])}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-sm"></div>
              <span className="text-gray-600 dark:text-gray-400">100% Complete</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-sm"></div>
              <span className="text-gray-600 dark:text-gray-400">Partial</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
              <span className="text-gray-600 dark:text-gray-400">No Progress</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border-2 border-yellow-400 dark:border-yellow-300 rounded-sm"></div>
              <span className="text-gray-600 dark:text-gray-400">Current Hour</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border-2 border-purple-500 dark:border-purple-400 rounded-sm"></div>
              <span className="text-gray-600 dark:text-gray-400">Selected Hour</span>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            Click on any hour bar to see detailed progress
          </div>
        </div>

        {/* Sign-in prompt for users with data who aren't signed in */}
        {!user && progressHistory.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Sync Your Progress
                </h4>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                You have {progressHistory.length} day{progressHistory.length !== 1 ? 's' : ''} of progress data. 
                Sign in to sync across all your devices and never lose your data.
              </p>
              <Button
                onClick={signInWithGoogle}
                size="sm"
                className="bg-white text-blue-600 hover:bg-blue-50 border border-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700 dark:border-blue-600"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
            </div>
          </div>
        )}

      </div>
    </Card>
  );
}
