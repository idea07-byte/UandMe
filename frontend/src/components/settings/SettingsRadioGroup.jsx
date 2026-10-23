import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Accessible Radio Group for Selection Settings
 * (e.g., Privacy visibility, Sound tone selector, Notification preview mode)
 */
export const SettingsRadioGroup = ({
  options = [],
  value,
  onChange,
  name,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const Icon = opt.icon;

        return (
          <label
            key={opt.value}
            className={cn(
              'flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none group',
              isSelected
                ? 'bg-primary-50/70 dark:bg-primary-950/30 border-primary-300 dark:border-primary-800 shadow-soft-sm'
                : 'bg-charcoal-50/60 dark:bg-charcoal-800/40 border-charcoal-200/60 dark:border-charcoal-800 hover:bg-charcoal-100/60 dark:hover:bg-charcoal-800/70'
            )}
          >
            <div className="flex items-center gap-3 min-w-0 pr-4">
              {/* Radio check indicator */}
              <div
                className={cn(
                  'w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all',
                  isSelected
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-charcoal-300 dark:border-charcoal-600 group-hover:border-charcoal-400'
                )}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>

              {Icon && (
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isSelected
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-charcoal-400'
                  )}
                />
              )}

              <div className="min-w-0">
                <span
                  className={cn(
                    'text-xs sm:text-sm font-bold block leading-tight',
                    isSelected
                      ? 'text-primary-950 dark:text-primary-100'
                      : 'text-charcoal-800 dark:text-charcoal-200'
                  )}
                >
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="text-[11px] text-charcoal-500 dark:text-charcoal-400 block mt-0.5 leading-relaxed">
                    {opt.description}
                  </span>
                )}
              </div>
            </div>

            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={() => onChange?.(opt.value)}
              className="sr-only"
            />
          </label>
        );
      })}
    </div>
  );
};

export default SettingsRadioGroup;
