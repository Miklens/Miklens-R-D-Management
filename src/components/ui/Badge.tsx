import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'info', className = '' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/50 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/50 dark:text-yellow-200';
      case 'error':
        return 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/50 dark:text-red-200';
      case 'neutral':
        return 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400';
      case 'info':
      default:
        return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/50 dark:text-blue-200';
    }
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getVariantStyles()} ${className}`}>
      {children}
    </span>
  );
};
