"use client";

import React, { useState } from 'react';
import { UserSettings } from '@/types';
import Card from './ui/Card';
import Button from './ui/Button';
import Checkbox from './ui/Checkbox';

interface SettingsProps {
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onClose: () => void;
}

export default function Settings({ settings, onSaveSettings, onClose }: SettingsProps) {
  const [activeHours, setActiveHours] = useState<number[]>(settings.activeHours);
  const [notifications, setNotifications] = useState(settings.notifications);

  const handleHourToggle = (hour: number) => {
    setActiveHours(prev => 
      prev.includes(hour) 
        ? prev.filter(h => h !== hour)
        : [...prev, hour].sort((a, b) => a - b)
    );
  };

  const handleSave = () => {
    const newSettings: UserSettings = {
      activeHours,
      timezone: settings.timezone,
      notifications
    };
    onSaveSettings(newSettings);
    onClose();
  };

  const handleSelectAll = () => {
    setActiveHours(Array.from({ length: 24 }, (_, i) => i));
  };

  const handleSelectNone = () => {
    setActiveHours([]);
  };

  const handleSelectWorkHours = () => {
    setActiveHours([9, 10, 11, 12, 13, 14, 15, 16, 17]); // 9 AM to 5 PM
  };

  const handleSelectAwakeHours = () => {
    setActiveHours([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]); // 7 AM to 10 PM
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Settings
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="!p-2"
            >
              ✕
            </Button>
          </div>

          {/* Active Hours Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Active Hours to Track
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select which hours you want to track your productivity. Only these hours will appear in your progress chart.
              </p>
            </div>

            {/* Quick Selection Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectWorkHours}
              >
                Work Hours (9 AM - 5 PM)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectAwakeHours}
              >
                Awake Hours (7 AM - 10 PM)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectAll}
              >
                All Hours
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectNone}
              >
                Clear All
              </Button>
            </div>

            {/* Hour Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="flex flex-col items-center space-y-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatHour(hour)}
                  </div>
                  <Checkbox
                    checked={activeHours.includes(hour)}
                    onChange={() => handleHourToggle(hour)}
                    className="scale-75"
                  />
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Selected: {activeHours.length} hours ({activeHours.map(formatHour).join(', ')})
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Notifications
            </h3>
            <Checkbox
              checked={notifications}
              onChange={setNotifications}
              label="Enable notifications for hourly resets"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={activeHours.length === 0}
              className="flex-1"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}