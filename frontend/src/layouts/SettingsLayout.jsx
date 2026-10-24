import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Shield,
  Bell,
  Palette,
  KeyRound,
  ArrowLeft,
  ChevronRight,
  Settings,
  Lock,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Avatar from '../components/common/Avatar';
import { cn } from '../utils/cn';

export const SettingsLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    {
      to: '/settings/profile',
      label: 'My Profile',
      description: 'Avatar, display name, and status message',
      icon: User,
    },
    {
      to: '/settings/account',
      label: 'Account Settings',
      description: 'Account info, data export, and session management',
      icon: Shield,
    },
    {
      to: '/settings/appearance',
      label: 'Appearance',
      description: 'Themes, dark mode, and UI customization',
      icon: Palette,
    },
    {
      to: '/settings/notifications',
      label: 'Notifications',
      description: 'Sounds, previews, and alert chimes',
      icon: Bell,
    },
    {
      to: '/settings/privacy',
      label: 'Privacy',
      description: 'Last-seen, online visibility, and read receipts',
      icon: Lock,
    },
    {
      to: '/settings/security',
      label: 'Security',
      description: 'Password change, validation, and active sessions',
      icon: KeyRound,
    },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full w-full overflow-hidden bg-charcoal-50 dark:bg-charcoal-950 transition-colors">
      {/* Left Sidebar: Settings Navigation */}
      <aside className="w-full md:w-80 lg:w-88 shrink-0 flex flex-col bg-white dark:bg-charcoal-900 border-r border-charcoal-200 dark:border-charcoal-800 transition-colors">
        {/* Top Header with Back to Chat */}
        <div className="p-4 sm:p-5 border-b border-charcoal-100 dark:border-charcoal-800/80 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Messages</span>
            </button>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 uppercase tracking-wider">
              Preferences
            </span>
          </div>

          <h1 className="text-xl font-black text-charcoal-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-600" />
            <span>Settings</span>
          </h1>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
            Manage your PulseChat profile, preferences, and privacy.
          </p>
        </div>

        {/* Mobile Horizontal Scrollable Tab Bar */}
        <div className="md:hidden flex items-center gap-1.5 p-2 overflow-x-auto border-b border-charcoal-100 dark:border-charcoal-800 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all',
                  isActive
                    ? 'bg-primary-600 text-white shadow-soft-sm'
                    : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Desktop Vertical Navigation Items */}
        <nav className="hidden md:flex flex-1 flex-col p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-2xl transition-all group border text-left',
                  isActive
                    ? 'bg-primary-50/80 dark:bg-primary-950/40 border-primary-300 dark:border-primary-800 shadow-soft-sm text-primary-950 dark:text-primary-100'
                    : 'border-transparent text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100/70 dark:hover:bg-charcoal-800/60'
                )}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-500 dark:text-charcoal-400 group-hover:text-charcoal-900 dark:group-hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold truncate leading-tight">
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-charcoal-400 dark:text-charcoal-500 truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <ChevronRight
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400 translate-x-0.5'
                      : 'text-charcoal-300 dark:text-charcoal-600 group-hover:text-charcoal-500'
                  )}
                />
              </NavLink>
            );
          })}
        </nav>

        {/* User Mini Profile Footer */}
        {user && (
          <div className="p-4 border-t border-charcoal-100 dark:border-charcoal-800/80 flex items-center gap-3 shrink-0">
            <Avatar src={user.avatar} name={user.name} size="sm" status={user.status || 'online'} />
            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-bold text-charcoal-900 dark:text-white truncate">
                {user.name}
              </h5>
              <p className="text-[10px] text-charcoal-400 truncate font-mono">
                {user.email}
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* Right Content Pane: Active Settings Page */}
      <main className="flex-1 h-full overflow-y-auto">
        <div className="p-4 sm:p-8 lg:p-10 max-w-4xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SettingsLayout;
