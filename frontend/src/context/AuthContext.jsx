import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from localStorage
  useEffect(() => {
    const existingToken = authService.getToken();
    const existingUser = authService.getCurrentUser();

    if (existingToken && existingUser) {
      setUser(existingUser);
      setToken(existingToken);
    }
    setLoading(false);
  }, []);

  /**
   * Real backend login
   */
  const login = async ({ email, password, rememberMe }) => {
    setLoading(true);
    try {
      const result = await authService.login({ email, password, rememberMe });
      setUser(result.user);
      setToken(result.token);
      return result;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Real backend registration
   */
  const register = async ({ name, email, password }) => {
    setLoading(true);
    try {
      const result = await authService.register({ name, email, password });
      if (result.user && result.token) {
        setUser(result.user);
        setToken(result.token);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Real backend forgot password
   */
  const forgotPassword = async (email) => {
    return await authService.forgotPassword(email);
  };

  /**
   * Real backend reset password
   */
  const resetPassword = async ({ token, newPassword }) => {
    return await authService.resetPassword({ token, newPassword });
  };

  /**
   * Real backend verify email
   */
  const verifyEmail = async (token) => {
    const res = await authService.verifyEmail(token);
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  /**
   * Real backend resend verification email
   */
  const resendVerificationEmail = async (email) => {
    return await authService.resendVerificationEmail(email);
  };

  /**
   * Explicit Temporary Development Mode Login
   */
  const devLogin = useCallback((email) => {
    const mockUser = authService.dev.simulateLogin(email);
    setUser(mockUser);
    setToken(authService.getToken());
    return mockUser;
  }, []);

  /**
   * Explicit Temporary Development Mode Register
   */
  const devRegister = useCallback(({ name, email }) => {
    const mockUser = authService.dev.simulateRegister({ name, email });
    setUser(mockUser);
    setToken(authService.getToken());
    return mockUser;
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
  }, []);

  /**
   * Update profile
   */
  const updateProfile = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('pulsechat_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isDevSession: authService.dev.isDevSession(),
        login,
        register,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerificationEmail,
        devLogin,
        devRegister,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
