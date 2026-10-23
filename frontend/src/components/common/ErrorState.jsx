import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

export const ErrorState = ({
  icon: Icon = AlertTriangle,
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this view. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  secondaryAction,
  className,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-soft">
        <Icon className="w-8 h-8" />
      </div>

      <h4 className="text-base font-bold text-charcoal-900 dark:text-charcoal-100 mb-1.5">
        {title}
      </h4>

      <p className="text-sm text-charcoal-500 dark:text-charcoal-400 leading-relaxed mb-6">
        {message}
      </p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <Button
            variant="primary"
            size="sm"
            onClick={onRetry}
            leftIcon={<RotateCw className="w-4 h-4" />}
          >
            {retryLabel}
          </Button>
        )}
        {secondaryAction}
      </div>
    </div>
  );
};

export default ErrorState;
