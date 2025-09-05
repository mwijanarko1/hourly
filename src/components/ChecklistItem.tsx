"use client";

import React, { useState } from 'react';
import { ChecklistItem as ChecklistItemType } from '@/types';
import Button from './ui/Button';
import Checkbox from './ui/Checkbox';
import Input from './ui/Input';

interface ChecklistItemProps {
  item: ChecklistItemType;
  isEditing: boolean;
  editText: string;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onStartEdit: (id: string, text: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditTextChange: (text: string) => void;
  historicalCompletion?: number | null;
  isHistorical?: boolean;
  historicalHour?: number;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export default function ChecklistItem({
  item,
  isEditing,
  editText,
  onToggle,
  onRemove,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditTextChange,
  historicalCompletion,
  isHistorical = false,
  historicalHour,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}: ChecklistItemProps) {
  const [showActions, setShowActions] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSaveEdit();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <Input
          value={editText}
          onChange={(e) => onEditTextChange(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1"
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={onSaveEdit}
            disabled={!editText.trim()}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onCancelEdit}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg transition-all duration-200
        ${isHistorical 
          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
          : item.completed 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
        ${showActions ? 'shadow-md' : 'hover:shadow-sm'}
        ${isDragging ? 'opacity-50 scale-105 shadow-lg' : ''}
        ${!isHistorical ? 'cursor-move' : ''}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      draggable={!isHistorical}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <Checkbox
        checked={item.completed}
        onChange={() => onToggle(item.id)}
      />
      
      <div className="flex-1 flex items-center gap-2">
        <span className={`
          text-sm transition-all duration-200
          ${isHistorical
            ? item.completed 
              ? 'text-blue-700 dark:text-blue-400 line-through' 
              : 'text-blue-800 dark:text-blue-300'
            : item.completed 
              ? 'text-green-700 dark:text-green-400 line-through' 
              : 'text-gray-800 dark:text-gray-200'
          }
        `}>
          {item.text}
        </span>
        
        {isHistorical && historicalHour !== undefined && (
          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
            📅 {historicalHour}:00
          </span>
        )}
        
        {!isHistorical && historicalCompletion !== null && (
          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
            ✓ {historicalCompletion}:00
          </span>
        )}
      </div>
      
      <div className={`
        flex gap-1 transition-opacity duration-200
        ${showActions ? 'opacity-100' : 'opacity-0'}
      `}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onStartEdit(item.id, item.text)}
          className="!p-1 !min-w-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(item.id)}
          className="!p-1 !min-w-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
