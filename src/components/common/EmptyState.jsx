import React from 'react';
import { MessageSquareDashed } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = MessageSquareDashed,
  title = 'No items found',
  description = 'There are no items to display at this moment.',
  actionLabel,
  onAction,
  actionButton,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-800/50 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 shadow-soft">
        <Icon className="w-8 h-8" />
      </div>

      <h4 className="text-base font-bold text-charcoal-900 dark:text-charcoal-100 mb-1.5">
        {title}
      </h4>

      <p className="text-sm text-charcoal-500 dark:text-charcoal-400 leading-relaxed mb-6">
        {description}
      </p>

      {actionButton ? (
        actionButton
      ) : actionLabel && onAction ? (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};

export default EmptyState;
