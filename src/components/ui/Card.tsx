import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

const shadowClasses = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl'
};

export default function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'md'
}: CardProps) {
  const paddingClass = paddingClasses[padding];
  const shadowClass = shadowClasses[shadow];
  
  return (
    <div className={`
      bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-shadow duration-200
      ${paddingClass} ${shadowClass} ${className}
    `}>
      {children}
    </div>
  );
}
