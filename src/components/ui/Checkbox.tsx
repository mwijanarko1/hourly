import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  className = ''
}: CheckboxProps) {
  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div className={`
        relative w-5 h-5 border-2 rounded transition-all duration-200
        ${checked 
          ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500' 
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
        }
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}>
        {checked && (
          <svg
            className="absolute top-0.5 left-0.5 w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      {label && (
        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{label}</span>
      )}
    </label>
  );
}
