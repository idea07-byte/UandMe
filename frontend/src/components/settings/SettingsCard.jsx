import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Reusable Settings Card container with consistent borders,
 * padding, and dark mode support.
 */
export const SettingsCard = ({
  title,
  description,
  badge,
  icon: Icon,
  children,
  footer,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-5 sm:p-6 rounded-3xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 shadow-soft-sm space-y-5 transition-colors',
        className
      )}
    >
      {(title || description || Icon) && (
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-charcoal-100 dark:border-charcoal-800/80">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-charcoal-900 dark:text-white leading-tight">
                  {title}
                </h3>
                {badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300">
                    {badge}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4">{children}</div>

      {/* Optional Footer */}
      {footer && (
        <div className="pt-4 border-t border-charcoal-100 dark:border-charcoal-800/80 flex items-center justify-between flex-wrap gap-3">
          {footer}
        </div>
      )}
    </div>
  );
};

export default SettingsCard;
