import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Accessible Toggle Switch Component for Settings.
 * Implements WAI-ARIA role="switch" pattern with full keyboard & screen reader support.
 */
export const SettingsToggle = ({
  id,
  checked,
  onChange,
  title,
  description,
  icon: Icon,
  disabled = false,
  badge,
  className,
}) => {
  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange?.(!checked);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none',
        checked
          ? 'bg-primary-50/50 dark:bg-primary-950/20 border-primary-200/80 dark:border-primary-900/50'
          : 'bg-charcoal-50/70 dark:bg-charcoal-800/40 border-charcoal-200/60 dark:border-charcoal-800 hover:bg-charcoal-100/60 dark:hover:bg-charcoal-800/70',
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
      onClick={() => {
        if (!disabled) onChange?.(!checked);
      }}
    >
      {/* Label & Description */}
      <div className="flex items-start gap-3 min-w-0 pr-4">
        {Icon && (
          <div
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors',
              checked
                ? 'bg-primary-100 dark:bg-primary-900/60 text-primary-600 dark:text-primary-300'
                : 'bg-charcoal-200/60 dark:bg-charcoal-700/60 text-charcoal-500 dark:text-charcoal-400'
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <label
              htmlFor={id}
              className="text-xs sm:text-sm font-bold text-charcoal-900 dark:text-charcoal-100 cursor-pointer"
            >
              {title}
            </label>
            {badge && (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[11px] sm:text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Accessible Switch Control */}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-charcoal-900',
          checked ? 'bg-primary-600' : 'bg-charcoal-300 dark:bg-charcoal-700'
        )}
      >
        <span className="sr-only">{title}</span>
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
};

export default SettingsToggle;
