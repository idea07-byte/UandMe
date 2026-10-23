import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';
import { cn } from '../../utils/cn';

/**
 * Accessible, reusable Confirmation Dialog for destructive or critical actions
 * (Delete conversation, Block contact, Clear messages, etc.)
 */
export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Please confirm to proceed.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  icon: Icon = AlertTriangle,
  note,
  isLoading = false,
  maxWidth = 'max-w-md',
}) => {
  const confirmBtnRef = useRef(null);

  // Close on Escape & trap focus
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen && !isLoading) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      // Autofocus confirm or cancel button for keyboard accessibility
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const iconColors = {
    danger: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900/60',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900/60',
    primary: 'bg-primary-100 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 border-primary-200 dark:border-primary-900/60',
  };

  const buttonVariants = {
    danger: 'danger',
    warning: 'secondary',
    primary: 'primary',
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Dialog Card */}
      <div
        className={cn(
          'relative w-full z-10 flex flex-col bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 rounded-3xl shadow-soft-lg overflow-hidden animate-scale-in p-6',
          maxWidth
        )}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Action Icon Badge */}
          <div
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-soft-sm',
              iconColors[variant] || iconColors.danger
            )}
          >
            <Icon className="w-6 h-6" />
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left">
            <h3
              id="confirmation-modal-title"
              className="text-base sm:text-lg font-bold text-charcoal-900 dark:text-charcoal-100 leading-snug"
            >
              {title}
            </h3>

            <p
              id="confirmation-modal-desc"
              className="text-xs sm:text-sm text-charcoal-600 dark:text-charcoal-400 mt-1.5 leading-relaxed"
            >
              {message}
            </p>

            {note && (
              <div className="mt-3 p-2.5 rounded-xl bg-charcoal-100/70 dark:bg-charcoal-800/60 border border-charcoal-200/50 dark:border-charcoal-700/50 text-[11px] text-charcoal-600 dark:text-charcoal-300">
                <span className="font-semibold text-charcoal-800 dark:text-charcoal-200">Note: </span>
                {note}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-charcoal-100 dark:border-charcoal-800/80">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>

          <Button
            ref={confirmBtnRef}
            type="button"
            variant={buttonVariants[variant] || 'danger'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
