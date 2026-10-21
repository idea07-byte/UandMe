import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { MessageSquare, ShieldCheck, Zap, Users, Moon, Sun } from 'lucide-react';
import useTheme from '../hooks/useTheme';

export const AuthLayout = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen w-screen flex flex-col lg:flex-row bg-charcoal-50 dark:bg-charcoal-950 text-charcoal-900 dark:text-charcoal-100 transition-colors">
      {/* Left Branding Showcase (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-charcoal-900 via-charcoal-950 to-primary-950 text-white p-12 flex-col justify-between overflow-hidden shrink-0">
        {/* Ambient Glow Effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center text-white shadow-emerald-glow group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6 fill-current/20" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">
                Pulse<span className="text-primary-400">Chat</span>
              </span>
              <p className="text-xs text-charcoal-400 font-medium">College Capstone Project</p>
            </div>
          </Link>
        </div>

        {/* Value Proposition Highlights */}
        <div className="relative z-10 space-y-8 my-auto max-w-md">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs font-bold uppercase tracking-wider">
              Phase 2: Authentication UI
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight leading-snug">
              Modern, secure real-time messaging built for students & teams.
            </h1>
            <p className="text-sm text-charcoal-300 leading-relaxed">
              Experience ultra-low latency messaging, fluid responsive design, and enterprise-grade security designed from the ground up.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Real-Time WebSockets</p>
                <p className="text-charcoal-400">Instant delivery and live typing indicators</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">End-to-End Encryption</p>
                <p className="text-charcoal-400">Your privacy and conversations remain protected</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Direct & Group Collaboration</p>
                <p className="text-charcoal-400">Seamless chat threads with file attachments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-charcoal-400 flex items-center justify-between border-t border-charcoal-800/80 pt-6">
          <span>© 2026 PulseChat Platform</span>
          <span className="text-primary-400 font-medium">Enterprise SaaS Auth Standard</span>
        </div>
      </div>

      {/* Right Form Container (Mobile + Desktop) */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative overflow-y-auto min-h-screen">
        {/* Floating Theme Switcher & Links */}
        <div className="w-full max-w-md flex items-center justify-between mb-4 lg:absolute lg:top-6 lg:right-6 lg:w-auto lg:mb-0">
          {/* Mobile brand header */}
          <Link to="/" className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center text-white shadow-soft">
              <MessageSquare className="w-4 h-4 fill-current/20" />
            </div>
            <span className="text-lg font-bold tracking-tight text-charcoal-900 dark:text-white">
              Pulse<span className="text-primary-600 dark:text-primary-400">Chat</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-charcoal-500 hover:text-charcoal-900 dark:text-charcoal-400 dark:hover:text-white hover:bg-charcoal-200/50 dark:hover:bg-charcoal-800 transition-colors ml-auto"
            title="Toggle color theme"
            aria-label="Toggle color theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Form Slot */}
        <div className="w-full max-w-md my-auto py-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
