import React from 'react';
import { cn } from '../../utils/cn';
import LoadingSpinner from './LoadingSpinner';

const variantClasses = {
  primary:
    'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-soft hover:shadow-emerald-glow/20 focus-visible:ring-primary-500 border border-transparent',
  secondary:
    'bg-charcoal-100 hover:bg-charcoal-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-charcoal-100 border border-charcoal-200 dark:border-charcoal-700 focus-visible:ring-charcoal-400',
  outline:
    'bg-transparent hover:bg-primary-50 dark:hover:bg-charcoal-800/60 text-charcoal-700 dark:text-charcoal-200 border border-charcoal-300 dark:border-charcoal-700 hover:border-primary-500 dark:hover:border-primary-500 focus-visible:ring-primary-500',
  ghost:
    'bg-transparent hover:bg-charcoal-100 dark:hover:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-white border border-transparent focus-visible:ring-charcoal-400',
  danger:
    'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-soft focus-visible:ring-rose-500 border border-transparent',
};

const sizeClasses = {
  xs: 'text-xs px-2.5 py-1 rounded-lg gap-1.5',
  sm: 'text-sm px-3 py-1.5 rounded-lg gap-2',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2 font-medium',
  lg: 'text-base px-5 py-3 rounded-xl gap-2.5 font-medium',
  icon: 'p-2.5 rounded-xl justify-center',
};

export const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center select-none font-medium outline-none transition-standard focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-charcoal-900',
          variantClasses[variant] || variantClasses.primary,
          sizeClasses[size] || sizeClasses.md,
          fullWidth && 'w-full',
          isDisabled && 'opacity-60 cursor-not-allowed pointer-events-none shadow-none',
          className
        )}
        {...props}
      >
        {isLoading && (
          <LoadingSpinner
            size="sm"
            color={variant === 'primary' || variant === 'danger' ? 'white' : 'emerald'}
          />
        )}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
