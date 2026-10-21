import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      type = 'text',
      className,
      containerClassName,
      id,
      name,
      required = false,
      disabled = false,
      fullWidth = true,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || name || `input-${Math.random().toString(36).substring(2, 9)}`;

    const isPasswordType = type === 'password';
    const computedType = isPasswordType && showPassword ? 'text' : type;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth ? 'w-full' : 'w-auto', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 dark:text-charcoal-300"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-charcoal-400 dark:text-charcoal-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={computedType}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full text-sm rounded-xl px-4 py-2.5 outline-none transition-standard',
              'bg-white dark:bg-charcoal-900',
              'text-charcoal-900 dark:text-charcoal-100 placeholder:text-charcoal-400 dark:placeholder:text-charcoal-500',
              'border border-charcoal-300 dark:border-charcoal-700',
              'focus:border-primary-500 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-500/30',
              leftIcon && 'pl-11',
              (rightIcon || isPasswordType) && 'pr-11',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500',
              disabled && 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-400 cursor-not-allowed opacity-75',
              className
            )}
            {...props}
          />

          {isPasswordType ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 p-1 rounded-lg text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-200 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : (
            rightIcon && (
              <div className="absolute right-3.5 flex items-center text-charcoal-400 dark:text-charcoal-500">
                {rightIcon}
              </div>
            )
          )}
        </div>

        {error ? (
          <p className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
