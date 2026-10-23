import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/common/Toast';
import { TOAST_TYPES } from '../utils/constants';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = TOAST_TYPES.INFO, title, message, duration = 4000 }) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      setToasts((prev) => [...prev, { id, type, title, message }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toastMethods = {
    addToast,
    removeToast,
    success: (message, title, duration) =>
      addToast({ type: TOAST_TYPES.SUCCESS, title, message, duration }),
    error: (message, title, duration) =>
      addToast({ type: TOAST_TYPES.ERROR, title, message, duration }),
    warning: (message, title, duration) =>
      addToast({ type: TOAST_TYPES.WARNING, title, message, duration }),
    info: (message, title, duration) =>
      addToast({ type: TOAST_TYPES.INFO, title, message, duration }),
  };

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      {/* Toast floating container */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              onDismiss={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
