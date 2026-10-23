import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socketService from '../services/socket';
import messagingService from '../services/messagingService';
import { useAuth } from './AuthContext';
import { SOCKET_STATUS } from '../utils/constants';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [status, setStatus] = useState(socketService.getStatus());

  // Listen for socket status updates
  useEffect(() => {
    const unsubscribe = socketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  // Manage connection lifecycle according to auth state
  useEffect(() => {
    if (isAuthenticated && token) {
      // Connect socket with authenticated JWT token
      socketService.connect(token);
    } else if (!isAuthenticated) {
      // Disconnect cleanly on logout
      socketService.disconnect();
    }
  }, [isAuthenticated, token]);

  const reconnect = useCallback(() => {
    return socketService.reconnect();
  }, []);

  const value = {
    status,
    isConnected: status === SOCKET_STATUS.CONNECTED,
    isConnecting: status === SOCKET_STATUS.CONNECTING,
    isReconnecting: status === SOCKET_STATUS.RECONNECTING,
    isDisconnected: status === SOCKET_STATUS.DISCONNECTED,
    isMockMode: status === SOCKET_STATUS.MOCK_MODE,
    reconnect,
    messagingService,
    socketService,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
