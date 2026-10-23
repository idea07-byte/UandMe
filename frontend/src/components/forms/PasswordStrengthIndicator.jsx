import React from 'react';
import { Check, Circle } from 'lucide-react';
import { calculatePasswordStrength } from '../../utils/validators';
import { cn } from '../../utils/cn';

export const PasswordStrengthIndicator = ({ password = '', className }) => {
  const { score, label, color, textColor, checks } = calculatePasswordStrength(password);

  if (!password) return null;

  const requirements = [
    { label: 'At least 8 characters', met: checks.hasMinLength },
    { label: 'Upper & lowercase letters', met: checks.hasLowerAndUpper },
    { label: 'At least 1 number', met: checks.hasNumber },
    { label: 'At least 1 special symbol', met: checks.hasSpecial },
  ];

  return (
    <div className={cn('space-y-2 mt-2 pt-1 select-none', className)}>
      {/* Strength Bar & Label */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-charcoal-500 dark:text-charcoal-400">Password Strength:</span>
        <span className={cn('transition-colors', textColor)}>{label}</span>
      </div>

      {/* 4-Segment Progress Bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-charcoal-100 dark:bg-charcoal-800 rounded-full overflow-hidden p-0.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              'h-full rounded-full transition-all duration-300',
              score >= step ? color : 'bg-transparent'
            )}
          />
        ))}
      </div>

      {/* Checklist criteria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
        {requirements.map((req) => (
          <div
            key={req.label}
            className={cn(
              'flex items-center gap-1.5 transition-colors',
              req.met
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : 'text-charcoal-400 dark:text-charcoal-500'
            )}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Circle className="w-2.5 h-2.5 shrink-0 opacity-40 ml-0.5 mr-0.5" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
