import React from 'react';
import { cn } from '../../utils/cn';

export const FormGroup = ({ label, error, helperText, required = false, children, className }) => {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 dark:text-charcoal-300">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

export default FormGroup;
