import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, Users, Layers, Settings, Moon, Sun, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import useTheme from '../../hooks/useTheme';
import useAuth from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import useToast from '../../hooks/useToast';

export const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    toast.info('You have logged out.');
    navigate('/login');
  };

  const navLinks = [
    { to: '/chat', label: 'Messages', icon: MessageSquare },
    { to: '/contacts', label: 'Contacts', icon: Users },
    { to: '/settings/profile', label: 'Settings', icon: Settings },
    { to: '/design-system', label: 'Design System', icon: Layers },
  ];

  return (
    <header className="h-16 border-b border-charcoal-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 transition-colors">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <NavLink to="/chat" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center text-white shadow-soft group-hover:shadow-emerald-glow/40 transition-all">
            <MessageSquare className="w-5 h-5 fill-current/20" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-charcoal-900 dark:text-white flex items-center gap-1.5">
              Pulse<span className="text-primary-600 dark:text-primary-400">Chat</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-1.5 py-0.2 rounded-md">
              Capstone
            </span>
          </div>
        </NavLink>
      </div>

      {/* Center Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 bg-charcoal-100/70 dark:bg-charcoal-800/60 p-1 rounded-2xl border border-charcoal-200/50 dark:border-charcoal-700/50">
        {navLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all',
                isActive
                  ? 'bg-white dark:bg-charcoal-700 text-primary-600 dark:text-primary-400 shadow-soft-sm'
                  : 'text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-white'
              )
            }
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark/Light mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-5 h-5 text-charcoal-700 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* User Avatar with Link to Profile */}
        {user ? (
          <div className="flex items-center gap-2.5 pl-2 border-l border-charcoal-200 dark:border-charcoal-800">
            <NavLink to="/settings/profile" className="flex items-center gap-2.5 group">
              <Avatar
                src={user.avatar}
                name={user.name}
                size="sm"
                status="online"
                className="group-hover:ring-2 ring-primary-500 transition-all"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-charcoal-900 dark:text-charcoal-100 leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {user.isDevMock ? 'Dev Sandbox' : 'Active'}
                </p>
              </div>
            </NavLink>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-charcoal-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <NavLink
              to="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
            >
              Sign In
            </NavLink>
            <NavLink
              to="/register"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-soft transition-all"
            >
              Sign Up
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
