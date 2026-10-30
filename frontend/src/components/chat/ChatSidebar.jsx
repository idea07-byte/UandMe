import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Users,
  Archive,
  Settings,
  Sun,
  Moon,
  LogOut,
  User,
  Shield,
  Layers,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import OnlineIndicator from './OnlineIndicator';
import useTheme from '../../hooks/useTheme';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { cn } from '../../utils/cn';

export const ChatSidebar = ({
  activeNav = 'chats', // 'chats' | 'contacts' | 'archived' | 'favorites'
  onNavChange,
  unreadTotal = 0,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.info('You have signed out from PulseChat.');
    navigate('/login');
  };

  const navItems = [
    {
      id: 'chats',
      label: 'All Chats',
      icon: MessageSquare,
      badge: unreadTotal > 0 ? unreadTotal : null,
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: Users,
    },
    {
      id: 'archived',
      label: 'Archived',
      icon: Archive,
    },
  ];

  const handleItemClick = (item) => {
    if (item.id === 'contacts') {
      navigate('/contacts');
      onNavChange?.('contacts');
    } else if (item.id === 'chats') {
      navigate('/chat');
      onNavChange?.('chats');
    } else if (item.id === 'archived') {
      navigate('/chat');
      onNavChange?.('archived');
    } else {
      onNavChange?.(item.id);
    }
  };

  return (
    <aside className="w-16 sm:w-18 md:w-20 flex flex-col items-center justify-between py-4 bg-charcoal-100/90 dark:bg-charcoal-950 border-r border-charcoal-200 dark:border-charcoal-800 shrink-0 select-none z-30 transition-colors">
      {/* Top: Brand Logo */}
      <div className="flex flex-col items-center gap-6">
        <NavLink
          to="/chat"
          className="group relative"
          title="PulseChat Web"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center text-white shadow-soft group-hover:shadow-emerald-glow/50 group-hover:scale-105 transition-all">
            <MessageSquare className="w-5 h-5 fill-current/20" />
          </div>
        </NavLink>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className={cn(
                  'relative p-3 rounded-2xl transition-all duration-200 group flex items-center justify-center',
                  isActive
                    ? 'bg-primary-600 text-white shadow-soft'
                    : 'text-charcoal-500 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:text-white hover:bg-charcoal-200/60 dark:hover:bg-charcoal-800/80'
                )}
                title={item.label}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5" />

                {/* Badge indicator */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-soft">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Design System Quick Access */}
          <NavLink
            to="/design-system"
            className={({ isActive }) =>
              cn(
                'p-3 rounded-2xl transition-all duration-200 flex items-center justify-center',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-charcoal-500 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:text-white hover:bg-charcoal-200/60 dark:hover:bg-charcoal-800/80'
              )
            }
            title="Design System & Component Library"
            aria-label="Design System"
          >
            <Layers className="w-5 h-5" />
          </NavLink>

          {/* Settings Link */}
          <NavLink
            to="/settings/profile"
            className={({ isActive }) =>
              cn(
                'p-3 rounded-2xl transition-all duration-200 flex items-center justify-center',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-charcoal-500 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:text-white hover:bg-charcoal-200/60 dark:hover:bg-charcoal-800/80'
              )
            }
            title="User Profile & Settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </NavLink>
        </nav>
      </div>

      {/* Bottom: Theme Switcher & User Avatar Popover */}
      <div className="flex flex-col items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl text-charcoal-500 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:text-white hover:bg-charcoal-200/60 dark:hover:bg-charcoal-800/80 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-5 h-5 text-charcoal-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* User Profile Avatar with Popup Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="relative cursor-pointer rounded-full p-0.5 hover:ring-2 ring-primary-500 transition-all"
            aria-label="User Account Menu"
            title={user?.name || 'User Menu'}
          >
            <Avatar
              src={user?.avatar}
              name={user?.name || 'User'}
              size="sm"
            />
            <div className="absolute -bottom-0.5 -right-0.5">
              <OnlineIndicator status={user?.status || 'online'} size="xs" />
            </div>
          </button>

          {/* User Popover Menu */}
          {showUserMenu && (
            <div className="absolute left-full bottom-0 ml-3 w-64 p-3 rounded-3xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 shadow-soft-lg animate-scale-in z-50 space-y-3">
              {/* Profile Card Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-charcoal-100 dark:border-charcoal-800">
                <Avatar
                  src={user?.avatar}
                  name={user?.name || 'User'}
                  size="md"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-charcoal-900 dark:text-white truncate">
                    {user?.name || 'Alex Morgan'}
                  </h4>
                  <p className="text-[11px] text-charcoal-500 truncate">
                    {user?.email || 'alex.morgan@pulsechat.io'}
                  </p>
                  <span className="inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    Online
                  </span>
                </div>
              </div>

              {/* Menu Links */}
              <div className="space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
                >
                  <User className="w-4 h-4 text-primary-600" />
                  <span>Profile & Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/design-system');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
                >
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Component System</span>
                </button>

                <div className="border-t border-charcoal-100 dark:border-charcoal-800 my-1" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;
