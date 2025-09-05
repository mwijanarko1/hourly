"use client";

import React, { useState } from 'react';
import { DailyStats as DailyStatsType, HourlyProgress } from '@/types';
import Card from './ui/Card';
import Button from './ui/Button';

interface DailyStatsProps {
  dailyStats: DailyStatsType;
  allProgressHistory: HourlyProgress[];
}

export default function DailyStats({ dailyStats, allProgressHistory }: DailyStatsProps) {
  const [selectedDate, setSelectedDate] = useState(dailyStats.date);
  // Get unique dates from all progress history, sorted most recent first
  const availableDates = Array.from(new Set(allProgressHistory.map(p => p.date)))
    .sort((a, b) => b.localeCompare(a));

  const currentDateIndex = availableDates.indexOf(selectedDate);
  const canGoBack = currentDateIndex < availableDates.length - 1;
  const canGoForward = currentDateIndex > 0;

  const handlePreviousDay = () => {
    if (canGoBack) {
      setSelectedDate(availableDates[currentDateIndex + 1]);
    }
  };

  const handleNextDay = () => {
    if (canGoForward) {
      setSelectedDate(availableDates[currentDateIndex - 1]);
    }
  };

  // Calculate stats for selected date
  const selectedDateProgress = allProgressHistory.filter(p => p.date === selectedDate);
  const selectedDateStats = {
    date: selectedDate,
    totalHours: selectedDateProgress.length,
    completedHours: selectedDateProgress.filter(p => p.completionRate > 0).length,
    averageCompletionRate: selectedDateProgress.length > 0 
      ? selectedDateProgress.reduce((sum, p) => sum + p.completionRate, 0) / selectedDateProgress.length 
      : 0,
    totalItemsCompleted: selectedDateProgress.reduce((sum, p) => sum + p.completedItems, 0),
    bestHour: selectedDateProgress.length > 0 
      ? selectedDateProgress.reduce((best, current) => 
          current.completionRate > best.completionRate ? current : best
        ).hour 
      : -1,
    progressHistory: selectedDateProgress
  };

  const {
    date,
    totalHours,
    completedHours,
    averageCompletionRate,
    totalItemsCompleted,
    bestHour
  } = selectedDateStats;

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

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
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
            {formatDate(date)}
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
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {completedHours}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Hours Completed
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              of {totalHours} total
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {averageCompletionRate.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average Rate
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              completion
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {totalItemsCompleted}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Items Completed
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {formatHour(bestHour)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Best Hour
            </div>
          </div>
        </div>
        
        {totalHours > 0 && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Daily Progress</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {((completedHours / totalHours) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedHours / totalHours) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Date Jump */}
        {availableDates.length > 1 && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
              Quick jump to:
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              {availableDates.slice(0, 5).map(date => (
                <Button
                  key={date}
                  variant={selectedDate === date ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedDate(date)}
                  className="!text-xs !px-2 !py-1"
                >
                  {formatDate(date)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
