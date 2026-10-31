export const APP_NAME = 'uandi';

const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.')
);

const defaultApi = isLocalhost 
  ? 'http://localhost:5000/api' 
  : 'https://uandme-8vka.onrender.com/api';

const defaultSocket = isLocalhost 
  ? 'http://localhost:5000' 
  : 'https://uandme-8vka.onrender.com';

export const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApi;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || defaultSocket;
export const ENABLE_MOCK_FALLBACK = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true';
export const SOCKET_RECONNECT_ATTEMPTS = Number(import.meta.env.VITE_SOCKET_RECONNECT_ATTEMPTS) || 5;
export const SOCKET_RECONNECT_DELAY = Number(import.meta.env.VITE_SOCKET_RECONNECT_DELAY) || 2000;

export const SOCKET_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  DISCONNECTED: 'disconnected',
  MOCK_MODE: 'mock_mode',
};

export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
  BUSY: 'busy',
};

export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
};

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

