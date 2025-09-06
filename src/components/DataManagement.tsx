'use client';

import React, { useState, useRef } from 'react';
import Button from './ui/Button';
import Card from './ui/Card';

interface DataManagementProps {
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
}

export default function DataManagement({ onExport, onImport }: DataManagementProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      onExport();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setImportError('Please select a valid JSON backup file.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImportError('File size must be less than 10MB.');
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(false);

    try {
      await onImport(file);
      setImportSuccess(true);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Clear success message after 3 seconds
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (error) {
      console.error('Import failed:', error);
      setImportError(error instanceof Error ? error.message : 'Import failed. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Data Management
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Download your data as a backup or upload a previously exported file to restore your checklist.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleExport}
            variant="secondary"
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Backup
          </Button>

          <Button
            onClick={handleImportClick}
            disabled={isImporting}
            variant="outline"
            className="flex-1"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Importing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Backup
              </>
            )}
          </Button>
        </div>

        {importSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
            <p className="text-green-600 dark:text-green-400 text-sm">✅ Data imported successfully!</p>
          </div>
        )}

        {importError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-red-600 dark:text-red-400 text-sm">{importError}</p>
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>• Backup files contain all your checklist items and progress history</p>
          <p>• Files are saved as JSON format and can be imported back anytime</p>
          <p>• Importing will replace your current data with the backup data</p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </Card>
  );
}
