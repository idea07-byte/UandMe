import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-lg',
  closeOnOverlayClick = true,
}) => {
  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          'relative w-full z-10 flex flex-col bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 rounded-2xl shadow-soft-lg overflow-hidden animate-scale-in',
          maxWidth
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-charcoal-100 dark:border-charcoal-800/80">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-charcoal-900 dark:text-charcoal-100">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                {description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[70vh] text-sm text-charcoal-700 dark:text-charcoal-300">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-charcoal-50/70 dark:bg-charcoal-950/50 border-t border-charcoal-100 dark:border-charcoal-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
