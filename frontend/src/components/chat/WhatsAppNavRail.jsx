import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Phone,
  CircleDashed,
  Users2,
  Archive,
  Star,
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

/**
 * WhatsApp Desktop Style Icon Navigation Rail (Far Left Pane).
 * Spec Page 2:
 * "The app is a thin icon rail on the far left...
 *  Navigation rail: Chats, Calls, Status, Channels/Communities,
 *  then Archived, Starred and Settings at the bottom.
 *  Each icon shows a tooltip on hover and a green badge for unread counts."
 */
export const WhatsAppNavRail = ({
  activeSection = 'chats', // 'chats' | 'calls' | 'status' | 'communities' | 'archived' | 'starred' | 'settings'
  onSelectSection,
  unreadChatsCount = 0,
  missedCallsCount = 1,
  hasUnreadStatus = true,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const toast = useToast();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showUserMenu]);

  const topItems = [
    {
      id: 'chats',
      label: 'Chats',
      icon: MessageSquare,
      badge: unreadChatsCount > 0 ? unreadChatsCount : null,
    },
    {
      id: 'calls',
      label: 'Calls',
      icon: Phone,
      badge: missedCallsCount > 0 ? missedCallsCount : null,
      badgeColor: 'bg-emerald-500',
    },
    {
      id: 'status',
      label: 'Status',
      icon: CircleDashed,
      dot: hasUnreadStatus,
    },
    {
      id: 'communities',
      label: 'Communities',
      icon: Users2,
    },
  ];

  const bottomItems = [
    {
      id: 'archived',
      label: 'Archived',
      icon: Archive,
    },
    {
      id: 'starred',
      label: 'Starred messages',
      icon: Star,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleNavClick = (id) => {
    onSelectSection(id);
  };

  return (
    <aside className="w-14 sm:w-16 flex flex-col items-center justify-between py-3 bg-[#202C33] dark:bg-[#202C33] border-r border-[#222D34] shrink-0 select-none z-30 transition-colors">
      {/* Top Group: Brand / Main Nav */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {topItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'relative w-11 h-11 rounded-xl transition-all duration-150 flex items-center justify-center group',
                isActive
                  ? 'bg-[#374248] text-[#E9EDEF]'
                  : 'text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942]'
              )}
              title={item.label}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5 stroke-[1.8]" />

              {/* Active left indicator bar */}
              {isActive && (
                <span className="absolute -left-1.5 top-2 bottom-2 w-1 bg-[#00A884] rounded-r-full" />
              )}

              {/* Green badge with count */}
              {item.badge && (
                <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#00A884] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {item.badge}
                </span>
              )}

              {/* Status unread green dot */}
              {item.dot && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#00A884] ring-2 ring-[#202C33]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Group: Archived, Starred, Settings, Profile */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'relative w-11 h-11 rounded-xl transition-all duration-150 flex items-center justify-center group',
                isActive
                  ? 'bg-[#374248] text-[#E9EDEF]'
                  : 'text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942]'
              )}
              title={item.label}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5 stroke-[1.8]" />
              {isActive && (
                <span className="absolute -left-1.5 top-2 bottom-2 w-1 bg-[#00A884] rounded-r-full" />
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div className="w-8 h-px bg-[#222D34] my-1" />

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942] flex items-center justify-center transition-colors"
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Avatar + Popup Menu */}
        <div className="relative mt-1" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="relative rounded-full hover:ring-2 hover:ring-[#00A884] transition-all p-0.5 focus:outline-none"
            title={`${user?.name || 'Account'} (Click for options)`}
          >
            <Avatar
              src={user?.avatar}
              name={user?.name || 'Me'}
              size="sm"
            />
            <div className="absolute -bottom-0.5 -right-0.5">
              <OnlineIndicator status="online" size="sm" pulse={false} />
            </div>
          </button>

          {/* User Options Dropdown */}
          {showUserMenu && (
            <div className="absolute bottom-2 left-14 w-56 rounded-2xl bg-[#233138] border border-[#2A3942] shadow-2xl py-2 z-50 text-sm animate-scale-in">
              <div className="px-4 py-2 border-b border-[#2A3942]">
                <p className="font-semibold text-[#E9EDEF] truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-[#8696A0] truncate">{user?.email || 'online'}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  onSelectSection('settings');
                }}
                className="w-full px-4 py-2 text-left text-[#E9EDEF] hover:bg-[#111B21] flex items-center gap-2.5 transition-colors"
              >
                <User className="w-4 h-4 text-[#8696A0]" />
                <span>Profile & Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  onSelectSection('starred');
                }}
                className="w-full px-4 py-2 text-left text-[#E9EDEF] hover:bg-[#111B21] flex items-center gap-2.5 transition-colors"
              >
                <Star className="w-4 h-4 text-[#8696A0]" />
                <span>Starred Messages</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  toast.info('Signed out successfully.');
                }}
                className="w-full px-4 py-2 text-left text-rose-400 hover:bg-[#111B21] flex items-center gap-2.5 transition-colors border-t border-[#2A3942] mt-1"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default WhatsAppNavRail;
