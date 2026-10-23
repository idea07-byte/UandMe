import React from 'react';
import { cn } from '../../utils/cn';

const sizeMap = {
  xs: 'w-3.5 h-3.5 border-2',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-4',
};

const colorMap = {
  emerald: 'border-emerald-600 border-t-transparent dark:border-emerald-400 dark:border-t-transparent',
  white: 'border-white border-t-transparent',
  charcoal: 'border-charcoal-700 border-t-transparent dark:border-charcoal-300 dark:border-t-transparent',
  current: 'border-current border-t-transparent',
};

export const LoadingSpinner = ({
  size = 'md',
  color = 'emerald',
  className,
  fullScreen = false,
  label = 'Loading...',
}) => {
  const spinnerElement = (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'rounded-full animate-spin shrink-0',
        sizeMap[size] || sizeMap.md,
        colorMap[color] || colorMap.emerald,
        className
      )}
    >
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-charcoal-50/80 dark:bg-charcoal-950/80 backdrop-blur-sm gap-3">
        {spinnerElement}
        {label && (
          <p className="text-sm font-medium text-charcoal-600 dark:text-charcoal-300 animate-pulse">
            {label}
          </p>
        )}
      </div>
    );
  }

  return spinnerElement;
};

export default LoadingSpinner;
