"use client";

import React, { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

interface AddItemFormProps {
  onAddItem: (text: string) => void;
  isLoading?: boolean;
}

export default function AddItemForm({ onAddItem, isLoading = false }: AddItemFormProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Please enter a checklist item');
      return;
    }

    try {
      onAddItem(text);
      setText('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (error) setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        value={text}
        onChange={handleInputChange}
        placeholder="Add a new checklist item..."
        error={error}
        disabled={isLoading}
        className="text-sm"
      />
      <Button
        type="submit"
        isLoading={isLoading}
        disabled={!text.trim()}
        className="w-full"
      >
        Add Item
      </Button>
    </form>
  );
}
