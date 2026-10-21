import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import SettingsLayout from './layouts/SettingsLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import ChatPage from './pages/ChatPage';
import ContactsPage from './pages/ContactsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import ProfilePage from './pages/ProfilePage';
import DesignSystemPage from './pages/DesignSystemPage';
import NotFoundPage from './pages/NotFoundPage';

// Phase 5 Settings Pages
import {
  ProfileSettingsPage,
  AccountSettingsPage,
  AppearanceSettingsPage,
  NotificationSettingsPage,
  PrivacySettingsPage,
  SecuritySettingsPage,
} from './pages/settings';

/**
 * Route guard for authenticated views (Chat, Contacts, Settings).
 * Redirects unauthenticated visitors to /login while saving intended path.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-charcoal-50 dark:bg-charcoal-950">
        <LoadingSpinner size="lg" color="emerald" label="Authenticating workspace..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Authenticated Application Shell */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Navigate to="/chat" replace />} />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <ChatPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat/:chatId"
                    element={
                      <ProtectedRoute>
                        <ChatPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contacts"
                    element={
                      <ProtectedRoute>
                        <ContactsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Phase 5: Polished Settings Section */}
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/settings/profile" replace />} />
                    <Route path="profile" element={<ProfileSettingsPage />} />
                    <Route path="account" element={<AccountSettingsPage />} />
                    <Route path="appearance" element={<AppearanceSettingsPage />} />
                    <Route path="notifications" element={<NotificationSettingsPage />} />
                    <Route path="privacy" element={<PrivacySettingsPage />} />
                    <Route path="security" element={<SecuritySettingsPage />} />
                  </Route>

                  {/* Public Design System Catalog */}
                  <Route path="/design-system" element={<DesignSystemPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Authentication Shell (All Phase 2 Pages) */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify-email" element={<EmailVerificationPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
