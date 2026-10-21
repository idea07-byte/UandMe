import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

export const MainLayout = () => {
  const location = useLocation();
  // Chat dashboard and contacts directory operate in immersive full-height workspace mode
  const isImmersiveWorkspace =
    location.pathname.startsWith('/chat') ||
    location.pathname.startsWith('/contacts');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-charcoal-50 dark:bg-charcoal-950 text-charcoal-900 dark:text-charcoal-100 transition-colors">
      {/* Render top Navbar on profile/settings, design system, and error pages */}
      {!isImmersiveWorkspace && <Navbar />}

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
