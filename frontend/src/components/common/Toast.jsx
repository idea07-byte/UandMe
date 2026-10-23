import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { TOAST_TYPES } from '../../utils/constants';

const icons = {
  [TOAST_TYPES.SUCCESS]: CheckCircle2,
  [TOAST_TYPES.ERROR]: AlertCircle,
  [TOAST_TYPES.WARNING]: AlertTriangle,
  [TOAST_TYPES.INFO]: Info,
};

const styles = {
  [TOAST_TYPES.SUCCESS]: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-800/80 dark:text-emerald-200',
  [TOAST_TYPES.ERROR]: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/80 dark:border-rose-800/80 dark:text-rose-200',
  [TOAST_TYPES.WARNING]: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/80 dark:border-amber-800/80 dark:text-amber-200',
  [TOAST_TYPES.INFO]: 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950/80 dark:border-sky-800/80 dark:text-sky-200',
};

const iconStyles = {
  [TOAST_TYPES.SUCCESS]: 'text-emerald-600 dark:text-emerald-400',
  [TOAST_TYPES.ERROR]: 'text-rose-600 dark:text-rose-400',
  [TOAST_TYPES.WARNING]: 'text-amber-600 dark:text-amber-400',
  [TOAST_TYPES.INFO]: 'text-sky-600 dark:text-sky-400',
};

export const Toast = ({ id, type = TOAST_TYPES.INFO, title, message, onDismiss }) => {
  const Icon = icons[type] || Info;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 w-full max-w-sm p-4 rounded-xl border shadow-soft-md backdrop-blur-sm transition-all duration-300 animate-slide-up',
        styles[type]
      )}
    >
      <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', iconStyles[type])} />
      
      <div className="flex-1 text-sm">
        {title && <h5 className="font-semibold leading-tight mb-1">{title}</h5>}
        {message && <p className="opacity-90 leading-snug">{message}</p>}
      </div>

      <button
        onClick={() => onDismiss(id)}
        className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
