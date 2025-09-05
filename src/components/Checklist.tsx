"use client";

import React, { useState } from 'react';
import { useChecklistWithAuth } from '@/hooks/useChecklistWithAuth';
import { updateOrCreateHourlyProgress } from '@/utils/progress';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import ChecklistItem from './ChecklistItem';
import Timer from './Timer';
import ProgressChart from './ProgressChart';

export default function Checklist() {
  const {
    items,
    nextReset,
    progressHistory,
    settings,
    isEditing,
    editText,
    setEditText,
    addItem,
    toggleItem,
    removeItem,
    reorderItems,
    startEditing,
    cancelEditing,
    saveEditing,
    toggleHistoricalItem,
    updateHistoricalItem,
    removeHistoricalItem,
    setState
  } = useChecklistWithAuth();

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [addItemError, setAddItemError] = useState('');

  const handleInlineAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItemText.trim()) {
      setAddItemError('Please enter a checklist item');
      return;
    }

    try {
      addItem(newItemText);
      setNewItemText('');
      setAddItemError('');
      setShowAddForm(false);
    } catch (err) {
      setAddItemError(err instanceof Error ? err.message : 'Failed to add item');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewItemText(e.target.value);
    if (addItemError) setAddItemError('');
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewItemText('');
    setAddItemError('');
  };

  const handleRemoveItem = (id: string) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      removeItem(id);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderItems(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleResetHourly = () => {
    if (items.length > 0) {
      const currentHour = new Date().getHours();
      const today = new Date().toISOString().split('T')[0];
      
      // Reset completion status and save progress
      setState(prevState => {
        const resetItems = prevState.items.map(item => ({
          ...item,
          completed: false
        }));
        
        // Update or create progress entry for current hour before resetting
        const updatedProgressHistory = updateOrCreateHourlyProgress(
          prevState.progressHistory,
          prevState.items,
          currentHour,
          today
        );
        
        return {
          ...prevState,
          items: resetItems,
          progressHistory: updatedProgressHistory
        };
      });
      
      alert(`Hourly reset complete! Progress saved for ${currentHour}:00. All items unchecked for the new hour.`);
    } else {
      alert('Add some items to your checklist first!');
    }
  };

  // Get progress for selected date and hour
  const selectedDateProgress = progressHistory.filter(progress => progress.date === selectedDate);
  const selectedHourProgress = selectedHour !== null 
    ? selectedDateProgress.find(p => p.hour === selectedHour)
    : null;

  // Check if the selected hour is the current hour
  const currentHour = new Date().getHours();
  const isCurrentHour = selectedHour === currentHour;
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Get hours with data for the selected date
  const hoursWithData = selectedDateProgress
    .map(p => p.hour)
    .sort((a, b) => a - b);

  const currentHourIndex = selectedHour !== null ? hoursWithData.indexOf(selectedHour) : -1;
  const canGoToPreviousHour = currentHourIndex > 0;
  const canGoToNextHour = currentHourIndex < hoursWithData.length - 1;

  const handlePreviousHour = () => {
    if (canGoToPreviousHour && selectedHour !== null) {
      setSelectedHour(hoursWithData[currentHourIndex - 1]);
    }
  };

  const handleNextHour = () => {
    if (canGoToNextHour && selectedHour !== null) {
      setSelectedHour(hoursWithData[currentHourIndex + 1]);
    }
  };

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
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Timer */}
      <Timer nextReset={nextReset} />

      {/* Progress Chart */}
      <ProgressChart 
        progressHistory={progressHistory} 
        settings={settings}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        onDateChange={setSelectedDate}
        onHourChange={setSelectedHour}
      />


      {/* Checklist Items */}
      <Card>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Your Checklist</h2>
            {!showAddForm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="!p-2 !min-w-0"
                aria-label="Add new item"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </Button>
            )}
          </div>

          {/* Inline Add Item Form */}
          {showAddForm && (
            <form onSubmit={handleInlineAddItem} className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Input
                value={newItemText}
                onChange={handleInputChange}
                placeholder="Add a new checklist item..."
                error={addItemError}
                className="text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={!newItemText.trim()}
                  size="sm"
                  className="flex-1"
                >
                  Add Item
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelAdd}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Historical Progress Navigation */}
          {selectedHour !== null && selectedHourProgress && !(isCurrentHour && isToday) && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePreviousHour}
                    disabled={!canGoToPreviousHour}
                    className="!p-1 !min-w-0"
                    aria-label="Previous hour"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Button>
                  
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {formatDate(selectedDate)} - {formatHour(selectedHour)}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextHour}
                    disabled={!canGoToNextHour}
                    className="!p-1 !min-w-0"
                    aria-label="Next hour"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedHour(null)}
                  className="!text-xs !px-2 !py-1"
                >
                  Back to Current
                </Button>
              </div>
              
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Completion: {selectedHourProgress.completionRate.toFixed(0)}% ({selectedHourProgress.completedItems}/{selectedHourProgress.totalItems} items)
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                ✏️ You can edit items and toggle completion for this hour
              </div>
            </div>
          )}
          
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p>No items yet. Click the + button to add your first task!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedHour !== null && selectedHourProgress && !(isCurrentHour && isToday) ? (
                // Show historical items when viewing a past hour (but not current hour on today)
                selectedHourProgress.items.length === 0 ? (
                  <div className="text-center py-8 text-blue-500 dark:text-blue-400">
                    <svg className="mx-auto h-12 w-12 text-blue-400 dark:text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No items were tracked for this hour.</p>
                    <p className="text-sm mt-1">Items may have been added after this hour passed.</p>
                  </div>
                ) : (
                  selectedHourProgress.items.map((historicalItem) => (
                  <ChecklistItem
                    key={historicalItem.id}
                    item={historicalItem}
                    isEditing={isEditing === historicalItem.id}
                    editText={editText}
                    onToggle={() => toggleHistoricalItem(historicalItem.id, selectedDate, selectedHour)}
                    onRemove={() => {
                      if (window.confirm('Are you sure you want to remove this item from this hour?')) {
                        removeHistoricalItem(historicalItem.id, selectedDate, selectedHour);
                      }
                    }}
                    onStartEdit={startEditing}
                    onCancelEdit={cancelEditing}
                    onSaveEdit={() => {
                      if (isEditing && editText.trim()) {
                        try {
                          updateHistoricalItem(isEditing, editText, selectedDate, selectedHour);
                          cancelEditing();
                        } catch (error) {
                          console.error('Error updating historical item:', error);
                        }
                      }
                    }}
                    onEditTextChange={setEditText}
                    isHistorical={true}
                    historicalHour={selectedHour}
                  />
                  ))
                )
              ) : (
                // Show current items when not viewing a specific hour OR when viewing current hour on today
                items.map((item, index) => {
                  // Check if this item was completed in the selected hour (only for historical hours)
                  const wasCompletedInSelectedHour = (selectedHour !== null && !(isCurrentHour && isToday)) 
                    ? selectedHourProgress?.items.find(
                        historicalItem => historicalItem.id === item.id && historicalItem.completed
                      )
                    : null;
                  
                  return (
                    <ChecklistItem
                      key={item.id}
                      item={item}
                      isEditing={isEditing === item.id}
                      editText={editText}
                      onToggle={toggleItem}
                      onRemove={handleRemoveItem}
                      onStartEdit={startEditing}
                      onCancelEdit={cancelEditing}
                      onSaveEdit={saveEditing}
                      onEditTextChange={setEditText}
                      historicalCompletion={wasCompletedInSelectedHour ? selectedHour : null}
                      isDragging={draggedIndex === index}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    />
                  );
                })
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      {items.length > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all items?')) {
                    items.forEach(item => removeItem(item.id));
                  }
                }}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const uncompleted = items.filter(item => !item.completed);
                  uncompleted.forEach(item => toggleItem(item.id));
                }}
                className="flex-1"
              >
                Mark All Complete
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleResetHourly}
                className="flex-1"
              >
                Reset Hour
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}